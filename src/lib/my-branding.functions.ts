import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyBrandingCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS-scoped: returns only companies the user can read
    const { data, error } = await context.supabase
      .from("companies")
      .select("id, name, trade_name, logo_url, primary_color, secondary_color, is_active")
      .order("name", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return { companies: data ?? [] };
  });
