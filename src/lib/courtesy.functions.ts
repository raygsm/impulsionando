// Fase 3.3 — Cortesia Full 30 dias (Core Impulsionando).
// Server functions mínimas para conceder, estender, converter e revogar
// a cortesia Full de um cliente conectado ao Core. Toda escrita é auditada
// em `core_courtesy_events` e só é permitida à equipe Impulsionando.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_DAYS = 30;

async function ensureStaff(context: { supabase: any; userId: string }) {
  const { data: isStaff } = await context.supabase.rpc("is_impulsionando_staff", {
    _user: context.userId,
  });
  if (!isStaff) throw new Error("Apenas equipe Impulsionando.");
}

async function readDefaultDays(supabase: any): Promise<number> {
  const { data } = await supabase
    .from("core_settings")
    .select("value")
    .eq("key", "full_courtesy_days_default")
    .maybeSingle();
  const raw = data?.value;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number(raw ?? DEFAULT_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAYS;
}

/** Lê o status de cortesia + parâmetro global. */
export const getFullCourtesy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ companyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const [{ data: company }, { data: plan }, { data: events }, defaultDays] = await Promise.all([
      context.supabase
        .from("companies")
        .select(
          "id,name,subdomain,full_courtesy_status,full_courtesy_started_at,full_courtesy_ends_at,full_courtesy_days,full_courtesy_plan_id",
        )
        .eq("id", data.companyId)
        .maybeSingle(),
      context.supabase.from("billing_plans").select("id,name,code").eq("code", "full").maybeSingle(),
      context.supabase
        .from("core_courtesy_events")
        .select("id,event_type,days,previous_status,new_status,starts_at,ends_at,note,actor_user_id,created_at")
        .eq("company_id", data.companyId)
        .order("created_at", { ascending: false })
        .limit(20),
      readDefaultDays(context.supabase),
    ]);
    if (!company) throw new Error("Cliente não encontrado.");
    const now = Date.now();
    const ends = company.full_courtesy_ends_at ? new Date(company.full_courtesy_ends_at).getTime() : null;
    const daysLeft = ends ? Math.max(0, Math.ceil((ends - now) / 86_400_000)) : null;
    return {
      company,
      fullPlan: plan ?? null,
      defaultDays,
      daysLeft,
      events: events ?? [],
    };
  });

/** Concede cortesia Full por N dias (default do parâmetro global). */
export const grantFullCourtesy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        companyId: z.string().uuid(),
        days: z.number().int().min(1).max(365).optional(),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const days = data.days ?? (await readDefaultDays(context.supabase));
    const { data: fullPlan } = await context.supabase
      .from("billing_plans")
      .select("id")
      .eq("code", "full")
      .maybeSingle();

    const { data: current } = await context.supabase
      .from("companies")
      .select("full_courtesy_status")
      .eq("id", data.companyId)
      .maybeSingle();

    const now = new Date();
    const ends = new Date(now.getTime() + days * 86_400_000);

    const { error } = await context.supabase
      .from("companies")
      .update({
        full_courtesy_status: "active",
        full_courtesy_started_at: now.toISOString(),
        full_courtesy_ends_at: ends.toISOString(),
        full_courtesy_days: days,
        full_courtesy_plan_id: fullPlan?.id ?? null,
      })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);

    await context.supabase.from("core_courtesy_events").insert({
      company_id: data.companyId,
      event_type: "grant",
      days,
      plan_id: fullPlan?.id ?? null,
      previous_status: current?.full_courtesy_status ?? null,
      new_status: "active",
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
      note: data.note ?? null,
      actor_user_id: context.userId,
    });

    return { ok: true, days, ends_at: ends.toISOString() };
  });

/** Estende a cortesia atual por mais N dias (soma a partir da data de fim ou de agora). */
export const extendFullCourtesy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        companyId: z.string().uuid(),
        extraDays: z.number().int().min(1).max(365),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: current } = await context.supabase
      .from("companies")
      .select("full_courtesy_status,full_courtesy_ends_at,full_courtesy_days")
      .eq("id", data.companyId)
      .maybeSingle();
    if (!current) throw new Error("Cliente não encontrado.");

    const baseTs = current.full_courtesy_ends_at
      ? Math.max(new Date(current.full_courtesy_ends_at).getTime(), Date.now())
      : Date.now();
    const newEnds = new Date(baseTs + data.extraDays * 86_400_000);
    const newTotalDays = (current.full_courtesy_days ?? 0) + data.extraDays;

    const { error } = await context.supabase
      .from("companies")
      .update({
        full_courtesy_status: "active",
        full_courtesy_ends_at: newEnds.toISOString(),
        full_courtesy_days: newTotalDays,
      })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);

    await context.supabase.from("core_courtesy_events").insert({
      company_id: data.companyId,
      event_type: "extend",
      days: data.extraDays,
      previous_status: current.full_courtesy_status,
      new_status: "active",
      ends_at: newEnds.toISOString(),
      note: data.note ?? null,
      actor_user_id: context.userId,
    });
    return { ok: true, ends_at: newEnds.toISOString(), total_days: newTotalDays };
  });

/** Revoga a cortesia (não gera cobrança). */
export const revokeFullCourtesy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ companyId: z.string().uuid(), note: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: current } = await context.supabase
      .from("companies")
      .select("full_courtesy_status")
      .eq("id", data.companyId)
      .maybeSingle();

    const { error } = await context.supabase
      .from("companies")
      .update({ full_courtesy_status: "revoked" })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);

    await context.supabase.from("core_courtesy_events").insert({
      company_id: data.companyId,
      event_type: "revoke",
      previous_status: current?.full_courtesy_status ?? null,
      new_status: "revoked",
      note: data.note ?? null,
      actor_user_id: context.userId,
    });
    return { ok: true };
  });

/** Marca cortesia como convertida (cliente passou para cobrança). Não cria fatura. */
export const convertFullCourtesy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ companyId: z.string().uuid(), note: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { data: current } = await context.supabase
      .from("companies")
      .select("full_courtesy_status")
      .eq("id", data.companyId)
      .maybeSingle();

    const { error } = await context.supabase
      .from("companies")
      .update({ full_courtesy_status: "converted" })
      .eq("id", data.companyId);
    if (error) throw new Error(error.message);

    await context.supabase.from("core_courtesy_events").insert({
      company_id: data.companyId,
      event_type: "convert",
      previous_status: current?.full_courtesy_status ?? null,
      new_status: "converted",
      note: data.note ?? null,
      actor_user_id: context.userId,
    });
    return { ok: true };
  });

/** Atualiza o parâmetro global de dias padrão. */
export const setDefaultCourtesyDays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ days: z.number().int().min(1).max(365) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context);
    const { error } = await context.supabase
      .from("core_settings")
      .update({ value: data.days as unknown as object })
      .eq("key", "full_courtesy_days_default");
    if (error) throw new Error(error.message);
    return { ok: true, days: data.days };
  });
