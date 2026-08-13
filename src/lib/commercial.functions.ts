import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Fonte pública única de verdade para disponibilidade comercial.
 *
 * O frontend NÃO decide se um plano ou módulo pode ser vendido/publicado.
 * Essa decisão pertence ao backend e é controlada pelos campos de status,
 * publicação e checkout. Os dados retornados aqui são somente metadados
 * comerciais não sensíveis.
 */
export const getCommercialAvailability = createServerFn({ method: "GET" }).handler(
  async () => {
    const [{ data: modules, error: modulesError }, { data: plans, error: plansError }] = await Promise.all([
      supabaseAdmin
        .from("modules")
        .select("slug, name, status_comercial, show_in_checkout, show_on_site, show_in_plans, allow_standalone, monthly_price, setup_fee, min_installments, cta_primary")
        .eq("is_active", true),
      supabaseAdmin
        .from("billing_plans")
        .select("id, code, name, description, status_comercial, show_in_checkout, show_on_site, allow_direct_checkout, route_to_quote, route_to_whatsapp, recurring_amount, setup_fee, min_installments, min_contract_days, included_module_count, cta, sort_order")
        .eq("is_active", true),
    ]);

    if (modulesError) throw new Error(modulesError.message);
    if (plansError) throw new Error(plansError.message);

    const isAvailable = (s?: string | null, showInCheckout?: boolean | null) =>
      s === "disponivel_contratacao" && showInCheckout !== false;

    const availableModuleSlugs = (modules ?? [])
      .filter((m: any) => isAvailable(m.status_comercial, m.show_in_checkout))
      .map((m: any) => m.slug as string);

    const availablePlanCodes = (plans ?? [])
      .filter((p: any) => isAvailable(p.status_comercial, p.show_in_checkout) && p.allow_direct_checkout !== false)
      .map((p: any) => (p.code as string).toLowerCase());

    const publishedPlans = (plans ?? [])
      .filter((p: any) => p.show_on_site === true && p.status_comercial !== "oculto")
      .sort((a: any, b: any) => Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100))
      .map((p: any) => ({
        code: String(p.code),
        name: String(p.name),
        description: p.description ? String(p.description) : null,
        status: p.status_comercial ?? "oculto",
        recurring_amount: Number(p.recurring_amount ?? 0),
        setup_fee: Number(p.setup_fee ?? 0),
        min_installments: Number(p.min_installments ?? 0),
        min_contract_days: Number(p.min_contract_days ?? 0),
        included_module_count: Number(p.included_module_count ?? 0),
        allow_direct_checkout: p.allow_direct_checkout !== false,
        route_to_quote: !!p.route_to_quote,
        route_to_whatsapp: !!p.route_to_whatsapp,
        cta: p.cta ? String(p.cta) : null,
      }));

    const moduleStatus: Record<string, { status: string; allow_standalone: boolean; show_in_checkout: boolean; show_on_site: boolean }> = {};
    (modules ?? []).forEach((m: any) => {
      moduleStatus[m.slug] = {
        status: m.status_comercial ?? "oculto",
        allow_standalone: m.allow_standalone !== false,
        show_in_checkout: m.show_in_checkout !== false,
        show_on_site: m.show_on_site === true,
      };
    });

    const planStatus: Record<string, { status: string; allow_direct_checkout: boolean; route_to_quote: boolean; route_to_whatsapp: boolean; show_on_site: boolean }> = {};
    (plans ?? []).forEach((p: any) => {
      planStatus[(p.code as string).toLowerCase()] = {
        status: p.status_comercial ?? "oculto",
        allow_direct_checkout: p.allow_direct_checkout !== false,
        route_to_quote: !!p.route_to_quote,
        route_to_whatsapp: !!p.route_to_whatsapp,
        show_on_site: p.show_on_site === true,
      };
    });

    return {
      availableModuleSlugs,
      availablePlanCodes,
      moduleStatus,
      planStatus,
      publishedPlans,
      hasPublishedPlans: publishedPlans.length > 0,
      publishedPlanCount: publishedPlans.length,
      hasData: (modules ?? []).length > 0 || (plans ?? []).length > 0,
    };
  },
);
