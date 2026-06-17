import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Lista contratos digitais (admins veem todos; demais, apenas da própria empresa). */
export const listContractDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("contract_documents")
      .select(
        "id, company_id, white_label_id, billing_contract_id, contract_number, version, storage_path, file_hash, file_size_bytes, snapshot, status, generated_at, sent_at, created_at, companies:company_id(name)"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

/** Registra metadados do PDF gerado (PDF é enviado para o bucket "contracts" pelo cliente). */
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

        generated_by: context.userId,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    await context.supabase.from("audit_logs").insert({
      company_id: data.company_id,
      user_id: context.userId,
      action: "contract.generated",
      entity: "contract_documents",
      entity_id: row.id,
      after: { contract_number: row.contract_number, status: row.status },
    });

    return row;
  });

/** Gera URL assinada de download (60 min). */
export const getContractSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc, error: e1 } = await context.supabase
      .from("contract_documents")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (e1 || !doc) throw e1 ?? new Error("Contrato não encontrado");

    const { data: signed, error } = await context.supabase
      .storage.from("contracts")
      .createSignedUrl(doc.storage_path, 60 * 60);
    if (error || !signed) throw error ?? new Error("Falha ao gerar URL");
    return { url: signed.signedUrl };
  });

/** Registra assinatura eletrônica vinculada ao contrato. */
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
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc, error: e1 } = await context.supabase
      .from("contract_documents")
      .select("id, company_id, white_label_id, file_hash, status")
      .eq("id", data.contract_document_id)
      .single();
    if (e1 || !doc) throw e1 ?? new Error("Contrato inexistente");

    const signedAtIso = new Date().toISOString();
    // hash de assinatura (não-criptográfico, marca de integridade)
    const sigInput = `${doc.file_hash}|${data.signer_email.toLowerCase()}|${signedAtIso}`;
    let signature_hash = sigInput;
    try {
      const buf = new TextEncoder().encode(sigInput);
      const digest = await crypto.subtle.digest("SHA-256", buf);
      signature_hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // fallback noop
    }

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


    await context.supabase
      .from("contract_documents")
      .update({ status: "signed", updated_at: new Date().toISOString() })
      .eq("id", doc.id);

    await context.supabase.from("audit_logs").insert({
      company_id: doc.company_id,
      user_id: context.userId,
      user_email: data.signer_email,
      action: "contract.signed",
      entity: "contract_signatures",
      entity_id: sig.id,
      after: { signer_name: data.signer_name, signer_email: data.signer_email, signed_at: signedAtIso },
    });
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
