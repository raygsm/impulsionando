import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Catálogo comercial público. Diferencia proposta (quote) de checkout direto. */
export const getCommercialAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: modules }, { data: plans }] = await Promise.all([
    supabaseAdmin.from("modules").select("slug,name,status_comercial,readiness_status,show_in_checkout,show_on_site,show_in_plans,allow_standalone,cta_primary").eq("is_active", true),
    supabaseAdmin.from("billing_plans").select("id,code,name,status_comercial,show_in_checkout,show_on_site,allow_direct_checkout,route_to_quote,route_to_whatsapp,recurring_amount,setup_fee,min_contract_days,min_installments,cta").eq("is_active", true),
  ]);

  const availableModuleSlugs = (modules ?? [])
    .filter((m: any) => m.status_comercial === "disponivel_contratacao" && m.show_in_plans !== false && ["certificado", "publicado"].includes(String(m.readiness_status)))
    .map((m: any) => String(m.slug));

  const directCheckoutModuleSlugs = (modules ?? [])
    .filter((m: any) => m.status_comercial === "disponivel_contratacao" && m.show_in_checkout === true && ["certificado", "publicado"].includes(String(m.readiness_status)))
    .map((m: any) => String(m.slug));

  const quotePlanCodes = (plans ?? [])
    .filter((p: any) => p.status_comercial === "disponivel_contratacao" && p.route_to_quote === true)
    .map((p: any) => String(p.code).toLowerCase());

  const availablePlanCodes = (plans ?? [])
    .filter((p: any) => p.status_comercial === "disponivel_contratacao" && p.show_in_checkout === true && p.allow_direct_checkout === true)
    .map((p: any) => String(p.code).toLowerCase());

  const moduleStatus: Record<string, any> = {};
  for (const m of modules ?? []) moduleStatus[String((m as any).slug)] = m;
  const planStatus: Record<string, any> = {};
  for (const p of plans ?? []) planStatus[String((p as any).code).toLowerCase()] = p;

  return { availableModuleSlugs, directCheckoutModuleSlugs, quotePlanCodes, availablePlanCodes, moduleStatus, planStatus, hasData: (modules ?? []).length > 0 };
});
