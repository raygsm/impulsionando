import { createFileRoute } from '@tanstack/react-router'

function htmlPage(title: string, message: string): Response {
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${title} · Impulsionando</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b0f1a;color:#e6edf7;display:grid;place-items:center;min-height:100vh;margin:0}
.card{max-width:480px;padding:32px;border-radius:14px;background:#121829;border:1px solid #1f2a44;text-align:center}
h1{font-size:20px;margin:0 0 12px} p{color:#9aa7c2;margin:0 0 16px}
a{color:#7cc1ff;text-decoration:none}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p><p><a href="/status">Voltar à página de status</a></p></div></body></html>`
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export const Route = createFileRoute('/api/public/status-confirm')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = url.searchParams.get('token')
        if (!token || token.length < 16) return htmlPage('Token inválido', 'O link de confirmação está incompleto ou expirado.')

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data, error } = await supabaseAdmin
          .from('core_status_subscribers')
          .select('id, confirmed_at')
          .eq('confirm_token', token)
          .maybeSingle()

        if (error || !data) return htmlPage('Não encontrado', 'Inscrição não localizada. Você pode se inscrever novamente em /status.')

        if (!data.confirmed_at) {
          await supabaseAdmin
            .from('core_status_subscribers')
            .update({ confirmed_at: new Date().toISOString(), unsubscribed_at: null })
            .eq('id', data.id)
        }
        return htmlPage('Inscrição confirmada', 'Você receberá atualizações de incidentes e postmortems publicados.')
      },
    },
  },
})
