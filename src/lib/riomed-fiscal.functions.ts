import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data, error } = await ctx.supabase
    .from("communication_tenants")
    .select("company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return data.company_id as string;
}

export const getFiscalOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const [ar, seq] = await Promise.all([
      sb.from("riomed_ar_invoices").select("*").eq("company_id", cid).order("created_at", { ascending: false }).limit(300),
      sb.from("riomed_fiscal_sequences").select("*").eq("company_id", cid).maybeSingle(),
    ]);
    if (ar.error) throw new Error(ar.error.message);
    if (seq.error) throw new Error(seq.error.message);
    return {
      ar: ar.data ?? [],
      sequence: seq.data ?? null,
      capabilities: {
        internalDocument: true,
        officialFiscal: false,
        mercadoPago: false,
      },
    };
  });

export const issueInternalDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ar, error: arError } = await sb.from("riomed_ar_invoices").select("id,company_id")
      .eq("id", data.arId).eq("company_id", cid).maybeSingle();
    if (arError) throw new Error(arError.message);
    if (!ar) throw new Error("Conta a receber não encontrada");
    const { data: number, error } = await sb.rpc("riomed_issue_internal_document", { p_ar_id: data.arId });
    if (error) throw new Error(error.message);
    return { ok: true, internalDocumentNumber: number as string, officialFiscal: false };
  });

// Compatibilidade temporária: consumidores antigos recebem bloqueio explícito em vez de uma falsa emissão fiscal.
export const emitFiscalInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async () => {
    throw new Error("Emissão fiscal oficial Rio Med não está habilitada. O Core atualmente gera apenas documento interno operacional.");
  });

export const upsertFiscalSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    prefix: z.string().trim().min(1).max(30),
    nextNumber: z.number().int().positive(),
    padding: z.number().int().min(1).max(12).default(7),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { error } = await sb.from("riomed_fiscal_sequences").upsert({
      company_id: cid,
      prefix: data.prefix,
      next_number: data.nextNumber,
      padding: data.padding,
      active: true,
    }, { onConflict: "company_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createMpPreferenceForAr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async () => {
    throw new Error("Mercado Pago Rio Med não está habilitado. Credenciais seguras e fluxo de webhook ainda precisam ser homologados antes de gerar links de pagamento.");
  });

export const reconcileArByExternalRef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async () => {
    throw new Error("Conciliação Mercado Pago Rio Med não está habilitada até a integração de pagamentos ser homologada.");
  });
