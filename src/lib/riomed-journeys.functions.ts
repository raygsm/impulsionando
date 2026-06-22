import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function companyId(ctx: any): Promise<string> {
  const { data } = await ctx.supabase.from("user_profiles").select("company_id").eq("user_id", ctx.userId).maybeSingle();
  if (!data?.company_id) throw new Error("Empresa não encontrada");
  return data.company_id as string;
}

const StepSchema = z.object({
  kind: z.enum(["wait", "whatsapp", "email", "sms", "tag", "branch"]),
  delayMinutes: z.number().int().min(0).max(60 * 24 * 30).optional(),
  template: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  tag: z.string().optional(),
  conditionField: z.string().optional(),
  conditionEquals: z.string().optional(),
  abVariant: z.enum(["A", "B"]).optional(),
  abWeight: z.number().min(0).max(100).optional(),
});

export const getJourneysOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const [aut, runs, leads, opps] = await Promise.all([
      sb.from("riomed_funnel_automations").select("*").eq("company_id", cid).order("priority", { ascending: true }).limit(200),
      sb.from("riomed_automation_runs").select("status,created_at,automation_id").eq("company_id", cid).order("created_at", { ascending: false }).limit(2000),
      sb.from("marketing_leads").select("id,status,created_at,niche_code,funnel_stage").eq("company_id", cid).limit(2000),
      sb.from("crm_opportunities").select("id,stage_id,amount,created_at").eq("company_id", cid).limit(2000),
    ]);
    const runsArr = runs.data ?? [];
    const byAut: Record<string, { total: number; ok: number; failed: number }> = {};
    for (const r of runsArr) {
      const k = (r as any).automation_id as string;
      if (!k) continue;
      byAut[k] ??= { total: 0, ok: 0, failed: 0 };
      byAut[k].total++;
      if ((r as any).status === "completed" || (r as any).status === "success") byAut[k].ok++;
      else if ((r as any).status === "failed" || (r as any).status === "error") byAut[k].failed++;
    }
    const leadsArr = leads.data ?? [];
    const stageCount: Record<string, number> = {};
    for (const l of leadsArr) {
      const s = (l as any).funnel_stage ?? "captacao";
      stageCount[s] = (stageCount[s] ?? 0) + 1;
    }
    return {
      automations: aut.data ?? [],
      runStats: byAut,
      funnel: {
        captacao: stageCount["captacao"] ?? 0,
        conversao: stageCount["conversao"] ?? 0,
        relacionamento: stageCount["relacionamento"] ?? 0,
        retencao: stageCount["retencao"] ?? 0,
        expansao: stageCount["expansao"] ?? 0,
        total: leadsArr.length,
        opportunities: (opps.data ?? []).length,
      },
    };
  });

export const upsertJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(2),
    description: z.string().optional(),
    funnelStage: z.enum(["captacao", "conversao", "relacionamento", "retencao", "expansao"]),
    triggerEvent: z.string().min(2),
    priority: z.number().int().min(0).default(100),
    isActive: z.boolean().default(true),
    conditions: z.record(z.string(), z.any()).default({}),
    steps: z.array(StepSchema).min(1),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const payload: any = {
      company_id: cid, name: data.name, description: data.description ?? null,
      funnel_stage: data.funnelStage, trigger_event: data.triggerEvent,
      priority: data.priority, is_active: data.isActive,
      conditions: data.conditions, actions: { steps: data.steps },
    };
    const { error } = data.id
      ? await sb.from("riomed_funnel_automations").update(payload).eq("id", data.id)
      : await sb.from("riomed_funnel_automations").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { error } = await sb.from("riomed_funnel_automations").update({ is_active: data.isActive }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { error } = await sb.from("riomed_funnel_automations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const evaluateSegment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    audience: z.enum(["leads", "customers", "opportunities"]).default("leads"),
    status: z.string().optional(),
    funnelStage: z.string().optional(),
    nicheCode: z.string().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const cid = await companyId(context as any);
    const table = data.audience === "customers" ? "customers" : data.audience === "opportunities" ? "crm_opportunities" : "marketing_leads";
    let q = sb.from(table).select("id", { count: "exact", head: true }).eq("company_id", cid);
    if (data.status && (table === "marketing_leads" || table === "customers")) q = q.eq("status", data.status);
    if (data.funnelStage && table === "marketing_leads") q = q.eq("funnel_stage", data.funnelStage);
    if (data.nicheCode && table === "marketing_leads") q = q.eq("niche_code", data.nicheCode);
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return { count: count ?? 0, table };
  });
