import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function riomedContext(supabase: any): Promise<{ tenantId: string; companyId: string }> {
  const { data, error } = await supabase
    .from("communication_tenants")
    .select("id,company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id || !data?.company_id) throw new Error("Cliente Rio Med não encontrado no Core");
  return { tenantId: data.id as string, companyId: data.company_id as string };
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

const JourneySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  funnelStage: z.enum(["captacao", "conversao", "relacionamento", "retencao", "expansao"]),
  triggerEvent: z.string().min(2).max(120),
  priority: z.number().int().min(0).max(10000).default(100),
  isActive: z.boolean().default(false),
  conditions: z.record(z.string(), z.any()).default({}),
  steps: z.array(StepSchema).min(1),
});

function normalizeAutomation(row: any) {
  const config = row?.config ?? {};
  return {
    id: row.id,
    automation_key: row.automation_key,
    name: config.name ?? row.automation_key,
    description: config.description ?? null,
    funnel_stage: config.funnel_stage ?? "captacao",
    trigger_event: config.trigger_event ?? row.automation_key,
    priority: Number(config.priority ?? 100),
    conditions: config.conditions ?? {},
    actions: { steps: Array.isArray(config.steps) ? config.steps : [] },
    is_active: row.status === "ACTIVE",
    requested_active: Boolean(config.requested_active),
    n8n_workflow_id: row.n8n_workflow_id ?? null,
    status: row.status,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const getJourneysOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = (context as any).supabase;
    const { tenantId, companyId } = await riomedContext(sb);
    const [aut, runs, contacts, opps] = await Promise.all([
      sb.from("communication_automations").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
      sb.from("communication_workflow_runs").select("status,created_at,automation_id").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(2000),
      sb.from("communication_contacts").select("id,attributes,created_at").eq("tenant_id", tenantId).is("merged_into_contact_id", null).limit(2000),
      sb.from("crm_opportunities").select("id,stage_id,metadata,created_at,closed_at").eq("company_id", companyId).limit(2000),
    ]);
    for (const r of [aut, runs, contacts, opps]) if (r.error) throw new Error(r.error.message);

    const runsArr = runs.data ?? [];
    const byAut: Record<string, { total: number; ok: number; failed: number }> = {};
    for (const r of runsArr) {
      const k = String((r as any).automation_id ?? "");
      if (!k) continue;
      byAut[k] ??= { total: 0, ok: 0, failed: 0 };
      byAut[k].total++;
      const status = String((r as any).status ?? "").toUpperCase();
      if (["COMPLETED", "SUCCESS", "SUCCEEDED"].includes(status)) byAut[k].ok++;
      if (["FAILED", "ERROR"].includes(status)) byAut[k].failed++;
    }

    const contactsArr = contacts.data ?? [];
    const stageCount: Record<string, number> = {};
    for (const contact of contactsArr) {
      const attributes = (contact as any).attributes ?? {};
      const stage = String(attributes.funnel_stage ?? attributes.lifecycle_stage ?? "captacao").toLowerCase();
      stageCount[stage] = (stageCount[stage] ?? 0) + 1;
    }

    return {
      automations: (aut.data ?? []).map(normalizeAutomation),
      runStats: byAut,
      funnel: {
        captacao: stageCount.captacao ?? 0,
        conversao: stageCount.conversao ?? 0,
        relacionamento: stageCount.relacionamento ?? 0,
        retencao: stageCount.retencao ?? 0,
        expansao: stageCount.expansao ?? 0,
        total: contactsArr.length,
        opportunities: (opps.data ?? []).length,
      },
    };
  });

export const upsertJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => JourneySchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    const config = {
      name: data.name,
      description: data.description ?? null,
      funnel_stage: data.funnelStage,
      trigger_event: data.triggerEvent,
      priority: data.priority,
      conditions: data.conditions,
      steps: data.steps,
      requested_active: data.isActive,
      client: "rio-med",
    };

    if (data.id) {
      const { data: current, error: readError } = await sb.from("communication_automations")
        .select("id,version,n8n_workflow_id,status")
        .eq("id", data.id).eq("tenant_id", tenantId).maybeSingle();
      if (readError) throw new Error(readError.message);
      if (!current) throw new Error("Jornada não encontrada");
      const canActivate = data.isActive && Boolean(current.n8n_workflow_id);
      const { error } = await sb.from("communication_automations").update({
        config,
        version: Number(current.version ?? 1) + 1,
        status: canActivate ? "ACTIVE" : "DRAFT",
      }).eq("id", data.id).eq("tenant_id", tenantId);
      if (error) throw new Error(error.message);
      return { ok: true, active: canActivate, needsWorkflowBinding: data.isActive && !current.n8n_workflow_id };
    }

    const automationKey = `riomed.journey.${data.funnelStage}.${data.triggerEvent}`
      .toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 180);
    const { data: created, error } = await sb.from("communication_automations").insert({
      tenant_id: tenantId,
      automation_key: automationKey,
      version: 1,
      status: "DRAFT",
      config,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: created.id, active: false, needsWorkflowBinding: data.isActive };
  });

export const toggleJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    const { data: current, error: readError } = await sb.from("communication_automations")
      .select("id,n8n_workflow_id,config").eq("id", data.id).eq("tenant_id", tenantId).maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Jornada não encontrada");
    if (data.isActive && !current.n8n_workflow_id) {
      throw new Error("Esta jornada ainda não possui workflow de execução vinculado. Salve-a como rascunho até a automação ser homologada.");
    }
    const config = { ...(current.config ?? {}), requested_active: data.isActive };
    const { error } = await sb.from("communication_automations").update({ status: data.isActive ? "ACTIVE" : "DRAFT", config })
      .eq("id", data.id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { ok: true, active: data.isActive };
  });

export const deleteJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = (context as any).supabase;
    const { tenantId } = await riomedContext(sb);
    const { count, error: runError } = await sb.from("communication_workflow_runs")
      .select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("automation_id", data.id);
    if (runError) throw new Error(runError.message);
    if ((count ?? 0) > 0) throw new Error("Jornada com histórico de execução não pode ser excluída; desative-a para preservar auditoria.");
    const { error } = await sb.from("communication_automations").delete().eq("id", data.id).eq("tenant_id", tenantId);
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
    const { tenantId, companyId } = await riomedContext(sb);

    if (data.audience === "opportunities") {
      let q = sb.from("crm_opportunities").select("id", { count: "exact", head: true }).eq("company_id", companyId);
      if (data.status) q = q.contains("metadata", { status: data.status });
      const { count, error } = await q;
      if (error) throw new Error(error.message);
      return { count: count ?? 0, table: "crm_opportunities" };
    }

    let q = sb.from("communication_contacts").select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId).is("merged_into_contact_id", null);
    if (data.audience === "customers") q = q.contains("attributes", { lifecycle_type: "customer" });
    if (data.audience === "leads") q = q.not("attributes->>lifecycle_type", "eq", "customer");
    if (data.status) q = q.contains("attributes", { status: data.status });
    if (data.funnelStage) q = q.contains("attributes", { funnel_stage: data.funnelStage });
    if (data.nicheCode) q = q.contains("attributes", { niche_code: data.nicheCode });
    const { count, error } = await q;
    if (error) throw new Error(error.message);
    return { count: count ?? 0, table: "communication_contacts" };
  });