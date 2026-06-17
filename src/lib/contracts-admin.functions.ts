/**
 * Contratos — funções administrativas:
 *  - Listar versões com status / evidência de assinatura
 *  - Listar logs de entrega de e-mail (generated / signed)
 *  - Reenviar e-mails (generated / signed) com idempotency-key novo
 *  - Verificar acesso ao contrato (tenant + role)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_BASE_URL =
  (typeof process !== "undefined" && process.env?.APP_BASE_URL) ||
  "https://www.impulsionando.com.br";

/** Retorna se usuário é admin/staff OU membro da empresa dona do contrato. */
async function assertContractAccess(supabase: any, userId: string, contractId: string) {
  const { data: doc, error } = await supabase
    .from("contract_documents")
    .select("id, company_id, white_label_id, contract_number")
    .eq("id", contractId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!doc) throw new Error("Contrato não encontrado");

  // Staff Impulsionando
  const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (staff) return { doc, level: "staff" as const };

  // Admin global
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return { doc, level: "admin" as const };

  // Membro da empresa do contrato
  const { data: prof } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (prof?.company_id && prof.company_id === doc.company_id) {
    return { doc, level: "tenant" as const };
  }

  throw new Error("Acesso negado a este contrato");
}

/** Lista todas as versões do mesmo contract_number com status + evidência de assinatura. */
export const listContractVersionsWithEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contract_document_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { doc } = await assertContractAccess(context.supabase, context.userId, data.contract_document_id);
    const { data: versions, error } = await context.supabase
      .from("contract_documents")
      .select("id, version, status, generated_at, signed_at, superseded_at, parent_document_id, file_hash, signed_file_hash, signed_storage_path, snapshot")
      .eq("company_id", doc.company_id)
      .eq("contract_number", doc.contract_number)
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (versions ?? []).map((v: any) => v.id);
    const { data: sigs } = ids.length
      ? await context.supabase
          .from("contract_signatures")
          .select("id, contract_document_id, signer_name, signer_email, signed_at, signature_hash, status")
          .in("contract_document_id", ids)
      : { data: [] as any[] };

    return (versions ?? []).map((v: any) => ({
      ...v,
      signatures: (sigs ?? []).filter((s: any) => s.contract_document_id === v.id),
    }));
  });

/** Lista logs de entrega de e-mail relacionados a um contrato. */
export const listContractEmailLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contract_document_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertContractAccess(context.supabase, context.userId, data.contract_document_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pega ids das assinaturas para englobar idempotency-keys
    const { data: sigs } = await supabaseAdmin
      .from("contract_signatures")
      .select("id")
      .eq("contract_document_id", data.contract_document_id);
    const sigIds = (sigs ?? []).map((s: any) => s.id);

    const keys = [
      `contract-generated:${data.contract_document_id}`,
      ...sigIds.map((id: string) => `contract-signed:${id}`),
    ];

    const { data: rows, error } = await supabaseAdmin
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, metadata, created_at")
      .in("template_name", ["contract-generated", "contract-signed"])
      .or(keys.map((k) => `metadata->>idempotency_key.like.${k}%`).join(","))
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Reenvia e-mail de contrato (gera nova idempotency-key e tenta nova fila). */
export const resendContractEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      contract_document_id: z.string().uuid(),
      kind: z.enum(["generated", "signed"]),
      to: z.string().email().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const access = await assertContractAccess(context.supabase, context.userId, data.contract_document_id);
    // Apenas staff/admin podem reenviar
    if (access.level === "tenant") throw new Error("Apenas administradores podem reenviar e-mails de contrato");

    const { data: doc, error } = await context.supabase
      .from("contract_documents")
      .select("id, company_id, contract_number, snapshot, file_hash")
      .eq("id", data.contract_document_id)
      .single();
    if (error || !doc) throw new Error(error?.message ?? "Contrato não encontrado");
    const snap = (doc.snapshot ?? {}) as any;

    let to = data.to ?? null;
    let signer_name = snap.signer_name ?? "";

    if (data.kind === "signed") {
      const { data: sig } = await context.supabase
        .from("contract_signatures")
        .select("signer_name, signer_email, signed_at, signature_hash")
        .eq("contract_document_id", doc.id)
        .order("signed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!sig) throw new Error("Contrato ainda não foi assinado");
      to = to ?? sig.signer_email;
      signer_name = sig.signer_name;

      const { sendContractEmail } = await import("@/lib/contracts-notify.server");
      const stamp = new Date().toISOString();
      const r = await sendContractEmail({
        templateName: "contract-signed",
        to: to!,
        idempotencyKey: `contract-signed:${doc.id}:resend:${stamp}`,
        templateData: {
          signerName: sig.signer_name,
          companyName: snap.company_name ?? "",
          contractNumber: doc.contract_number,
          signedAt: new Date(sig.signed_at).toLocaleString("pt-BR"),
          signatureHash: sig.signature_hash,
          downloadUrl: `${APP_BASE_URL}/contrato/${doc.id}`,
        },
      });
      await context.supabase.from("audit_logs").insert({
        company_id: doc.company_id,
        user_id: context.userId,
        action: "contract.email.resend",
        entity: "contract_documents",
        entity_id: doc.id,
        after: { kind: "signed", to, result: r },
      });
      return r;
    }

    // generated
    if (!to) {
      // Tenta achar último destinatário no log
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: last } = await supabaseAdmin
        .from("email_send_log")
        .select("recipient_email, metadata")
        .eq("template_name", "contract-generated")
        .like("metadata->>idempotency_key", `contract-generated:${doc.id}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      to = last?.recipient_email ?? null;
    }
    if (!to) throw new Error("Destinatário ausente — informe um e-mail para reenvio");

    const { sendContractEmail } = await import("@/lib/contracts-notify.server");
    const stamp = new Date().toISOString();
    const r = await sendContractEmail({
      templateName: "contract-generated",
      to,
      idempotencyKey: `contract-generated:${doc.id}:resend:${stamp}`,
      templateData: {
        signerName: signer_name || snap.company_name || "",
        companyName: snap.company_name ?? "",
        contractNumber: doc.contract_number,
        planName: snap.plan ?? "",
        monthly: typeof snap.monthly_brl === "number"
          ? snap.monthly_brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : "",
        signUrl: `${APP_BASE_URL}/contrato/${doc.id}`,
      },
    });
    await context.supabase.from("audit_logs").insert({
      company_id: doc.company_id,
      user_id: context.userId,
      action: "contract.email.resend",
      entity: "contract_documents",
      entity_id: doc.id,
      after: { kind: "generated", to, result: r },
    });
    return r;
  });

/** Endpoint público (auth) para validar acesso antes de exibir preview. */
export const checkContractAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contract_document_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const r = await assertContractAccess(context.supabase, context.userId, data.contract_document_id);
    return { allowed: true, level: r.level, contract_number: r.doc.contract_number };
  });
