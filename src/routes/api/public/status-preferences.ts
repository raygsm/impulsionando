import { createFileRoute } from '@tanstack/react-router'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${escapeHtml(title)} · Impulsionando</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<style>
:root{color-scheme:dark}
body{font-family:system-ui,-apple-system,sans-serif;background:#0b0f1a;color:#e6edf7;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
.card{max-width:560px;width:100%;padding:32px;border-radius:14px;background:#121829;border:1px solid #1f2a44}
h1{font-size:22px;margin:0 0 6px} .muted{color:#9aa7c2;font-size:14px;margin:0 0 20px}
.list{display:grid;gap:10px;max-height:50vh;overflow:auto;padding:12px;border:1px solid #1f2a44;border-radius:10px;background:#0e1422;margin-bottom:18px}
label{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;padding:6px 8px;border-radius:6px}
label:hover{background:#172033}
input[type=checkbox]{width:16px;height:16px;accent-color:#7cc1ff}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between}
button,.btn{appearance:none;border:1px solid #2a3a5e;background:#1a2440;color:#e6edf7;padding:10px 16px;border-radius:8px;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
button.primary{background:#1d4ed8;border-color:#2a5cf0}
button.danger{background:transparent;border-color:#7f1d1d;color:#fca5a5}
a{color:#7cc1ff;text-decoration:none}
.ok{background:#064e3b;border:1px solid #10b981;color:#a7f3d0;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-size:14px}
.err{background:#4c0519;border:1px solid #ef4444;color:#fecaca;padding:10px 12px;border-radius:8px;margin-bottom:14px;font-size:14px}
.small{font-size:12px;color:#7a8aa8;margin-top:14px}
</style></head>
<body><div class="card">${body}<p class="small"><a href="/status">← Voltar à página de status</a></p></div></body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export const Route = createFileRoute('/api/public/status-preferences')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = url.searchParams.get('token') ?? ''
        const saved = url.searchParams.get('saved') === '1'
        if (token.length < 16) return page('Token inválido', `<h1>Token inválido</h1><p class="muted">O link de preferências está incompleto.</p>`, 400)

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: sub } = await supabaseAdmin
          .from('core_status_subscribers')
          .select('id, email, unsubscribed_at, notify_incidents, notify_maintenance, categories')
          .eq('unsubscribe_token', token)
          .maybeSingle()

        if (!sub) return page('Não encontrado', `<h1>Inscrição não localizada</h1><p class="muted">Verifique se você copiou o link completo do email.</p>`, 404)

        if ((sub as any).unsubscribed_at) {
          return page('Inscrição cancelada', `<h1>Inscrição cancelada</h1><p class="muted">Esta inscrição (${escapeHtml((sub as any).email)}) está desativada. Para receber novamente, inscreva-se em <a href="/status">/status</a>.</p>`)
        }

        const { data: services } = await supabaseAdmin
          .from('uptime_state')
          .select('public_slug, label, url, show_on_public, category')
          .eq('show_on_public', true)
          .not('public_slug', 'is', null)
          .order('sort_order', { ascending: true })
          .order('label', { ascending: true })

        const { data: selected } = await supabaseAdmin
          .from('core_status_subscriber_services' as any)
          .select('service_slug')
          .eq('subscriber_id', (sub as any).id)

        const selectedSet = new Set(((selected as any[]) ?? []).map((r) => r.service_slug))
        const allMode = selectedSet.size === 0

        const checkboxes = ((services as any[]) ?? [])
          .map((s) => {
            const slug = s.public_slug as string
            const label = (s.label as string) || slug
            const checked = allMode || selectedSet.has(slug) ? 'checked' : ''
            return `<label><input type="checkbox" name="services" value="${escapeHtml(slug)}" ${checked}/> <span>${escapeHtml(label)}</span></label>`
          })
          .join('')

        const banner = saved ? `<div class="ok">Preferências atualizadas com sucesso.</div>` : ''
        const notifInc = (sub as any).notify_incidents !== false
        const notifMan = (sub as any).notify_maintenance !== false

        const subCats = new Set<string>(((sub as any).categories ?? []) as string[])
        const allCategories = Array.from(
          new Set(((services as any[]) ?? []).map((s) => s.category).filter(Boolean) as string[]),
        ).sort()
        const catBoxes = allCategories
          .map((c) => {
            const checked = subCats.has(c) ? 'checked' : ''
            return `<label><input type="checkbox" name="categories" value="${escapeHtml(c)}" ${checked}/> <span>${escapeHtml(c)}</span></label>`
          })
          .join('')

        const body = `
${banner}
<h1>Preferências de notificação</h1>
<p class="muted">Receber atualizações sobre <strong>${escapeHtml((sub as any).email)}</strong>.</p>
<form method="POST" action="/api/public/status-preferences">
  <input type="hidden" name="token" value="${escapeHtml(token)}"/>
  <h2 style="font-size:15px;margin:18px 0 8px">Tipos de aviso</h2>
  <div class="list" style="max-height:none">
    <label><input type="checkbox" name="notify_incidents" value="1" ${notifInc ? 'checked' : ''}/> <span>Incidentes (abertura, atualizações, resolução, postmortem)</span></label>
    <label><input type="checkbox" name="notify_maintenance" value="1" ${notifMan ? 'checked' : ''}/> <span>Manutenções programadas (lembrete, início, fim)</span></label>
  </div>
  ${allCategories.length > 0 ? `<h2 style="font-size:15px;margin:18px 0 8px">Categorias / seções</h2>
  <p class="muted" style="margin:-4px 0 8px;font-size:12px">Marque para receber apenas dessas seções — nenhuma marcada equivale a "todas".</p>
  <div class="list">${catBoxes}</div>` : ''}
  <h2 style="font-size:15px;margin:18px 0 8px">Serviços</h2>
  <p class="muted" style="margin:-4px 0 8px;font-size:12px">Marque os serviços desejados — nenhum marcado equivale a "todos".</p>
  <div class="list">${checkboxes || '<p class="muted" style="margin:0">Nenhum serviço público disponível.</p>'}</div>
  <div class="row">
    <button class="primary" type="submit">Salvar preferências</button>
    <a class="btn danger" href="/api/public/status-unsubscribe?token=${encodeURIComponent(token)}">Cancelar inscrição</a>
  </div>
</form>`
        return page('Preferências de Status', body)
      },

      POST: async ({ request }) => {
        const form = await request.formData()
        const token = String(form.get('token') ?? '')
        if (token.length < 16) return page('Token inválido', `<h1>Token inválido</h1>`, 400)

        const services = Array.from(new Set(form.getAll('services').map((v) => String(v).toLowerCase()).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)))).slice(0, 100)

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data: sub } = await supabaseAdmin
          .from('core_status_subscribers')
          .select('id, unsubscribed_at')
          .eq('unsubscribe_token', token)
          .maybeSingle()

        if (!sub) return page('Não encontrado', `<h1>Inscrição não localizada</h1>`, 404)
        if ((sub as any).unsubscribed_at) {
          return page('Inscrição cancelada', `<h1>Inscrição cancelada</h1><p class="muted">Reative em <a href="/status">/status</a>.</p>`)
        }

        const notify_incidents = form.get('notify_incidents') === '1'
        const notify_maintenance = form.get('notify_maintenance') === '1'

        await supabaseAdmin
          .from('core_status_subscribers')
          .update({ notify_incidents, notify_maintenance })
          .eq('id', (sub as any).id)

        await supabaseAdmin
          .from('core_status_subscriber_services' as any)
          .delete()
          .eq('subscriber_id', (sub as any).id)

        if (services.length > 0) {
          await supabaseAdmin
            .from('core_status_subscriber_services' as any)
            .insert(services.map((slug) => ({ subscriber_id: (sub as any).id, service_slug: slug })))
        }

        return Response.redirect(new URL(`/api/public/status-preferences?token=${encodeURIComponent(token)}&saved=1`, request.url), 303)
      },
    },
  },
})
