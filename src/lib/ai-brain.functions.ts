// Fase 3.4 — Cérebro IA por Cliente (Core Impulsionando).
// Server functions para configurar/auditar o assistente virtual de cada cliente.
// Regras: staff Impulsionando tem acesso total; membros do próprio cliente
// (user_roles.company_id) leem e editam apenas o cérebro da sua empresa.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAccess(
  context: { supabase: any; userId: string },
  companyId: string,
): Promise<{ isStaff: boolean }> {
  const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", {
    _user: context.userId,
  });
  if (isStaff) return { isStaff: true };
  const { data: role } = await context.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("company_id", companyId)
    .limit(1)
    .maybeSingle();
  if (!role) throw new Error("Sem acesso a este cliente.");
  return { isStaff: false };
}

const BrainInput = z.object({
  companyId: z.string().uuid(),
  agent_name: z.string().max(120).nullable().optional(),
  tone: z.string().max(200).nullable().optional(),
  approach: z.string().max(500).nullable().optional(),
  languages: z.array(z.string().max(20)).max(20).optional(),
  channels: z.array(z.string().max(40)).max(20).optional(),
  schedule: z.record(z.any()).optional(),
  base_prompt: z.string().max(8000).nullable().optional(),
  complementary_prompt: z.string().max(8000).nullable().optional(),
  status: z.enum(["draft", "active", "inactive"]).optional(),
  note: z.string().max(500).optional(),
});

/** Lê a configuração do cérebro IA + base de conhecimento + últimos eventos. */
export const getAiBrain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.companyId);
    const [{ data: company }, { data: brain }] = await Promise.all([
      context.supabase
        .from("companies")
        .select("id,name,subdomain")
        .eq("id", data.companyId)
        .maybeSingle(),
      context.supabase
        .from("core_ai_brains")
        .select("*")
        .eq("company_id", data.companyId)
        .maybeSingle(),
    ]);
    if (!company) throw new Error("Cliente não encontrado.");

    const [{ data: knowledge }, { data: events }] = await Promise.all([
      brain
        ? context.supabase
            .from("core_ai_brain_knowledge")
            .select("id,title,kind,content,source_url,is_active,updated_at")
            .eq("brain_id", brain.id)
            .order("updated_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as any[] }),
      context.supabase
        .from("core_ai_brain_events")
        .select("id,event_type,previous_status,new_status,changes,note,actor_user_id,created_at")
        .eq("company_id", data.companyId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      company,
      brain: brain ?? null,
      knowledge: knowledge ?? [],
      events: events ?? [],
    };
  });

/** Cria/atualiza a configuração do cérebro IA (upsert por company_id). */
export const upsertAiBrain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => BrainInput.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.companyId);

    const { data: existing } = await context.supabase
      .from("core_ai_brains")
      .select("id,status")
      .eq("company_id", data.companyId)
      .maybeSingle();

    const payload: Record<string, any> = {
      company_id: data.companyId,
      agent_name: data.agent_name ?? null,
      tone: data.tone ?? null,
      approach: data.approach ?? null,
      languages: data.languages ?? [],
      channels: data.channels ?? [],
      schedule: data.schedule ?? {},
      base_prompt: data.base_prompt ?? null,
      complementary_prompt: data.complementary_prompt ?? null,
      status: data.status ?? existing?.status ?? "draft",
      updated_by: context.userId,
    };
    if (!existing) payload.created_by = context.userId;

    const { data: saved, error } = await context.supabase
      .from("core_ai_brains")
      .upsert(payload, { onConflict: "company_id" })
      .select("id,status")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("core_ai_brain_events").insert({
      brain_id: saved.id,
      company_id: data.companyId,
      event_type: existing ? "update" : "create",
      previous_status: existing?.status ?? null,
      new_status: saved.status,
      changes: {
        agent_name: payload.agent_name,
        tone: payload.tone,
        status: payload.status,
      },
      note: data.note ?? null,
      actor_user_id: context.userId,
    });

    return { ok: true, brainId: saved.id, status: saved.status };
  });

/** Alterna status (draft/active/inactive) e registra auditoria. */
export const setAiBrainStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        companyId: z.string().uuid(),
        status: z.enum(["draft", "active", "inactive"]),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.companyId);
    const { data: brain } = await context.supabase
      .from("core_ai_brains")
      .select("id,status")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (!brain) throw new Error("Configure o cérebro IA antes de alterar o status.");

    const { error } = await context.supabase
      .from("core_ai_brains")
      .update({ status: data.status, updated_by: context.userId })
      .eq("id", brain.id);
    if (error) throw new Error(error.message);

    await context.supabase.from("core_ai_brain_events").insert({
      brain_id: brain.id,
      company_id: data.companyId,
      event_type: "status_change",
      previous_status: brain.status,
      new_status: data.status,
      note: data.note ?? null,
      actor_user_id: context.userId,
    });
    return { ok: true, status: data.status };
  });

/** Adiciona item na base de conhecimento. */
export const addAiBrainKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        companyId: z.string().uuid(),
        title: z.string().min(1).max(200),
        kind: z.enum(["note", "faq", "doc", "url", "script", "policy"]).default("note"),
        content: z.string().max(20000).optional(),
        source_url: z.string().url().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.companyId);
    const { data: brain } = await context.supabase
      .from("core_ai_brains")
      .select("id")
      .eq("company_id", data.companyId)
      .maybeSingle();
    if (!brain) throw new Error("Configure o cérebro IA antes de adicionar conhecimento.");

    const { data: item, error } = await context.supabase
      .from("core_ai_brain_knowledge")
      .insert({
        brain_id: brain.id,
        company_id: data.companyId,
        title: data.title,
        kind: data.kind,
        content: data.content ?? null,
        source_url: data.source_url ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("core_ai_brain_events").insert({
      brain_id: brain.id,
      company_id: data.companyId,
      event_type: "kb_add",
      changes: { title: data.title, kind: data.kind },
      actor_user_id: context.userId,
    });
    return { ok: true, id: item.id };
  });

/** Remove item da base de conhecimento. */
export const removeAiBrainKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAccess(context, data.companyId);
    const { data: item } = await context.supabase
      .from("core_ai_brain_knowledge")
      .select("id,brain_id,title,company_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!item || item.company_id !== data.companyId) throw new Error("Item não encontrado.");

    const { error } = await context.supabase
      .from("core_ai_brain_knowledge")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await context.supabase.from("core_ai_brain_events").insert({
      brain_id: item.brain_id,
      company_id: data.companyId,
      event_type: "kb_remove",
      changes: { title: item.title },
      actor_user_id: context.userId,
    });
    return { ok: true };
  });
