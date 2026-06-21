import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchFunnelTelemetry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [stats, conv, fails] = await Promise.all([
      supabase.from("v_funnel_dispatch_stats" as any).select("*"),
      supabase.from("v_funnel_conversion" as any).select("*"),
      supabase.from("v_funnel_recent_failures" as any).select("*"),
    ]);
    return {
      stats: (stats.data ?? []) as any[],
      conversion: (conv.data ?? []) as any[],
      failures: (fails.data ?? []) as any[],
      errors: [stats.error, conv.error, fails.error].filter(Boolean).map((e) => e!.message),
    };
  });
