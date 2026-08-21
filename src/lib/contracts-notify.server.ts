/**
 * Contracts — server-only notification helper.
 * Canonical flow: contract event -> public.message_outbox -> Core worker/provider.
 */
import * as React from "react";
import { render as renderAsync } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

export async function sendContractEmail(args: {
  templateName: "contract-generated" | "contract-signed";
  to: string;
  templateData: Record<string, unknown>;
  idempotencyKey: string;
}): Promise<{ status: "queued" | "error" | "no_template"; messageId?: string; error?: string }> {
  const tpl = TEMPLATES[args.templateName];
  if (!tpl) return { status: "no_template" };

  const recipient = (args.to || "").trim().toLowerCase();
  if (!recipient) return { status: "error", error: "recipient_missing" };

  try {
    const element = React.createElement(tpl.component as any, args.templateData);
    const [html, text] = await Promise.all([
      renderAsync(element),
      renderAsync(element, { plainText: true }),
    ]);
    const subject = typeof tpl.subject === "function" ? tpl.subject(args.templateData) : tpl.subject;
    const now = new Date().toISOString();

    // Atomic idempotency: ON CONFLICT is the arbiter. Concurrent requests with
    // the same key converge on the single winning outbox row instead of one
    // caller failing after a read-then-insert race.
    const { data: queued, error: queueError } = await supabaseAdmin
      .from("message_outbox")
      .upsert({
        event_code: `contracts.${args.templateName}`,
        channel: "email",
        recipient_email: recipient,
        subject,
        body: text,
        payload: {
          purpose: "transactional",
          template_name: args.templateName,
          html,
          template_data: args.templateData,
          source: "contracts-notify.server",
        },
        status: "queued",
        attempts: 0,
        scheduled_at: now,
        available_at: now,
        reference_type: "contract_notification",
        reference_id: String(args.templateData.contractNumber ?? ""),
        idempotency_key: args.idempotencyKey,
      }, { onConflict: "idempotency_key", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();

    if (queueError) throw new Error(`outbox_upsert:${queueError.message}`);
    if (queued?.id) return { status: "queued", messageId: queued.id };

    // ignoreDuplicates returns no inserted row for the losing concurrent call.
    // Read the canonical winner after the atomic conflict decision.
    const { data: winner, error: winnerError } = await supabaseAdmin
      .from("message_outbox")
      .select("id")
      .eq("idempotency_key", args.idempotencyKey)
      .single();
    if (winnerError || !winner?.id) {
      throw new Error(`outbox_idempotency_winner:${winnerError?.message ?? "missing_id"}`);
    }
    return { status: "queued", messageId: winner.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("sendContractEmail failed", { template: args.templateName, error: message });
    return { status: "error", error: message };
  }
}
