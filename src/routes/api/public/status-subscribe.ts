import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const BodySchema = z.object({
  email: z.string().email().max(320),
  source: z.string().max(60).optional(),
  services: z
    .array(z.string().regex(/^[a-z0-9-]{1,80}$/))
    .max(50)
    .optional(),
})

export const Route = createFileRoute('/api/public/status-subscribe')({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }),
      POST: async ({ request }) => {
        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return Response.json({ error: 'invalid_json' }, { status: 400 })
        }
        const parsed = BodySchema.safeParse(payload)
        if (!parsed.success) {
          return Response.json({ error: 'invalid_email' }, { status: 400 })
        }

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        )

        const email = parsed.data.email.trim().toLowerCase()
        const source = parsed.data.source ?? 'status_page'

        const { error } = await supabase
          .from('core_status_subscribers')
          .insert({ email, source })

        if (error && !/duplicate|unique/i.test(error.message)) {
          return Response.json({ error: 'insert_failed' }, { status: 500 })
        }

        // Always respond OK (no enumeration). Confirmation email is sent by cron.
        return Response.json(
          { ok: true, message: 'Verifique seu email para confirmar a inscrição.' },
          { headers: { 'Access-Control-Allow-Origin': '*' } },
        )
      },
    },
  },
})
