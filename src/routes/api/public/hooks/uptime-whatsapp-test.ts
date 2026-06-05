import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendWhatsAppText } from '@/lib/zapi.server'

// One-shot test: envia uma mensagem "hello world" para todos os números
// cadastrados em uptime_state.alert_whatsapps.
export const Route = createFileRoute('/api/public/hooks/uptime-whatsapp-test')({
  server: {
    handlers: {
      POST: async () => {
        const { data: rows, error } = await supabaseAdmin
          .from('uptime_state')
          .select('url, alert_whatsapps')
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 })

        const results: Array<{ phone: string; ok: boolean; status: number; body: string }> = []
        const msg = `✅ Teste de alerta — Impulsionando Uptime\n\nSe você recebeu esta mensagem, o canal WhatsApp está funcionando. Você será avisado se ${rows?.[0]?.url ?? 'o site'} cair ou voltar ao ar.`
        const seen = new Set<string>()
        for (const r of rows ?? []) {
          for (const phone of r.alert_whatsapps ?? []) {
            if (seen.has(phone)) continue
            seen.add(phone)
            const wa = await sendWhatsAppText({ phone, message: msg })
            results.push({ phone, ...wa })
          }
        }
        return Response.json({ ok: true, results })
      },
    },
  },
})
