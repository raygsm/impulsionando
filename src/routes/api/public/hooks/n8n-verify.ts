import { createFileRoute } from '@tanstack/react-router'
import { handleN8nVerifyGet, handleN8nVerifyPost } from '@/lib/n8n-verify.server'

export const Route = createFileRoute('/api/public/hooks/n8n-verify')({
  server: {
    handlers: {
      POST: async ({ request }) => handleN8nVerifyPost(request),
      GET: async () => handleN8nVerifyGet(),
    },
  },
})
