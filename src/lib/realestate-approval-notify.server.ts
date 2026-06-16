import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'
const SITE_NAME = 'Impulsionando'
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://www.impulsionando.com.br'

type ApprovalEvent = 'submitted' | 'approved' | 'rejected' | 'changes_requested'

async function generateToken(): Promise<string> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function ensureUnsubscribeToken(email: string): Promise<string> {
  const normalized = email.toLowerCase()
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalized)
    .maybeSingle()
  if (existing && !existing.used_at) return existing.token
  const token = await generateToken()
  await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .upsert({ token, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
  const { data: final } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalized)
    .maybeSingle()
  return final?.token ?? token
}

export interface NotifyApprovalArgs {
  event: ApprovalEvent
  propertyId: string
  companyId: string
  propertyTitle: string
  referenceCode: string | null
  submitterUserId: string | null
  reviewerUserId: string | null
  notes: string | null
}

const NOTIF_TITLE: Record<ApprovalEvent, string> = {
  submitted: 'Imóvel aguardando aprovação',
  approved: 'Imóvel aprovado',
  rejected: 'Imóvel rejeitado',
  changes_requested: 'Ajustes solicitados',
}

const NOTIF_SEVERITY: Record<ApprovalEvent, string> = {
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
  changes_requested: 'warning',
}

async function getApproverUserIds(companyId: string): Promise<string[]> {
  // Users that hold the approve permission via profile, in this company.
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, profile_id, profile_permissions:profile_id(permission_id, permissions:permission_id(code))')
    .eq('company_id', companyId)
    .eq('is_active', true)
  if (error || !data) return []
  const ids = new Set<string>()
  for (const row of data as any[]) {
    const perms = row.profile_permissions ?? []
    const list = Array.isArray(perms) ? perms : [perms]
    for (const p of list) {
      const code = p?.permissions?.code
      if (code === 'realestate.property.approve') {
        ids.add(row.user_id)
        break
      }
    }
  }
  return Array.from(ids)
}

async function getUserContacts(userIds: string[]): Promise<Array<{ id: string; email: string | null; display_name: string | null }>> {
  if (!userIds.length) return []
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, email, display_name')
    .in('user_id', userIds)
  const seen = new Map<string, { id: string; email: string | null; display_name: string | null }>()
  for (const row of (data ?? []) as any[]) {
    if (!seen.has(row.user_id)) {
      seen.set(row.user_id, { id: row.user_id, email: row.email ?? null, display_name: row.display_name ?? null })
    }
  }
  return Array.from(seen.values())
}

async function sendEmail(args: {
  to: string
  templateData: Record<string, unknown>
  idempotencyKey: string
}): Promise<void> {
  const tpl = TEMPLATES['realestate-property-approval']
  if (!tpl) return
  const element = React.createElement(tpl.component as any, args.templateData)
  const [html, text] = await Promise.all([
    renderAsync(element),
    renderAsync(element, { plainText: true }),
  ])
  const subject = typeof tpl.subject === 'function' ? tpl.subject(args.templateData) : tpl.subject
  const recipient = args.to.trim()

  // suppression
  const { data: suppressed } = await supabaseAdmin
    .from('suppressed_emails')
    .select('id')
    .eq('email', recipient.toLowerCase())
    .maybeSingle()

  const messageId = crypto.randomUUID()

  if (suppressed) {
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'realestate-property-approval',
      recipient_email: recipient,
      status: 'suppressed',
    })
    return
  }

  const unsubscribe_token = await ensureUnsubscribeToken(recipient)
  await supabaseAdmin.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'realestate-property-approval',
    recipient_email: recipient,
    status: 'pending',
  })
  await supabaseAdmin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: 'realestate-property-approval',
      idempotency_key: args.idempotencyKey,
      unsubscribe_token,
      queued_at: new Date().toISOString(),
    },
  })
}

export async function notifyPropertyApprovalEvent(args: NotifyApprovalArgs): Promise<void> {
  const { event, propertyId, companyId, propertyTitle, referenceCode, submitterUserId, reviewerUserId, notes } = args

  // Recipients:
  // - submitted → all approvers (excluding the submitter)
  // - approved/rejected/changes_requested → the submitter
  let recipientUserIds: string[] = []
  if (event === 'submitted') {
    recipientUserIds = (await getApproverUserIds(companyId)).filter((id) => id !== submitterUserId)
  } else if (submitterUserId) {
    recipientUserIds = [submitterUserId]
  }

  if (!recipientUserIds.length) return

  // Notification preference category for this event
  const prefCategory = event === 'submitted' ? 'realestate.approval.submitted' : 'realestate.approval.decision'
  const { data: prefs } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id, channel, enabled')
    .in('user_id', recipientUserIds)
    .is('company_id', null)
    .eq('category', prefCategory)
  const prefMap = new Map<string, { in_app: boolean; email: boolean }>()
  for (const uid of recipientUserIds) prefMap.set(uid, { in_app: true, email: true })
  for (const row of (prefs ?? []) as any[]) {
    const cur = prefMap.get(row.user_id)!
    if (row.channel === 'in_app') cur.in_app = !!row.enabled
    else if (row.channel === 'email') cur.email = !!row.enabled
  }

  // Company name (for email body)
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .maybeSingle()
  const companyName = (company as any)?.name as string | undefined

  // Reviewer + submitter display
  const involved = await getUserContacts(
    [submitterUserId, reviewerUserId].filter(Boolean) as string[],
  )
  const reviewerName = involved.find((u) => u.id === reviewerUserId)?.display_name ?? null
  const submitterName = involved.find((u) => u.id === submitterUserId)?.display_name ?? null

  const actionUrl =
    event === 'submitted'
      ? `${APP_BASE_URL}/imobiliaria/aprovacoes`
      : `${APP_BASE_URL}/imobiliaria/imoveis`

  // In-app notifications — only for users who opted in
  const inAppRecipients = recipientUserIds.filter((uid) => prefMap.get(uid)?.in_app !== false)
  if (inAppRecipients.length) {
    await supabaseAdmin.from('notifications').insert(
      inAppRecipients.map((uid) => ({
        user_id: uid,
        company_id: companyId,
        category: 'realestate.approval',
        severity: NOTIF_SEVERITY[event],
        title: NOTIF_TITLE[event],
        message: `${propertyTitle}${notes ? ` — ${notes}` : ''}`,
        action_url: actionUrl,
        action_label: event === 'submitted' ? 'Revisar' : 'Abrir imóvel',
      })),
    )
  }

  // Email — only for users who opted in
  const emailUserIds = recipientUserIds.filter((uid) => prefMap.get(uid)?.email !== false)
  const contacts = await getUserContacts(emailUserIds)
  for (const contact of contacts) {
    if (!contact.email) continue
    try {
      await sendEmail({
        to: contact.email,
        templateData: {
          event,
          propertyTitle,
          referenceCode,
          submitterName,
          reviewerName,
          notes,
          companyName,
          actionUrl,
        },
        idempotencyKey: `realestate-approval-${propertyId}-${event}-${contact.id}`,
      })
    } catch (err) {
      console.error('notifyPropertyApprovalEvent: email failed', { propertyId, event, userId: contact.id, err })
    }
  }
}

