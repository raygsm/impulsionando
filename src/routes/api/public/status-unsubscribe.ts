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

export const Route = createFileRoute('/api/public/status-unsubscribe')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const token = url.searchParams.get('token')
        if (!token || token.length < 16) return htmlPage('Token inválido', 'O link de cancelamento está incompleto.')

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { data } = await supabaseAdmin
          .from('core_status_subscribers')
          .select('id')
          .eq('unsubscribe_token', token)
          .maybeSingle()

        if (!data) return htmlPage('Não encontrado', 'Inscrição não localizada.')

        await supabaseAdmin
          .from('core_status_subscribers')
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq('id', data.id)

        return htmlPage('Inscrição cancelada', 'Você não receberá mais atualizações de status. Pode se reinscrever quando quiser em /status.')
      },
    },
  },
})
