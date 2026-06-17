import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_BASE_URL = (typeof process !== "undefined" && process.env?.APP_BASE_URL) || "https://www.impulsionando.com.br";

/** Lista contratos digitais (admins veem todos; demais, apenas da própria empresa). */
export const listContractDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contract_documents")
      .select(
        "id, company_id, white_label_id, billing_contract_id, contract_number, version, parent_document_id, superseded_at, superseded_by_id, storage_path, signed_storage_path, file_hash, signed_file_hash, file_size_bytes, snapshot, status, generated_at, sent_at, signed_at, created_at, companies:company_id(name)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

/** Registra metadados do PDF gerado e dispara e-mail de "contrato disponível". */
export const createContractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    company_id: string;
    white_label_id?: string | null;
    billing_contract_id?: string | null;
    contract_number: string;
    storage_path: string;
    file_hash: string;
    file_size_bytes: number;
    snapshot: Record<string, unknown>;
    parent_document_id?: string | null;
    version?: number;
    notify_email?: string | null;
    signer_name?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("contract_documents")
      .insert({
        company_id: data.company_id,
        white_label_id: data.white_label_id ?? null,
        billing_contract_id: data.billing_contract_id ?? null,
        contract_number: data.contract_number,
        storage_path: data.storage_path,
        file_hash: data.file_hash,
        file_size_bytes: data.file_size_bytes,
        snapshot: data.snapshot as never,
        status: "sent",
        version: data.version ?? 1,
        parent_document_id: data.parent_document_id ?? null,
        generated_by: context.userId,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    // Se reemissão, marca pai como superseded
    if (data.parent_document_id) {
      await context.supabase
        .from("contract_documents")
        .update({ status: "superseded", superseded_at: new Date().toISOString(), superseded_by_id: row.id })
        .eq("id", data.parent_document_id);
    }

    await context.supabase.from("audit_logs").insert({
      company_id: data.company_id,
      user_id: context.userId,
      action: data.parent_document_id ? "contract.reissued" : "contract.generated",
      entity: "contract_documents",
      entity_id: row.id,
      after: { contract_number: row.contract_number, status: row.status, version: row.version, parent_document_id: row.parent_document_id },
    });

    // E-mail de notificação ao cliente (best-effort)
    if (data.notify_email) {
      try {
        const { sendContractEmail } = await import("@/lib/contracts-notify.server");
        const snap = (data.snapshot ?? {}) as any;
        await sendContractEmail({
          templateName: "contract-generated",
          to: data.notify_email,
          idempotencyKey: `contract-generated:${row.id}`,
          templateData: {
            signerName: data.signer_name ?? snap.company_name ?? "",
            companyName: snap.company_name ?? "",
            contractNumber: row.contract_number,
            planName: snap.plan ?? "",
            monthly: typeof snap.monthly_brl === "number"
              ? snap.monthly_brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "",
            signUrl: `${APP_BASE_URL}/contrato/${row.id}`,
          },
        });
      } catch (e) {
        console.error("contract-generated email failed", e);
      }
    }

    return row;
  });

/** Gera URL assinada de download (60 min) + audita download por company/version. */
export const getContractSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; signed?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc, error: e1 } = await context.supabase
      .from("contract_documents")
      .select("id, company_id, white_label_id, contract_number, version, storage_path, signed_storage_path, parent_document_id")
      .eq("id", data.id)
      .single();
    if (e1 || !doc) throw e1 ?? new Error("Contrato não encontrado");

    const wantSigned = !!(data.signed && (doc as any).signed_storage_path);
    const path = wantSigned ? (doc as any).signed_storage_path : (doc as any).storage_path;

    const { data: signed, error } = await context.supabase
      .storage.from("contracts")
      .createSignedUrl(path, 60 * 60);
    if (error || !signed) throw error ?? new Error("Falha ao gerar URL");

    try {
      const { data: prof } = await context.supabase
        .from("user_profiles").select("email").eq("user_id", context.userId).maybeSingle();
      await context.supabase.from("audit_logs").insert({
        company_id: (doc as any).company_id,
        white_label_id: (doc as any).white_label_id ?? null,
        user_id: context.userId,
        user_email: prof?.email ?? null,
        action: wantSigned ? "contract.download.signed" : "contract.download.original",
        entity: "contract_documents",
        entity_id: (doc as any).id,
        metadata: {
          contract_number: (doc as any).contract_number,
          version: (doc as any).version,
          parent_document_id: (doc as any).parent_document_id ?? null,
          reissued: !!(doc as any).parent_document_id,
          variant: wantSigned ? "signed_stamped" : "original",
          storage_path: path,
        },
      } as any);
    } catch (auditErr) {
      console.error("audit contract.download failed", auditErr);
    }

    return { url: signed.signedUrl, signed: wantSigned, version: (doc as any).version };
  });

