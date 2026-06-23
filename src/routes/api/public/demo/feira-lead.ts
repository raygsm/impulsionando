// Public endpoint para captura de leads de feira/demo.
// Cria registro em demo_leads + demo_visit_sessions, dispara e-mail interno
// (marketing-lead-new para sac@) e e-mail de boas-vindas (demo-feira-welcome)
// para o lead, ambos via fila transacional. Sem auth — usa anon RLS.

import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

interface Input {
  name: string
  email: string
  phone: string
  niche?: string
  company?: string
  notes?: string
  origin?: string
  utm?: Record<string, string>
}

function validate(raw: any): { ok: true; value: Input } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'invalid_body' }
  const name = String(raw.name ?? '').trim().slice(0, 120)
  const email = String(raw.email ?? '').trim().toLowerCase().slice(0, 200)
  const phone = String(raw.phone ?? '').trim().slice(0, 40)
  if (!name) return { ok: false, error: 'missing_name' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: 'invalid_email' }
  if (phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'invalid_phone' }
  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      niche: raw.niche ? String(raw.niche).slice(0, 40) : undefined,
      company: raw.company ? String(raw.company).slice(0, 160) : undefined,
      notes: raw.notes ? String(raw.notes).slice(0, 2000) : undefined,
      origin: raw.origin ? String(raw.origin).slice(0, 40) : 'feira',
      utm: raw.utm && typeof raw.utm === 'object' ? raw.utm : undefined,
    },
  }
}

async function queueEmail(template: string, to: string, templateData: Record<string, any>, metadata: Record<string, any>) {
  try {
    const React = await import('react')
    const { render } = await import('@react-email/components')
    const { TEMPLATES } = await import('@/lib/email-templates/registry')
    const tpl = TEMPLATES[template]
    if (!tpl) return { ok: false, error: 'no_template' }
    const recipient = (tpl.to ?? to).trim()
    if (!recipient) return { ok: false, error: 'no_recipient' }

    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', recipient.toLowerCase())
      .maybeSingle()
    const messageId = crypto.randomUUID()
    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId, template_name: template, recipient_email: recipient,
        status: 'suppressed', metadata,
      })
      return { ok: true, status: 'suppressed', messageId }
    }

    const element = React.createElement(tpl.component as any, templateData)
    const [html, text] = await Promise.all([render(element), render(element, { plainText: true })])
    const subject = typeof tpl.subject === 'function' ? tpl.subject(templateData) : tpl.subject

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId, template_name: template, recipient_email: recipient,
      status: 'pending', metadata,
    })

    await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: 'Impulsionando <noreply@www.impulsionando.com.br>',
        sender_domain: 'notify.www.impulsionando.com.br',
        subject,
        html,
        text,
        purpose: 'transactional',
        label: template,
        idempotency_key: `${template}-${messageId}`,
        queued_at: new Date().toISOString(),
      },
    })
    return { ok: true, status: 'queued', messageId }
  } catch (e: any) {
    console.error('feira-lead queueEmail failed', { template, err: e?.message })
    return { ok: false, error: e?.message ?? 'unknown' }
  }
}

export const Route = createFileRoute('/api/public/demo/feira-lead')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: any
        try { raw = await request.json() } catch { return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }
        const parsed = validate(raw)
        if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 })
        const input = parsed.value

        const userAgent = request.headers.get('user-agent') ?? null
        const ipHash = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || ''

        // niche name lookup (best-effort)
        let nicheName: string | undefined
        if (input.niche) {
          const { data: n } = await supabaseAdmin.from('niches').select('name').eq('slug', input.niche).maybeSingle()
          nicheName = n?.name ?? input.niche
        }

        // 1) cria sessão de visita anônima
        const { data: sess } = await supabaseAdmin
          .from('demo_visit_sessions')
          .insert({
            niche: input.niche ?? 'generico',
            user_agent: userAgent,
            ip_hash: ipHash ? `sha:${ipHash.slice(0, 32)}` : null,
            viewed_modules: [],
            selected_modules: [],
          })
          .select('id')
          .single()

        // 2) cria lead
        const { data: lead, error: leadErr } = await supabaseAdmin
          .from('demo_leads')
          .insert({
            session_id: sess?.id ?? crypto.randomUUID(),
            name: input.name,
            email: input.email,
            phone: input.phone,
            niche: input.niche ?? null,
            origin: input.origin ?? 'feira',
            notes: input.notes ?? null,
            tags: input.utm ? Object.entries(input.utm).map(([k, v]) => `${k}:${v}`) : [],
            status: 'novo',
          })
          .select('id')
          .single()

        if (leadErr) {
          return Response.json({ ok: false, error: 'lead_insert_failed', detail: leadErr.message }, { status: 500 })
        }

        const demoUrl = input.niche
          ? `https://impulsionando.com.br/demo/nicho/${input.niche}`
          : 'https://impulsionando.com.br/demo'
        const whatsappUrl = 'https://wa.me/5521993075000'

        // 3) e-mail interno para o time comercial
        await queueEmail('marketing-lead-new', 'sac@impulsionando.com.br', {
          leadName: input.name,
          leadEmail: input.email,
          leadPhone: input.phone,
          leadCompany: input.company,
          leadSource: `feira/${input.niche ?? 'generico'}`,
          leadMessage: input.notes,
          pageUrl: demoUrl,
          createdAt: new Date().toISOString(),
        }, { source: 'feira', lead_id: lead.id, niche: input.niche ?? null })

        // 4) confirmação para o lead
        await queueEmail('demo-feira-welcome', input.email, {
          name: input.name.split(' ')[0],
          nicheName,
          demoUrl,
          whatsappUrl,
        }, { source: 'feira', lead_id: lead.id, niche: input.niche ?? null })

        return Response.json({
          ok: true,
          lead_id: lead.id,
          session_id: sess?.id,
          demo_url: demoUrl,
        })
      },
    },
  },
})
