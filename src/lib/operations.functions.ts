import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Operações centrais do painel master: baixa manual, reenvio de comunicação,
 * pedido de reprocessamento de nota fiscal. Reutiliza tabelas/funções existentes.
 */

export const manualMarkInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoiceId: string }) => z.object({ invoiceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: inv, error } = await supabase
      .from("billing_invoices")
      .select("id, company_id, amount, status")
      .eq("id", data.invoiceId)
      .maybeSingle();
    if (error || !inv) throw new Error("Fatura não encontrada");
    const { error: rpcErr } = await supabase.rpc("billing_mark_paid", { _invoice_id: data.invoiceId });
    if (rpcErr) throw new Error(rpcErr.message);
    await supabase.from("audit_logs").insert({
      company_id: inv.company_id,
      user_id: userId,
      action: "billing.manual_mark_paid",
      entity: "billing_invoices",
      entity_id: data.invoiceId,
      after: { amount: inv.amount },
    });
    return { ok: true };
  });

export const resendOutboxMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messageId: string }) => z.object({ messageId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: m, error } = await supabase
      .from("message_outbox")
      .select("*")
      .eq("id", data.messageId)
      .maybeSingle();
    if (error || !m) throw new Error("Mensagem não encontrada");
    const { error: insErr } = await supabase.from("message_outbox").insert({
      company_id: m.company_id,
      event_code: m.event_code,
      channel: m.channel,
      template_id: m.template_id,
      recipient_user_id: m.recipient_user_id,
      recipient_email: m.recipient_email,
      recipient_phone: m.recipient_phone,
      recipient_name: m.recipient_name,
      subject: m.subject,
      body: m.body,
      payload: m.payload,
      status: m.channel === "in_app" ? "sent" : "queued",
      reference_type: m.reference_type,
      reference_id: m.reference_id,
      sent_at: m.channel === "in_app" ? new Date().toISOString() : null,
    });
    if (insErr) throw new Error(insErr.message);
    await supabase.from("audit_logs").insert({
      company_id: m.company_id,
      user_id: userId,
      action: "message.manual_resend",
      entity: "message_outbox",
      entity_id: data.messageId,
    });
    return { ok: true };
  });

export const requestInvoiceReprocess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; referenceId: string; notes?: string }) =>
    z.object({
      companyId: z.string().uuid(),
      referenceId: z.string().min(1).max(200),
      notes: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("audit_logs").insert({
      company_id: data.companyId,
      user_id: userId,
      action: "nfe.reprocess_requested",
      entity: "billing_invoices",
      entity_id: data.referenceId,
      after: { notes: data.notes ?? null },
    });
    return { ok: true };
  });

/* ====== Definições de parâmetros (construtor Sim/Não) ====== */

const DefSchema = z.object({
  key: z.string().min(2).max(120).regex(/^[a-z0-9_.]+$/, "use letras minúsculas, números e _ ."),
  label: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  value_type: z.enum(["boolean", "text", "number", "json"]),
  default_value: z.any(),
  is_company_editable: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const upsertSettingDefinition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DefSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("setting_definitions").upsert(
      {
        ...data,
        default_value: data.default_value,
      },
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "setting_definition.upsert",
      entity: "setting_definitions",
      entity_id: data.key,
      after: data as never,
    });
    return { ok: true };
  });

export const deleteSettingDefinition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string }) => z.object({ key: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("setting_definitions").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "setting_definition.delete",
      entity: "setting_definitions",
      entity_id: data.key,
    });
    return { ok: true };
  });
