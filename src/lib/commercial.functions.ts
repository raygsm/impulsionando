import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Endpoint público (sem auth) que devolve quais módulos/planos estão
 * efetivamente liberados para contratação no checkout/site.
 *
 * Regra: apenas itens com status_comercial = 'disponivel_contratacao'
 * e show_in_checkout = true e is_active = true.
 *
 * Esses dados não contêm informação sensível — só metadados comerciais
 * já visíveis publicamente. Por isso usa supabaseAdmin com SELECT mínimo.
 */
export const getCommercialAvailability = createServerFn({ method: "GET" }).handler(
  async () => {
    const [{ data: modules }, { data: plans }] = await Promise.all([
      supabaseAdmin
        .from("modules")
        .select("slug, name, status_comercial, show_in_checkout, show_on_site, show_in_plans, allow_standalone, monthly_price, setup_fee, min_installments, cta_primary")
        .eq("is_active", true),
      supabaseAdmin
        .from("billing_plans")
        .select("id, code, name, status_comercial, show_in_checkout, show_on_site, allow_direct_checkout, route_to_quote, route_to_whatsapp, recurring_amount, setup_fee, min_installments, cta")
        .eq("is_active", true),
    ]);

    const isAvailable = (s?: string | null, showInCheckout?: boolean | null) =>
      s === "disponivel_contratacao" && showInCheckout !== false;

    const availableModuleSlugs = (modules ?? [])
      .filter((m: any) => isAvailable(m.status_comercial, m.show_in_checkout))
      .map((m: any) => m.slug as string);

    const availablePlanCodes = (plans ?? [])
      .filter((p: any) => isAvailable(p.status_comercial, p.show_in_checkout) && p.allow_direct_checkout !== false)
      .map((p: any) => (p.code as string).toLowerCase());

    // Status detalhado por módulo (para mostrar "sob consulta", "em breve", etc.)
    const moduleStatus: Record<string, { status: string; allow_standalone: boolean; show_in_checkout: boolean }> = {};
    (modules ?? []).forEach((m: any) => {
      moduleStatus[m.slug] = {
        status: m.status_comercial ?? "oculto",
        allow_standalone: m.allow_standalone !== false,
        show_in_checkout: m.show_in_checkout !== false,
      };
    });

    const planStatus: Record<string, { status: string; allow_direct_checkout: boolean; route_to_quote: boolean; route_to_whatsapp: boolean }> = {};
    (plans ?? []).forEach((p: any) => {
      planStatus[(p.code as string).toLowerCase()] = {
        status: p.status_comercial ?? "oculto",
        allow_direct_checkout: p.allow_direct_checkout !== false,
        route_to_quote: !!p.route_to_quote,
        route_to_whatsapp: !!p.route_to_whatsapp,
      };
    });

    return {
      availableModuleSlugs,
      availablePlanCodes,
      moduleStatus,
      planStatus,
      hasData: (modules ?? []).length > 0,
    };
  },
);
