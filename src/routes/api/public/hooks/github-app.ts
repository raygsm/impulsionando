/* eslint-disable @typescript-eslint/no-explicit-any -- verified webhook JSON and new migration tables are boundary-validated. */
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { auditGitHubOperation } from "@/lib/github-app/audit.server";
import {
  extractWebhookSummary,
  GITHUB_WEBHOOK_EVENTS,
  hashWebhookPayload,
  verifyGitHubWebhook,
} from "@/lib/github-app/webhook.server";

const MAX_BYTES = 2 * 1024 * 1024;

async function getWebhookSecret(): Promise<string> {
  const { data, error } = await (supabaseAdmin as any).rpc("get_github_app_vault_secret", {
    _name: "GITHUB_APP_WEBHOOK_SECRET",
  });
  if (error || typeof data !== "string") throw new Error("webhook_secret_unavailable");
  return data;
}

export const Route = createFileRoute("/api/public/hooks/github-app")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const length = Number(request.headers.get("content-length") ?? 0);
        if (length > MAX_BYTES) return new Response("payload too large", { status: 413 });
        const delivery = request.headers.get("x-github-delivery");
        const event = request.headers.get("x-github-event") ?? "";
        if (
          !delivery ||
          !/^[0-9a-f-]{16,64}$/i.test(delivery) ||
          !GITHUB_WEBHOOK_EVENTS.has(event)
        ) {
          return new Response("unsupported event", { status: 400 });
        }
        const raw = await request.text();
        if (Buffer.byteLength(raw) > MAX_BYTES)
          return new Response("payload too large", { status: 413 });
        const secret = await getWebhookSecret();
        if (!verifyGitHubWebhook(raw, request.headers.get("x-hub-signature-256"), secret)) {
          await auditGitHubOperation({
            operation: "webhook.receive",
            outcome: "denied",
            metadata: { event, delivery },
          });
          return new Response("invalid signature", { status: 401 });
        }
        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("invalid json", { status: 400 });
        }
        const summary = extractWebhookSummary(payload);
        const { error } = await (supabaseAdmin as any).from("github_app_webhook_events").insert({
          delivery_id: delivery,
          event_name: event,
          action: summary.action,
          repository: summary.repository,
          sender_login: summary.sender,
          payload_sha256: hashWebhookPayload(raw),
        });
        if (error && error.code !== "23505")
          return new Response("event persistence failed", { status: 503 });
        await auditGitHubOperation({
          operation: "webhook.receive",
          repository: summary.repository,
          outcome: "succeeded",
          metadata: { event, delivery, duplicate: error?.code === "23505" },
        });
        return Response.json({ accepted: true }, { status: 202 });
      },
    },
  },
});
