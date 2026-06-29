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
      supabase.from("core_niche_modules").select("niche_slug").throwOnError(),
      supabase.from("core_templates").select("niche_slug").throwOnError(),
      supabase.from("companies").select("niche_code").throwOnError(),
    ]);

    const macroById = new Map((macros.data ?? []).map((m) => [m.id, m]));
    const tenantsByNiche = new Map<string, number>();
    for (const c of (companies.data as Array<{ niche_code: string | null }>) ?? []) {
      if (!c.niche_code) continue;
      tenantsByNiche.set(c.niche_code, (tenantsByNiche.get(c.niche_code) ?? 0) + 1);
    }
    const modulosByNiche = new Map<string, number>();
    for (const r of (modulosRel.data as Array<{ niche_slug: string | null }>) ?? []) {
      if (!r.niche_slug) continue;
      modulosByNiche.set(r.niche_slug, (modulosByNiche.get(r.niche_slug) ?? 0) + 1);
    }
    const templatesByNiche = new Map<string, number>();
    for (const r of (templatesRel.data as Array<{ niche_slug: string | null }>) ?? []) {
      if (!r.niche_slug) continue;
      templatesByNiche.set(r.niche_slug, (templatesByNiche.get(r.niche_slug) ?? 0) + 1);
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
