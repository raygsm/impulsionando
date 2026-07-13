import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyBriefings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | null)?.email ?? null;
    if (!email) return { email: null, briefings: [] as any[] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("core_briefings")
      .select("id, company_name, source, status, niche, goals, answers, created_at, updated_at, reviewed_at")
      .eq("contact_email", email)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { email, briefings: data ?? [] };
  });
