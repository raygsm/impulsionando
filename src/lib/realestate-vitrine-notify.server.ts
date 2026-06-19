/**
 * Real estate vitrine — server-side notification engine.
 *
 * Reusable for both public interest and public saved-search flows.
 * Sends emails via the queue, creates in-app notifications, respects
 * user notification preferences when available.
 *
 * SERVER-ONLY: never import into client modules.
 */
import * as React from 'react'
import { render as renderAsync } from '@react-email/components'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SENDER_DOMAIN = 'notify.www.impulsionando.com.br'
const FROM_DOMAIN = 'www.impulsionando.com.br'
const SITE_NAME = 'Impulsionando'
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://www.impulsionando.com.br'

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
  if (existing && !existing.used_at) return (existing as any).token
  const token = await generateToken()
  await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .upsert({ token, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
  const { data: final } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', normalized)
    .maybeSingle()
  return (final as any)?.token ?? token
}

export async function sendVitrineEmail(args: {
  templateName: string
  to: string
  templateData: Record<string, unknown>
  idempotencyKey: string
  requestId?: string
  metadata?: Record<string, unknown>
}): Promise<{ status: 'queued' | 'suppressed' | 'no_template' | 'error'; messageId?: string; error?: string }> {
  const tpl = TEMPLATES[args.templateName]
  if (!tpl) return { status: 'no_template' }
  const recipient = args.to.trim()
  if (!recipient) return { status: 'error', error: 'recipient_missing' }
  const baseMeta = { ...(args.metadata ?? {}), request_id: args.requestId ?? null, idempotency_key: args.idempotencyKey }
  try {
    const element = React.createElement(tpl.component as any, args.templateData)
    const [html, text] = await Promise.all([
      renderAsync(element),
      renderAsync(element, { plainText: true }),
    ])
    const subject = typeof tpl.subject === 'function' ? tpl.subject(args.templateData) : tpl.subject

    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', recipient.toLowerCase())
      .maybeSingle()

    const messageId = crypto.randomUUID()

    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: args.templateName,
        recipient_email: recipient,
        status: 'suppressed',
        metadata: baseMeta,
      })
      return { status: 'suppressed', messageId }
    }

    const unsubscribe_token = await ensureUnsubscribeToken(recipient)
    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: args.templateName,
      recipient_email: recipient,
      status: 'pending',
      metadata: baseMeta,
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
        label: args.templateName,
        idempotency_key: args.idempotencyKey,
        request_id: args.requestId ?? null,
        unsubscribe_token,
        queued_at: new Date().toISOString(),
      },
    })
    return { status: 'queued', messageId }
  } catch (err: any) {
    console.error('sendVitrineEmail failed', { template: args.templateName, requestId: args.requestId, err })
    try {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: args.templateName,
        recipient_email: recipient,
        status: 'failed',
        error_message: err?.message ?? 'unknown',
        metadata: baseMeta,
      })
    } catch {}
    return { status: 'error', error: err?.message ?? 'unknown' }
  }
}

async function getCompanyManagerUserIds(companyId: string): Promise<string[]> {
  // Resolve the permission ids that grant manager-level access to the vitrine
  // flows. We do explicit queries instead of a PostgREST nested embed because
  // there is no direct FK from user_profiles to profile_permissions (both
  // reference profiles.id), so the embed silently returns nothing.
  const { data: perms, error: pErr } = await supabaseAdmin
    .from('permissions')
    .select('id, code')
    .in('code', ['realestate.interest.read', 'realestate.message.read'])
  if (pErr) {
    console.warn('[notifyManagers] permissions lookup failed', pErr)
    return []
  }
  const permIds = (perms ?? []).map((p: any) => p.id as string)
  if (!permIds.length) return []
  const { data: pp, error: ppErr } = await supabaseAdmin
    .from('profile_permissions')
    .select('profile_id')
    .in('permission_id', permIds)
  if (ppErr) {
    console.warn('[notifyManagers] profile_permissions lookup failed', ppErr)
    return []
  }
  const profileIds = Array.from(new Set((pp ?? []).map((r: any) => r.profile_id as string)))
  if (!profileIds.length) return []
  const { data: users, error: uErr } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .in('profile_id', profileIds)
  if (uErr) {
    console.warn('[notifyManagers] user_profiles lookup failed', uErr)
    return []
  }
  const ids = new Set<string>()
  for (const row of (users ?? []) as any[]) ids.add(row.user_id)
  return Array.from(ids)
}

async function getUserContacts(userIds: string[]) {
  if (!userIds.length) return []
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('user_id, email, display_name')
    .in('user_id', userIds)
  const map = new Map<string, { id: string; email: string | null; display_name: string | null }>()
  for (const row of (data ?? []) as any[]) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, { id: row.user_id, email: row.email ?? null, display_name: row.display_name ?? null })
    }
  }
  return Array.from(map.values())
}

async function getNotificationPrefs(userIds: string[], category: string) {
  const map = new Map<string, { in_app: boolean; email: boolean }>()
  for (const uid of userIds) map.set(uid, { in_app: true, email: true })
  if (!userIds.length) return map
  const { data } = await supabaseAdmin
    .from('notification_preferences')
    .select('user_id, channel, enabled')
    .in('user_id', userIds)
    .is('company_id', null)
    .eq('category', category)
  for (const row of (data ?? []) as any[]) {
    const cur = map.get(row.user_id)!
    if (row.channel === 'in_app') cur.in_app = !!row.enabled
    else if (row.channel === 'email') cur.email = !!row.enabled
  }
  return map
}

export async function notifyManagers(args: {
  companyId: string
  title: string
  message: string
  category: string
  severity?: 'info' | 'success' | 'warning' | 'error'
  actionUrl: string
  actionLabel: string
}): Promise<{ userIds: string[]; contacts: Array<{ id: string; email: string | null; display_name: string | null }> }> {
  const userIds = await getCompanyManagerUserIds(args.companyId)
  if (!userIds.length) return { userIds: [], contacts: [] }
  const prefs = await getNotificationPrefs(userIds, args.category)
  const inAppRecipients = userIds.filter((uid) => prefs.get(uid)?.in_app !== false)
  if (inAppRecipients.length) {
    await supabaseAdmin.from('notifications').insert(
      inAppRecipients.map((uid) => ({
        user_id: uid,
        company_id: args.companyId,
        category: args.category,
        severity: args.severity ?? 'info',
        title: args.title,
        message: args.message,
        action_url: args.actionUrl,
        action_label: args.actionLabel,
      })),
    )
  }
  const emailUserIds = userIds.filter((uid) => prefs.get(uid)?.email !== false)
  const contacts = await getUserContacts(emailUserIds)
  return { userIds, contacts }
}

export { APP_BASE_URL }
