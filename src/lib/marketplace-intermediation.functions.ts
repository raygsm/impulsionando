// Fase 8 — Marketplace B2B: Taxa de Intermediação Digital
// Server fns para consultar GMV consolidado e operar engagements.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SummaryInput = z.object({
  companyId: z.string().uuid().optional(),
  months: z.number().int().min(1).max(24).default(3),
});

export const fetchMarketplaceGmvSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SummaryInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const since = new Date();
    since.setMonth(since.getMonth() - data.months + 1);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    let q = supa
      .from("v_marketplace_gmv_summary")
      .select("company_id, company_name, niche_id, period_month, engagements_count, completed_count, gmv_cents, intermediation_fee_cents, effective_bps")
      .gte("period_month", since.toISOString().slice(0, 10))
      .order("period_month", { ascending: false });
    if (data.companyId) q = q.eq("company_id", data.companyId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as any[];
    const totals = list.reduce(
      (acc, r) => {
        acc.gmv += Number(r.gmv_cents ?? 0);
        acc.fee += Number(r.intermediation_fee_cents ?? 0);
        acc.engagements += Number(r.engagements_count ?? 0);
        acc.completed += Number(r.completed_count ?? 0);
        return acc;
      },
      { gmv: 0, fee: 0, engagements: 0, completed: 0 },
    );

    return {
      months: data.months,
      since: since.toISOString().slice(0, 10),
      totals: {
        gmv: totals.gmv / 100,
        fee: totals.fee / 100,
        engagements: totals.engagements,
        completed: totals.completed,
        effectiveBps: totals.gmv > 0 ? Math.round((totals.fee / totals.gmv) * 10000) : null,
      },
      rows: list,
    };
  });

const MarkCompletedInput = z.object({
  engagementId: z.string().uuid(),
  gmvCents: z.number().int().min(0).optional(),
});

export const markEngagementCompleted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MarkCompletedInput.parse(d))
  .handler(async ({ data, context }) => {
    const supa = context.supabase as any;
    const patch: any = { status: "completed", completed_at: new Date().toISOString() };
    if (typeof data.gmvCents === "number") patch.gmv_cents = data.gmvCents;
    const { data: row, error } = await supa
      .from("eco_marketplace_engagements")
      .update(patch)
      .eq("id", data.engagementId)
      .select("id, status, gmv_cents, intermediation_fee_bps, intermediation_fee_cents")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, engagement: row };
  });
