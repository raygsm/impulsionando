import { createFileRoute } from "@tanstack/react-router";

const disabled = () => new Response(JSON.stringify({ error: "Lovable email queue disabled; use independent email delivery." }), { status: 410, headers: { "content-type": "application/json" } });
export const Route = createFileRoute("/lovable/email/queue/process")({ server: { handlers: { POST: disabled, GET: disabled } } });
