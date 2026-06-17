/**
 * Staff Impulsionando — visão dos leads capturados em feiras/demonstrações.
 *
 * - getFeiraOverview: agrega totais (24h, 7d), sessões, conversões e leads por nicho.
 * - listFeiraLeads: lista paginada dos últimos N leads com origem, nicho, status.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureStaff(supabase: any, userId: string) {
  const { data: isStaff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  if (!isStaff) throw new Error("Acesso restrito à equipe Impulsionando.");
}

export const getFeiraOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("demo_feira_overview");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      total_leads: Number(row?.total_leads ?? 0),
      leads_24h: Number(row?.leads_24h ?? 0),
      leads_7d: Number(row?.leads_7d ?? 0),
      total_sessions: Number(row?.total_sessions ?? 0),
      sessions_converted: Number(row?.sessions_converted ?? 0),
      avg_modules_viewed: Number(row?.avg_modules_viewed ?? 0),
      by_niche: (row?.by_niche ?? {}) as Record<string, number>,
    };
  });

export const listFeiraLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("demo_leads")
      .select("id, name, email, phone, niche, origin, status, tags, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { leads: rows ?? [] };
  });
