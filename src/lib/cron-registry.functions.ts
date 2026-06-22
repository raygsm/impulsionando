// Lista o registro de cron jobs do projeto a partir de cron.job + cron.job_run_details,
// via RPC public.core_list_cron_jobs (SECURITY DEFINER). Detecta duplicidade por URL
// chamada para evitar dois schedulers cobrindo o mesmo endpoint.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCronRegistry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabase.rpc("core_list_cron_jobs");
    if (error) throw error;

    const rows = (data ?? []) as Array<{
      jobid: number;
      jobname: string;
      schedule: string;
      active: boolean;
      url: string | null;
      last_run: string | null;
      last_status: string | null;
      ok_24h: number;
      bad_24h: number;
    }>;

    const urlCounts = new Map<string, number>();
    for (const r of rows) {
      if (!r.url) continue;
      urlCounts.set(r.url, (urlCounts.get(r.url) ?? 0) + 1);
    }
    const enriched = rows.map((r) => ({
      ...r,
      duplicateUrl: r.url ? (urlCounts.get(r.url) ?? 1) > 1 : false,
    }));

    return {
      rows: enriched,
      totals: {
        jobs: rows.length,
        active: rows.filter((r) => r.active).length,
        failed24h: rows.reduce((acc, r) => acc + Number(r.bad_24h ?? 0), 0),
        duplicates: enriched.filter((r) => r.duplicateUrl).length,
      },
    };
  });
