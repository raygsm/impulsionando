import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const PLAN_STATUS_COMERCIAL_VALUES = [
  "disponivel_contratacao",
  "sob_consulta",
  "em_breve",
  "oculto",
  "exclusivo_interno",
  "exclusivo_white_label",
] as const;

export const PLAN_STATUS_COMERCIAL_LABELS: Record<string, string> = {
  disponivel_contratacao: "Disponível para contratação",
  sob_consulta: "Sob consulta",
  em_breve: "Em breve",
  oculto: "Oculto",
  exclusivo_interno: "Exclusivo interno",
  exclusivo_white_label: "Exclusivo White Label",
};

/** Lista todos os contratos recorrentes (somente staff). */
export const listBillingContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data, error } = await supabaseAdmin
      .from("billing_contracts")
      .select(`
        id, company_id, plan_id, status, start_date, due_day, next_due_date,
        recurring_amount, setup_amount, setup_paid_at, nfe_issued_at, last_paid_at,
        pix_key, pix_copy_paste,
        companies:company_id ( name, is_active ),
        billing_plans:plan_id ( name, code, cycle ),
        billing_invoices ( id, due_date, amount, status, paid_at )
      `)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { contracts: data ?? [] };
  });

/** Status do contrato da empresa do usuário (usado para gating). */
export const getMyBillingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("billing_contracts")
      .select("id, status, next_due_date, recurring_amount, pix_key, pix_copy_paste")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rows) return { hasContract: false as const };

    let openInvoice = null as null | {
      id: string;
      due_date: string;
      amount: number;
      status: string;
      pix_key: string | null;
      pix_copy_paste: string | null;
    };
    if (rows.status === "suspended") {
      const { data: inv } = await supabase
        .from("billing_invoices")
        .select("id, due_date, amount, status, pix_key, pix_copy_paste")
        .eq("contract_id", rows.id)
        .in("status", ["open", "overdue"])
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      openInvoice = inv ?? null;
    }
    return { hasContract: true as const, contract: rows, openInvoice };
  });

/** Marca fatura como paga (gera receita realizada, reativa contrato). */
export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { invoiceId: string }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { error } = await supabaseAdmin.rpc("billing_mark_paid", { _invoice_id: data.invoiceId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Roda o ciclo de cobrança manualmente (staff). */
export const runBillingCycleNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data, error } = await supabaseAdmin.rpc("billing_run_cycle");
    if (error) throw new Error(error.message);
    return { result: data };
  });

/** Lê / atualiza a política padrão. */
export const getDefaultDunningPolicy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("billing_dunning_policy")
      .select("*")
      .eq("is_default", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { policy: data };
  });

export const updateDunningPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    id: string;
    name: string;
    steps: Array<{ code: string; offset_days: number; channels: string[]; template_code: string }>;
    suspend_offset_days: number;
  }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { error } = await supabaseAdmin
      .from("billing_dunning_policy")
      .update({
        name: data.name,
        steps: data.steps,
        suspend_offset_days: data.suspend_offset_days,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista planos disponíveis. */
export const listBillingPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("is_active", true)
      .order("recurring_amount");
    if (error) throw new Error(error.message);
    return { plans: data ?? [] };
  });
