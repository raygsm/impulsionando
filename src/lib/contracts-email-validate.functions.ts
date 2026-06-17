/**
 * Validação real de envio de e-mails de contrato (generated/signed):
 *  - Dispara o envio real via fila (sendContractEmail)
 *  - Consulta email_send_log para status e mensagens de erro
 *  - Permite reenvio com nova idempotency key
 *  - Retorna template, variáveis, status, logs e tentativas
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_BASE_URL =
  (typeof process !== "undefined" && process.env?.APP_BASE_URL) || "https://www.impulsionando.com.br";

const schema = z.object({
  contract_document_id: z.string().uuid(),
  template: z.enum(["contract-generated", "contract-signed"]),
  recipient: z.string().email().optional(),
  force_resend: z.boolean().optional(),
});

export const validateContractEmailDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    // Verifica admin/staff
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", {
      _user: context.userId,
    });
    if (!isAdmin && !isStaff) throw new Error("Acesso negado");

    const { data: doc, error } = await context.supabase
      .from("contract_documents")
      .select("id, company_id, contract_number, version, snapshot, signed_at, companies:company_id(name)")
      .eq("id", data.contract_document_id)
      .maybeSingle();
    if (error || !doc) throw error ?? new Error("Contrato não encontrado");

    const snap = ((doc as any).snapshot ?? {}) as Record<string, any>;
    const recipient =
      data.recipient ||
      snap.customer_email ||
      snap.signer_email ||
      snap.contact_email ||
      null;
    if (!recipient) {
      return {
        ok: false,
        error: "Recipiente não definido no snapshot (customer_email/signer_email).",
        template: data.template,
      };
    }

    const variables = {
      customerName: snap.customer_name ?? snap.company_name ?? "Cliente",
      companyName: (doc as any).companies?.name ?? snap.company_name ?? "Impulsionando",
      contractNumber: (doc as any).contract_number,
      version: (doc as any).version,
      planName: snap.plan ?? "",
      monthly:
        typeof snap.monthly_brl === "number"
          ? snap.monthly_brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "",
      signUrl: `${APP_BASE_URL}/contrato/${(doc as any).id}`,
      signedAt: (doc as any).signed_at,
    };

    const baseKey = `contract:${data.template}:${(doc as any).id}:v${(doc as any).version}`;
    const idempotencyKey = data.force_resend ? `${baseKey}:resend:${Date.now()}` : baseKey;

    // Envio real (server-only)
    const { sendContractEmail } = await import("@/lib/contracts-notify.server");
    const sendResult = await sendContractEmail({
      templateName: data.template,
      to: recipient,
      templateData: variables,
      idempotencyKey,
    });

    // Coleta logs (todas tentativas para este contrato+template)
    const { data: logs } = await context.supabase
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, metadata, created_at")
      .eq("template_name", data.template)
      .eq("recipient_email", recipient)
      .order("created_at", { ascending: false })
      .limit(50);

    // Auditoria
    await context.supabase.from("audit_logs").insert({
      company_id: (doc as any).company_id,
      user_id: context.userId,
      action: data.force_resend ? "contract.email.resend" : "contract.email.validate",
      entity: "contract_documents",
      entity_id: (doc as any).id,
      metadata: {
        template: data.template,
        recipient,
        idempotency_key: idempotencyKey,
        send_result: sendResult,
      },
    } as any);

    return {
      ok: sendResult.status === "queued",
      template: data.template,
      recipient,
      variables,
      idempotency_key: idempotencyKey,
      send_result: sendResult,
      attempts: logs ?? [],
      contract: {
        id: (doc as any).id,
        number: (doc as any).contract_number,
        version: (doc as any).version,
      },
    };
  });
