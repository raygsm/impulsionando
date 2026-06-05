import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLAN_VALUES = ["essencial", "integrado", "avancado", "sob_medida"] as const;

const RequestTrialSchema = z.object({
  contact_name: z.string().trim().min(2).max(120),
  contact_company: z.string().trim().min(2).max(120),
  contact_email: z.string().trim().email().max(200),
  contact_whatsapp: z.string().trim().min(8).max(40),
  contact_doc: z.string().trim().max(40).optional().nullable(),
  chosen_plan: z.enum(PLAN_VALUES),
  accept_terms: z.literal(true),
  accept_billing: z.literal(true),
  accept_suspension: z.literal(true),
  accept_communication: z.literal(true),
  source: z.string().trim().max(60).optional(),
});

// Público — qualquer visitante do site pode iniciar um Trial.
export const requestTrial = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RequestTrialSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: trialId, error } = await supabaseAdmin.rpc("trial_create", {
      _contact_name: data.contact_name,
      _contact_company: data.contact_company,
      _contact_email: data.contact_email,
      _contact_whatsapp: data.contact_whatsapp,
      _contact_doc: data.contact_doc ?? null,
      _chosen_plan: data.chosen_plan,
      _source: data.source ?? "site",
      _terms_ip: null,
    });
    if (error) throw new Error(error.message);
    return { trialId };
  });

// Autenticado — busca trial do usuário atual (por user_id ou por email).
export const getMyTrial = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email?.toLowerCase();
    const { data, error } = await supabase
      .from("trial_subscriptions")
      .select("*")
      .or(`user_id.eq.${userId}${email ? `,contact_email.eq.${email}` : ""}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { trial: data };
  });

// Admin: lista paginada
export const listTrials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string; limit?: number } | undefined) => data ?? {})
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("trial_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.status) q = q.eq("status", data.status as never);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { trials: rows ?? [] };
  });

// Admin: indicadores agregados
export const getTrialStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trial_subscriptions")
      .select("status");
    if (error) throw new Error(error.message);
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r) => {
      counts[r.status as string] = (counts[r.status as string] ?? 0) + 1;
    });
    const total = data?.length ?? 0;
    const converted = counts["convertido"] ?? 0;
    return {
      counts,
      total,
      conversionRate: total ? Math.round((converted / total) * 100) : 0,
    };
  });

// Admin: ações
const TrialIdSchema = z.object({ trialId: z.string().uuid() });

export const convertTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    TrialIdSchema.extend({ paddle_sub: z.string().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("trial_convert", {
      _trial_id: data.trialId,
      _paddle_sub: data.paddle_sub ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const regularizeTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => TrialIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("trial_regularize", { _trial_id: data.trialId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const extendTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    TrialIdSchema.extend({
      days: z.number().int().min(1).max(60),
      reason: z.string().trim().min(3).max(500),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("trial_extend", {
      _trial_id: data.trialId,
      _days: data.days,
      _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    TrialIdSchema.extend({ reason: z.string().trim().max(500).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("trial_cancel", {
      _trial_id: data.trialId,
      _reason: data.reason ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
