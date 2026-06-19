import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Pipeline DEV → HOMOLOG (beta) → PROD (stable).
 * - module_versions.channel: canal em que a versão está publicada
 * - companies.release_channel: canal que cada tenant assina (dev/beta/stable)
 */

export const listReleases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: modules }, { data: versions }, { data: cms }, { data: companies }] = await Promise.all([
      supabase.from("modules").select("id, slug, name, current_version, is_active").eq("is_active", true).order("name"),
      supabase.from("module_versions").select("id, module_id, version, channel, released_at, notes").order("released_at", { ascending: false }),
      supabase.from("company_modules").select("module_id, company_id, installed_version, is_enabled"),
      supabase.from("companies").select("id, name, release_channel, environment, is_active").eq("is_active", true).eq("is_master", false),
    ]);

    const versionsByModule = new Map<string, any[]>();
    (versions ?? []).forEach((v: any) => {
      const arr = versionsByModule.get(v.module_id) ?? [];
      arr.push(v);
      versionsByModule.set(v.module_id, arr);
    });

    const installsByModule = new Map<string, { total: number; outdated: number }>();
    (cms ?? []).forEach((r: any) => {
      if (!r.is_enabled) return;
      const m = installsByModule.get(r.module_id) ?? { total: 0, outdated: 0 };
      m.total += 1;
      installsByModule.set(r.module_id, m);
    });

    return {
      modules: (modules ?? []).map((m: any) => ({
        ...m,
        versions: versionsByModule.get(m.id) ?? [],
        installs: installsByModule.get(m.id) ?? { total: 0, outdated: 0 },
      })),
      companies: companies ?? [],
    };
  });

const PromoteSchema = z.object({
  versionId: z.string().uuid(),
  toChannel: z.enum(["dev", "beta", "stable"]),
});

export const promoteVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PromoteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: v, error: ve } = await supabase
      .from("module_versions")
      .select("id, module_id, version, channel")
      .eq("id", data.versionId)
      .maybeSingle();
    if (ve || !v) throw new Error(ve?.message ?? "Versão não encontrada");

    const { error: uErr } = await supabase
      .from("module_versions")
      .update({ channel: data.toChannel })
      .eq("id", v.id);
    if (uErr) throw new Error(uErr.message);

    // Se promovido para stable, marca como current_version do módulo
    if (data.toChannel === "stable") {
      await supabase
        .from("modules")
        .update({ current_version: v.version, last_version_at: new Date().toISOString() })
        .eq("id", v.module_id);
    }

    await supabase.from("audit_logs").insert({
      action: "module.version.promoted",
      entity_type: "module_versions",
      entity_id: v.id,
      metadata: { from: v.channel, to: data.toChannel, version: v.version },
    } as never);

    return { ok: true };
  });

const RollupSchema = z.object({
  moduleId: z.string().uuid(),
  channel: z.enum(["dev", "beta", "stable"]),
  version: z.string().min(1),
});

/**
 * Aplica uma versão a TODOS os tenants assinantes do canal.
 * Ex.: promoção global de v1.2.3 para todos os tenants com release_channel='stable'.
 */
export const rolloutVersionToChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RollupSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: targets, error: tErr } = await supabase
      .from("companies")
      .select("id")
      .eq("release_channel", data.channel)
      .eq("is_active", true)
      .eq("is_master", false);
    if (tErr) throw new Error(tErr.message);

    const ids = (targets ?? []).map((c: any) => c.id);
    if (ids.length === 0) return { ok: true, updated: 0 };

    const { error: upErr, count } = await supabase
      .from("company_modules")
      .update({ installed_version: data.version, installed_at: new Date().toISOString() }, { count: "exact" })
      .eq("module_id", data.moduleId)
      .eq("is_enabled", true)
      .in("company_id", ids);
    if (upErr) throw new Error(upErr.message);

    await supabase.from("audit_logs").insert({
      action: "module.version.rollout",
      entity_type: "modules",
      entity_id: data.moduleId,
      metadata: { channel: data.channel, version: data.version, tenants: ids.length, updated: count ?? 0 },
    } as never);

    return { ok: true, updated: count ?? 0 };
  });
