import { createServerFn } from "@tanstack/react-start";

export const getCpCommercialCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: tiers, error: tiersError }, { data: module, error: moduleError }] = await Promise.all([
    supabaseAdmin
      .from("cp_commercial_tiers")
      .select("audience,code,name,min_users,max_users,monthly_amount,price_basis,status_comercial,description,sort_order")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("modules")
      .select("slug,name,description,status_tecnico,status_comercial,readiness_status,commercial_url")
      .eq("slug", "cp")
      .maybeSingle(),
  ]);

  if (tiersError) throw new Error(tiersError.message);
  if (moduleError) throw new Error(moduleError.message);

  return {
    module,
    whiteLabel: (tiers ?? []).filter((t) => t.audience === "white_label"),
    pf: (tiers ?? []).filter((t) => t.audience === "pf"),
    publicStatus: module?.status_comercial ?? "sob_consulta",
  };
});
