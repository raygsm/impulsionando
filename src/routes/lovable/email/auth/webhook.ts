import { createFileRoute } from "@tanstack/react-router";

const disabled = () => new Response(JSON.stringify({ error: "Lovable auth email webhook disabled; use Supabase Auth/provider webhooks directly." }), { status: 410, headers: { "content-type": "application/json" } });
export const Route = createFileRoute("/lovable/email/auth/webhook")({ server: { handlers: { POST: disabled, GET: disabled } } });
