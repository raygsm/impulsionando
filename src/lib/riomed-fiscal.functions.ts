import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase.from("user_profiles").select("company_id").eq("user_id", ctx.userId).maybeSingle();
  if (!data?.company_id) throw new Error("Empresa não encontrada");
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
    return { ar: ar.data ?? [], sequence: seq.data ?? null };
  });

export const emitFiscalInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { data: num, error } = await sb.rpc("riomed_emit_fiscal_invoice", { p_ar_id: data.arId });
    if (error) throw new Error(error.message);
    return { ok: true, fiscalNumber: num as string };
  });

export const upsertFiscalSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    prefix: z.string().min(1),
    nextNumber: z.number().int().positive(),
    padding: z.number().int().min(1).max(12).default(7),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { error } = await sb.from("riomed_fiscal_sequences").upsert({
      company_id: cid, prefix: data.prefix, next_number: data.nextNumber, padding: data.padding, active: true,
    }, { onConflict: "company_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createMpPreferenceForAr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ar } = await sb.from("riomed_ar_invoices").select("*").eq("id", data.arId).eq("company_id", cid).maybeSingle();
    if (!ar) throw new Error("Conta a receber não encontrada");
    const { data: cred } = await sb.from("mpago_credentials").select("access_token, public_key, environment").eq("company_id", cid).maybeSingle();
    if (!cred?.access_token) throw new Error("Mercado Pago não configurado para esta empresa");

    const externalRef = `riomed_ar:${ar.id}`;
    const body = {
      items: [{
        title: ar.description ?? `Fatura ${ar.id.slice(0,8)}`,
        quantity: 1,
        unit_price: Number(ar.amount),
        currency_id: "BOB",
      }],
      external_reference: externalRef,
      metadata: { company_id: cid, riomed_ar_id: ar.id },
      notification_url: `${process.env.PUBLIC_APP_URL ?? "https://impulsionando.lovable.app"}/api/mercadopago/webhook`,
    };
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cred.access_token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Mercado Pago: ${res.status} ${txt.slice(0, 200)}`);
    }
    const pref = await res.json() as { id: string; init_point: string; sandbox_init_point?: string };
    const initPoint = cred.environment === "sandbox" ? (pref.sandbox_init_point ?? pref.init_point) : pref.init_point;

    await sb.from("riomed_ar_invoices").update({
      mp_preference_id: pref.id,
      mp_init_point: initPoint,
      external_reference: externalRef,
    }).eq("id", ar.id);

    return { ok: true, preferenceId: pref.id, initPoint };
  });

export const reconcileArByExternalRef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ arId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const { data: ar } = await sb.from("riomed_ar_invoices").select("*").eq("id", data.arId).eq("company_id", cid).maybeSingle();
    if (!ar) throw new Error("AR não encontrada");
    const ref = ar.external_reference ?? `riomed_ar:${ar.id}`;
    const { data: pay } = await sb.from("mpago_payments").select("id, status, mp_payment_id, transaction_amount")
      .eq("company_id", cid).eq("external_reference", ref).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!pay) return { ok: false, reason: "Sem pagamento associado" };
    if (pay.status === "approved") {
      await sb.from("riomed_ar_invoices").update({
        status: "paid", paid_amount: Number(pay.transaction_amount ?? ar.amount),
        paid_at: new Date().toISOString(), payment_method: "mercadopago",
        mp_payment_id: String(pay.mp_payment_id ?? ""),
      }).eq("id", ar.id);
      return { ok: true, status: "paid" };
    }
    return { ok: false, status: pay.status };
  });
