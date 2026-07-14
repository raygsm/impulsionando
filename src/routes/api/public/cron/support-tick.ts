// Cron do Suporte Inteligente — roda a cada 5 minutos via pg_cron.
// 1) Marca SLA breach e cria evento.
// 2) Auto-fecha tickets em waiting_customer há mais de 7 dias.
// 3) Dispara IA para resumir/categorizar tickets sem ai_topic.
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/cron/support-tick')({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const now = new Date()
        const breachThreshold = now.toISOString()

        // 1) SLA breach
        const { data: breaches } = await supabaseAdmin
          .from('support_tickets')
          .select('id, status, sla_due_at')
          .lt('sla_due_at', breachThreshold)
          .not('status', 'in', '(resolved,closed,cancelled)')
          .is('first_response_at', null)
          .limit(200)

        for (const t of breaches ?? []) {
          await supabaseAdmin.from('support_ticket_events').insert({
            ticket_id: t.id,
            event_type: 'sla_breach',
            metadata: { sla_due_at: t.sla_due_at, observed_at: breachThreshold },
          })
        }

        // 2) Auto-fechar tickets aguardando cliente há > 7d
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
        const { data: stale } = await supabaseAdmin
          .from('support_tickets')
          .select('id')
          .eq('status', 'waiting_customer')
          .lt('waiting_customer_since', sevenDaysAgo)
          .limit(100)

        for (const t of stale ?? []) {
          await supabaseAdmin.from('support_tickets')
            .update({ status: 'closed', closed_at: new Date().toISOString() })
            .eq('id', t.id)
        }

        // 3) IA — categorização de até 20 tickets sem ai_topic
        const key = (process.env.OPENAI_COMPATIBLE_API_KEY ?? process.env.OPENAI_API_KEY)
        let aiProcessed = 0
        if (key) {
          const { data: pending } = await supabaseAdmin
            .from('support_tickets')
            .select('id, subject, description, type, company_id')
            .is('ai_topic', null)
            .gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString())
            .order('created_at', { ascending: false })
            .limit(20)

          if (pending?.length) {
            const { generateText } = await import('ai')
            const { createLovableAiGatewayProvider } = await import('@/lib/ai-gateway.server')
            const gateway = createLovableAiGatewayProvider(key)
            const model = gateway('google/gemini-2.5-flash')

            for (const t of pending) {
              try {
                const { text } = await generateText({
                  model,
                  system: 'Categoriza tickets em um tema curto (2-4 palavras) + resumo de 1 frase. Responda APENAS JSON: {"topic":"...","summary":"..."}.',
                  prompt: `Assunto: ${t.subject}\nTipo: ${t.type}\nDescrição: ${(t.description ?? '').slice(0, 800)}`,
                })
                const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
                if (json.topic && json.summary) {
                  await supabaseAdmin.from('support_tickets').update({
                    ai_topic: String(json.topic).slice(0, 80),
                    ai_summary: String(json.summary).slice(0, 400),
                  }).eq('id', t.id)
                  aiProcessed++
                }
              } catch { /* skip */ }
            }

            // Agregação diária por company
            const today = new Date().toISOString().slice(0, 10)
            const { data: dayRows } = await supabaseAdmin
              .from('support_tickets')
              .select('company_id, ai_topic')
              .gte('created_at', today + 'T00:00:00.000Z')
              .not('ai_topic', 'is', null)
            const counts = new Map<string, number>()
            for (const r of dayRows ?? []) {
              const k = `${r.company_id ?? 'null'}|${r.ai_topic}`
              counts.set(k, (counts.get(k) ?? 0) + 1)
            }
            const totals = new Map<string, number>()
            for (const [k, c] of counts) totals.set(k.split('|')[0], (totals.get(k.split('|')[0]) ?? 0) + c)
            for (const [k, count] of counts) {
              const [comp, topic] = k.split('|')
              await supabaseAdmin.from('support_ticket_topics_daily').upsert({
                company_id: comp === 'null' ? null : comp,
                day: today, topic, ticket_count: count,
                percentage: +(count * 100 / (totals.get(comp) ?? 1)).toFixed(2),
              }, { onConflict: 'company_id,day,topic' })
            }
          }
        }

        return Response.json({
          ok: true,
          breaches: breaches?.length ?? 0,
          auto_closed: stale?.length ?? 0,
          ai_processed: aiProcessed,
        })
      },
    },
  },
})
