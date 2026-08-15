import { createFileRoute } from '@tanstack/react-router'
import { ensureDailyWhereaboutsRequest } from '@/lib/wmp/whereabouts.server'

function authorized(request: Request) {
  const candidates = [
    process.env.WMP_DAILY_JOB_TOKEN,
    process.env.CRON_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter(Boolean) as string[]
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || ''
  return Boolean(supplied && candidates.some((value) => supplied === value))
}

export const Route = createFileRoute('/api/wmp/whereabouts/daily')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) return Response.json({ error: 'unauthorized' }, { status: 401 })
        try {
          const result = await ensureDailyWhereaboutsRequest()
          return Response.json({ ok: true, ...result })
        } catch (error) {
          console.error('[wmp-whereabouts-daily]', error)
          return Response.json({ error: 'daily_request_failed' }, { status: 500 })
        }
      },
    },
  },
})
