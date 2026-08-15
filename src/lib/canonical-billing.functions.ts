import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function myCompanyId(supabase: any) {
  const { data, error } = await supabase.rpc("current_user_company_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sua conta ainda não está vinculada a uma empresa.");
  return data as string;
}

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito à equipe Impulsionando.");
}

export const getMyCanonicalBilling = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await myCompanyId(context.supabase);
    const [{ data: contracts, error: ce }, { data: plans, error: pe }, { data: requests, error: re }, { data: invoices, error: ie }] = await Promise.all([
      context.supabase.from("billing_contracts").select("id,plan_id,start_date,due_day,next_due_date,recurring_amount,status,setup_paid_at,setup_amount,last_paid_at,metadata").eq("company_id", companyId).order("created_at", { ascending: false }),
      context.supabase.from("billing_plans").select("id,code,name,description,recurring_amount,setup_fee,due_day,min_contract_days,included_module_count,status_comercial,show_on_site").eq("is_active", true).in("code", ["ESSENCIAL","PRO","ENTERPRISE"]).order("sort_order"),
      context.supabase.from("billing_plan_change_requests").select("id,current_plan_id,new_plan_id,direction,effective_date,next_anchor_date,old_monthly,new_monthly,prorata_charge,prorata_credit,setup_charge,status,requested_at,accepted_at,terms_version,applied_at").eq("company_id", companyId).order("requested_at", { ascending: false }).limit(20),
      context.supabase.from("billing_invoices").select("id,period_start,period_end,due_date,amount,status,paid_at,mp_payment_id").eq("company_id", companyId).order("due_date", { ascending: false }).limit(24),
    ]);
    if (ce) throw new Error(ce.message); if (pe) throw new Error(pe.message); if (re) throw new Error(re.message); if (ie) throw new Error(ie.message);
    return { companyId, contract: contracts?.[0] ?? null, plans: plans ?? [], requests: requests ?? [], invoices: invoices ?? [] };
  });

export const quoteMyPlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contractId: z.string().uuid(), newPlanId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: quote, error } = await context.supabase.rpc("billing_plan_change_quote", { p_contract_id: data.contractId, p_new_plan_id: data.newPlanId, p_effective_date: new Date().toISOString().slice(0,10) });
    if (error) throw new Error(error.message);
    return quote as any;
  });

export const requestMyPlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ contractId: z.string().uuid(), newPlanId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: requestId, error } = await context.supabase.rpc("billing_request_plan_change", { p_contract_id: data.contractId, p_new_plan_id: data.newPlanId, p_effective_date: new Date().toISOString().slice(0,10) });
    if (error) throw new Error(error.message);
    return { requestId: requestId as string };
  });

export const acceptMyPlanChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ requestId: z.string().uuid(), termsVersion: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase.rpc("billing_accept_plan_change", { p_request_id: data.requestId, p_terms_version: data.termsVersion, p_ip_hash: null, p_user_agent_hash: null });
    if (error) throw new Error(error.message);
    return result as any;
  });

export const getCanonicalBillingAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: contracts, error: ce }, { data: companies, error: coe }, { data: plans, error: pe }, { data: requests, error: re }, { data: invoices, error: ie }] = await Promise.all([
      supabaseAdmin.from("billing_contracts").select("id,company_id,plan_id,start_date,due_day,next_due_date,recurring_amount,status,setup_paid_at,setup_amount,last_paid_at,created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("companies").select("id,name,email,is_active").order("name"),
      supabaseAdmin.from("billing_plans").select("id,code,name,recurring_amount,setup_fee,due_day,min_contract_days,status_comercial").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("billing_plan_change_requests").select("id,company_id,contract_id,current_plan_id,new_plan_id,direction,prorata_charge,prorata_credit,status,requested_at,accepted_at,applied_at").order("requested_at", { ascending: false }).limit(200),
      supabaseAdmin.from("billing_invoices").select("id,company_id,contract_id,due_date,amount,status,paid_at").order("due_date", { ascending: false }).limit(500),
    ]);
    if (ce) throw new Error(ce.message); if (coe) throw new Error(coe.message); if (pe) throw new Error(pe.message); if (re) throw new Error(re.message); if (ie) throw new Error(ie.message);
    return { contracts: contracts ?? [], companies: companies ?? [], plans: plans ?? [], requests: requests ?? [], invoices: invoices ?? [] };
  });
