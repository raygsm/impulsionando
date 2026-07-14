import { createFileRoute } from "@tanstack/react-router";

const disabled = () => new Response(JSON.stringify({ error: "Lovable email endpoint disabled; use independent email provider/webhook." }), { status: 410, headers: { "content-type": "application/json" } });
export const Route = createFileRoute("/lovable/email/suppression")({ server: { handlers: { POST: disabled, GET: disabled } } });