/** Registra assinatura eletrônica, atualiza documento com carimbo, dispara e-mail. */
export const signContractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    contract_document_id: string;
    signer_name: string;
    signer_email: string;
    signer_doc?: string;
    signer_role?: string;
    evidence?: Record<string, unknown>;
    user_agent?: string;
    /** Caminho do PDF carimbado (gerado e enviado pelo cliente). */
    signed_storage_path?: string;
    signed_file_hash?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc, error: e1 } = await context.supabase
      .from("contract_documents")
      .select("id, company_id, white_label_id, file_hash, status, contract_number, snapshot")
      .eq("id", data.contract_document_id)
      .single();
    if (e1 || !doc) throw e1 ?? new Error("Contrato inexistente");

    const signedAtIso = new Date().toISOString();
    const sigInput = `${doc.file_hash}|${data.signer_email.toLowerCase()}|${signedAtIso}`;
    let signature_hash = sigInput;
    try {
      const buf = new TextEncoder().encode(sigInput);
      const digest = await crypto.subtle.digest("SHA-256", buf);
      signature_hash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch { /* noop */ }

    const { data: sig, error } = await context.supabase
      .from("contract_signatures")
      .insert({
        contract_document_id: doc.id,
        company_id: doc.company_id,
        white_label_id: doc.white_label_id,
        signer_user_id: context.userId,
        signer_name: data.signer_name,
        signer_email: data.signer_email,
        signer_doc: data.signer_doc ?? null,
        signer_role: data.signer_role ?? null,
        signed_at: signedAtIso,
        user_agent: data.user_agent ?? null,
        evidence: (data.evidence ?? {}) as never,
        signature_hash,
        status: "valid",
      })
      .select("id, contract_document_id, company_id, signer_name, signer_email, signer_doc, signer_role, signed_at, signature_hash, status, created_at")
      .single();
    if (error) throw error;

    const updatePatch: Record<string, unknown> = {
      status: "signed",
      signed_at: signedAtIso,
      updated_at: new Date().toISOString(),
    };
    if (data.signed_storage_path && data.signed_file_hash) {
      updatePatch.signed_storage_path = data.signed_storage_path;
      updatePatch.signed_file_hash = data.signed_file_hash;
    }
    await context.supabase.from("contract_documents").update(updatePatch as never).eq("id", doc.id);

    await context.supabase.from("audit_logs").insert({
      company_id: doc.company_id,
      user_id: context.userId,
      user_email: data.signer_email,
      action: "contract.signed",
      entity: "contract_signatures",
      entity_id: sig.id,
      after: { signer_name: data.signer_name, signer_email: data.signer_email, signed_at: signedAtIso, signature_hash },
    });

    // E-mail de confirmação ao assinante (best-effort)
    try {
      const { sendContractEmail } = await import("@/lib/contracts-notify.server");
      await sendContractEmail({
        templateName: "contract-signed",
        to: data.signer_email,
        idempotencyKey: `contract-signed:${sig.id}`,
        templateData: {
          signerName: data.signer_name,
          companyName: (doc.snapshot as any)?.company_name ?? "",
          contractNumber: doc.contract_number,
          signedAt: new Date(signedAtIso).toLocaleString("pt-BR"),
          signatureHash: signature_hash,
          downloadUrl: `${APP_BASE_URL}/contrato/${doc.id}`,
        },
      });
    } catch (e) {
      console.error("contract-signed email failed", e);
    }

    return sig;
  });

/** Lista assinaturas de um contrato. */
export const listContractSignatures = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contract_document_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("contract_signatures")
      .select("id, contract_document_id, company_id, signer_name, signer_email, signer_doc, signer_role, signed_at, signature_hash, status, created_at, user_agent, evidence")
      .eq("contract_document_id", data.contract_document_id)
      .order("signed_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

/** Histórico/versões de um contrato (mesmo contract_number na mesma empresa). */
export const listContractVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { company_id: string; contract_number: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("contract_documents")
      .select("id, version, status, generated_at, signed_at, superseded_at, parent_document_id, file_hash, signed_file_hash")
      .eq("company_id", data.company_id)
      .eq("contract_number", data.contract_number)
      .order("version", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

/** Prepara payload de reemissão: retorna snapshot atual + próxima versão. */
export const prepareContractReissue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { parent_id: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: parent, error } = await context.supabase
      .from("contract_documents")
      .select("id, company_id, white_label_id, billing_contract_id, contract_number, version, snapshot, status")
      .eq("id", data.parent_id)
      .single();
    if (error || !parent) throw error ?? new Error("Contrato pai não encontrado");

    const { data: maxRow } = await context.supabase
      .from("contract_documents")
      .select("version")
      .eq("company_id", parent.company_id)
      .eq("contract_number", parent.contract_number)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = ((maxRow as any)?.version ?? parent.version ?? 1) + 1;

    // Auditoria detalhada da preparação da reemissão
    await context.supabase.from("audit_logs").insert({
      company_id: (parent as any).company_id,
      white_label_id: (parent as any).white_label_id ?? null,
      user_id: context.userId,
      action: "contract.reissue.prepared",
      entity: "contract_documents",
      entity_id: (parent as any).id,
      before: {
        contract_number: (parent as any).contract_number,
        version: (parent as any).version,
        status: (parent as any).status,
      },
      after: {
        next_version: nextVersion,
        parent_document_id: (parent as any).id,
        signed_variant: "pending",
      },
      metadata: { reason: data.reason ?? null },
    } as any);

    return { parent, nextVersion };
  });
