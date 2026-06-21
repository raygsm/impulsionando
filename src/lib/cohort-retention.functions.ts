import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cohort Retention — matriz de retenção mensal de tenants.
 * Cada linha = mês de signup (cohort). Cada coluna = meses depois (M0..M11).
 * Valor = % do cohort ainda ativo (is_active=true) naquele mês.
 *
 * Como "ativo até X" não está modelado, aproximamos:
 *   - signup = companies.created_at
 *   - churn = companies.is_active=false AND updated_at (proxy do deactivated_at)
 *   - se is_active=true, o tenant conta em todos os meses até hoje
 */
export const getCohortRetention = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: staff } = await supabaseAdmin.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data: companies } = await supabaseAdmin
      .from("companies")
      .select("id, created_at, is_active, updated_at")
      .order("created_at", { ascending: true })
      .limit(5000);

    const monthsBack = 12;
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthDiff = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

    const cohorts = new Map<string, { signupMonth: Date; tenants: Array<{ signup: Date; end: Date | null }> }>();
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
      cohorts.set(monthKey(d), { signupMonth: d, tenants: [] });
    }

    (companies ?? []).forEach((c: any) => {
      const signup = new Date(c.created_at);
      if (signup < startMonth) return;
      const key = monthKey(signup);
      const cohort = cohorts.get(key);
      if (!cohort) return;
      const end = c.is_active === false && c.updated_at ? new Date(c.updated_at) : null;
      cohort.tenants.push({ signup, end });
    });

    const rows = [...cohorts.entries()].map(([key, c]) => {
      const size = c.tenants.length;
      const maxOffset = Math.min(monthsBack - 1, monthDiff(c.signupMonth, now));
      const retention: Array<number | null> = [];
      for (let m = 0; m <= monthsBack - 1; m++) {
        if (m > maxOffset) { retention.push(null); continue; }
        if (size === 0) { retention.push(null); continue; }
        const target = new Date(c.signupMonth.getFullYear(), c.signupMonth.getMonth() + m, 1);
        const alive = c.tenants.filter((t) => !t.end || t.end > target).length;
        retention.push(Math.round((alive / size) * 100));
      }
      return { cohort: key, size, retention };
    });

    return { rows, monthsBack };
  });
