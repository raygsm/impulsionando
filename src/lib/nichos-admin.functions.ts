import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SubnichoRow = {
  macro_slug: string;
  macro_nome: string;
  sub_slug: string;
  sub_nome: string;
  tenants: number;
  modulos: number;
  templates: number;
};

export type NichosOverview = {
  macros: Array<{
    slug: string;
    nome: string;
    ordem: number;
    sub_count: number;
    tenants_total: number;
  }>;
  subnichos: SubnichoRow[];
};

export const getNichosOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NichosOverview> => {
    const { supabase } = context;

    const [macros, subs, modulosRel, templatesRel, companies] = await Promise.all([
      supabase.from("core_macro_nichos").select("id,slug,nome,ordem").order("ordem"),
      supabase.from("core_subnichos").select("id,slug,nome,macro_id,ordem").order("ordem"),
      supabase.from("core_niche_modules").select("niche_id"),
      supabase.from("core_templates").select("subnicho_id"),
      supabase.from("companies").select("subnicho_slug"),
    ]);

    const macroById = new Map((macros.data ?? []).map((m) => [m.id, m]));
    const subById = new Map((subs.data ?? []).map((s) => [s.id, s]));

    const tenantsByNiche = new Map<string, number>();
    for (const c of (companies.data ?? []) as Array<{ subnicho_slug: string | null }>) {
      if (!c.subnicho_slug) continue;
      tenantsByNiche.set(c.subnicho_slug, (tenantsByNiche.get(c.subnicho_slug) ?? 0) + 1);
    }
    const modulosByNiche = new Map<string, number>();
    for (const r of (modulosRel.data ?? []) as Array<{ niche_id: string | null }>) {
      const sub = r.niche_id ? subById.get(r.niche_id) : null;
      if (!sub) continue;
      modulosByNiche.set(sub.slug, (modulosByNiche.get(sub.slug) ?? 0) + 1);
    }
    const templatesByNiche = new Map<string, number>();
    for (const r of (templatesRel.data ?? []) as Array<{ subnicho_id: string | null }>) {
      const sub = r.subnicho_id ? subById.get(r.subnicho_id) : null;
      if (!sub) continue;
      templatesByNiche.set(sub.slug, (templatesByNiche.get(sub.slug) ?? 0) + 1);
    }

    const subnichos: SubnichoRow[] = (subs.data ?? []).map((s) => {
      const macro = macroById.get(s.macro_id) ?? { slug: "", nome: "" };
      return {
        macro_slug: macro.slug,
        macro_nome: macro.nome,
        sub_slug: s.slug,
        sub_nome: s.nome,
        tenants: tenantsByNiche.get(s.slug) ?? 0,
        modulos: modulosByNiche.get(s.slug) ?? 0,
        templates: templatesByNiche.get(s.slug) ?? 0,
      };
    });


    const macrosAgg = (macros.data ?? []).map((m) => {
      const subsOfMacro = subnichos.filter((s) => s.macro_slug === m.slug);
      return {
        slug: m.slug,
        nome: m.nome,
        ordem: m.ordem ?? 0,
        sub_count: subsOfMacro.length,
        tenants_total: subsOfMacro.reduce((acc, s) => acc + s.tenants, 0),
      };
    });

    return { macros: macrosAgg, subnichos };
  });
