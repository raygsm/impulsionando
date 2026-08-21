/**
 * Contracts — server-only notification helper.
 * Canonical flow: contract event -> public.message_outbox -> Core worker/provider.
 *
 * This module intentionally does not call legacy email_send_log / suppressed_emails
 * or the removed enqueue_email RPC. External delivery is handled by the shared
 * communication worker, while this helper guarantees durable/idempotent queuing.
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

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("message_outbox")
      .select("id,status")
      .eq("idempotency_key", args.idempotencyKey)
      .maybeSingle();
    if (existingError) throw new Error(`outbox_idempotency_read:${existingError.message}`);
    if (existing?.id) return { status: "queued", messageId: existing.id };

    const { data: queued, error: queueError } = await supabaseAdmin
      .from("message_outbox")
      .insert({
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
        scheduled_at: new Date().toISOString(),
        available_at: new Date().toISOString(),
        reference_type: "contract_notification",
        reference_id: String(args.templateData.contractNumber ?? ""),
        idempotency_key: args.idempotencyKey,
      })
      .select("id")
      .single();

    if (queueError || !queued?.id) {
      throw new Error(`outbox_insert:${queueError?.message ?? "missing_id"}`);
    }

    return { status: "queued", messageId: queued.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("sendContractEmail failed", { template: args.templateName, error: message });
    return { status: "error", error: message };
  }
}
