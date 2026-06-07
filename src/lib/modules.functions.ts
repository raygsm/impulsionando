import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getSegmentTemplate, type SegmentKey } from "@/data/moduleSegmentTemplates";

/**
 * Core Modules — Biblioteca Central de Módulos.
 * Não cria módulos novos: usa a tabela `modules` já existente.
 * Instalar/desinstalar = ativar/desativar flag em `company_modules` (single source of truth).
 * Versão é centralizada: `modules.current_version` é a versão oficial; clientes apontam para ela.
 */

export const listModulesLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: modules }, { data: enabled }, { data: versions }] = await Promise.all([
      supabase.from("modules").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("company_modules").select("module_id, company_id, is_enabled, installed_version"),
      supabase.from("module_versions").select("module_id, version, released_at").order("released_at", { ascending: false }),
    ]);
    const installsByModule = new Map<string, { total: number; outdated: number }>();
    (enabled ?? []).forEach((r: any) => {
      if (!r.is_enabled) return;
      const m = installsByModule.get(r.module_id) ?? { total: 0, outdated: 0 };
      m.total += 1;
      installsByModule.set(r.module_id, m);
    });
    const mods = (modules ?? []).map((m: any) => {
      const info = installsByModule.get(m.id) ?? { total: 0, outdated: 0 };
      const outdated = (enabled ?? []).filter(
        (r: any) => r.is_enabled && r.module_id === m.id && r.installed_version && r.installed_version !== m.current_version,
      ).length;
      return { ...m, installs: info.total, outdated };
    });
    return { modules: mods, versions: versions ?? [] };
  });

export const getModuleDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: m } = await supabase.from("modules").select("*").eq("slug", data.slug).maybeSingle();
    if (!m) return { module: null, versions: [], installs: [] };
    const [{ data: versions }, { data: installs }] = await Promise.all([
      supabase.from("module_versions").select("*").eq("module_id", m.id).order("released_at", { ascending: false }),
      supabase
        .from("company_modules")
        .select("installed_version, is_enabled, installed_at, companies!inner(id, name)")
        .eq("module_id", m.id)
        .eq("is_enabled", true),
    ]);
    return { module: m, versions: versions ?? [], installs: installs ?? [] };
  });

const ReleaseSchema = z.object({
  slug: z.string().min(1).max(100),
  version: z.string().min(1).max(50).regex(/^[a-zA-Z0-9.\-_]+$/),
  notes: z.string().max(2000).optional(),
});

export const releaseModuleVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReleaseSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: m } = await supabase.from("modules").select("id, current_version").eq("slug", data.slug).maybeSingle();
    if (!m) throw new Error("Módulo não encontrado");
    const { error: vErr } = await supabase
      .from("module_versions")
      .insert({ module_id: m.id, version: data.version, notes: data.notes ?? null, released_by: userId });
    if (vErr) throw new Error(vErr.message);
    const { error: uErr } = await supabase
      .from("modules")
      .update({ current_version: data.version, last_version_at: new Date().toISOString() })
      .eq("id", m.id);
    if (uErr) throw new Error(uErr.message);
    await supabase.from("audit_logs").insert({
      action: "module.version.released",
      entity_type: "modules",
      entity_id: m.id,
      metadata: { slug: data.slug, version: data.version, previous: m.current_version },
    } as never);
    return { ok: true };
  });

const InstallSchema = z.object({
  companyId: z.string().uuid(),
  slug: z.string().min(1).max(100),
});

export const installModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InstallSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: m } = await supabase
      .from("modules")
      .select("id, slug, current_version, dependencies")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!m) throw new Error("Módulo não encontrado");

    // Valida dependências
    const deps = (m.dependencies ?? []) as string[];
    if (deps.length > 0) {
      const { data: depMods } = await supabase.from("modules").select("id, slug").in("slug", deps);
      const depIds = (depMods ?? []).map((d: any) => d.id);
      const { data: enabledDeps } = await supabase
        .from("company_modules")
        .select("module_id, is_enabled")
        .eq("company_id", data.companyId)
        .in("module_id", depIds);
      const enabledSet = new Set((enabledDeps ?? []).filter((r: any) => r.is_enabled).map((r: any) => r.module_id));
      const missing = (depMods ?? []).filter((d: any) => !enabledSet.has(d.id)).map((d: any) => d.slug);
      if (missing.length > 0) {
        throw new Error(`Dependências não instaladas: ${missing.join(", ")}`);
      }
    }

    const { error } = await supabase
      .from("company_modules")
      .upsert(
        {
          company_id: data.companyId,
          module_id: m.id,
          is_enabled: true,
          installed_version: m.current_version,
          installed_at: new Date().toISOString(),
          enabled_at: new Date().toISOString(),
        },
        { onConflict: "company_id,module_id" },
      );
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      action: "module.installed",
      entity_type: "company_modules",
      entity_id: m.id,
      metadata: { company_id: data.companyId, slug: m.slug, version: m.current_version },
    } as never);

    await supabase.from("onboarding_checklist").upsert(
      {
        company_id: data.companyId,
        item_key: "modules_activated",
        status: "done",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "company_id,item_key" },
    );

    return { ok: true, version: m.current_version };
  });

export const uninstallModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InstallSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: m } = await supabase.from("modules").select("id, slug").eq("slug", data.slug).maybeSingle();
    if (!m) throw new Error("Módulo não encontrado");
    const { error } = await supabase
      .from("company_modules")
      .update({ is_enabled: false })
      .eq("company_id", data.companyId)
      .eq("module_id", m.id);
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      action: "module.uninstalled",
      entity_type: "company_modules",
      entity_id: m.id,
      metadata: { company_id: data.companyId, slug: m.slug },
    } as never);
    return { ok: true };
  });

export const updateClientModuleToLatest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InstallSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: m } = await supabase.from("modules").select("id, current_version, slug").eq("slug", data.slug).maybeSingle();
    if (!m) throw new Error("Módulo não encontrado");
    const { error } = await supabase
      .from("company_modules")
      .update({ installed_version: m.current_version })
      .eq("company_id", data.companyId)
      .eq("module_id", m.id);
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      action: "module.updated",
      entity_type: "company_modules",
      entity_id: m.id,
      metadata: { company_id: data.companyId, slug: m.slug, to_version: m.current_version },
    } as never);
    return { ok: true, version: m.current_version };
  });

export const getClientModules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: modules }, { data: installed }] = await Promise.all([
      supabase.from("modules").select("*").eq("is_active", true).order("sort_order"),
      supabase
        .from("company_modules")
        .select("module_id, is_enabled, installed_version, installed_at")
        .eq("company_id", data.companyId),
    ]);
    const byId = new Map((installed ?? []).map((i: any) => [i.module_id, i]));
    const result = (modules ?? []).map((m: any) => {
      const inst = byId.get(m.id);
      return {
        ...m,
        is_installed: !!inst && (inst as any).is_enabled,
        installed_version: (inst as any)?.installed_version ?? null,
        installed_at: (inst as any)?.installed_at ?? null,
        has_update: !!inst && (inst as any).is_enabled && (inst as any).installed_version && (inst as any).installed_version !== m.current_version,
      };
    });
    return { modules: result };
  });

export const coreModulesDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: modules }, { data: enabled }, { data: companies }] = await Promise.all([
      supabase.from("modules").select("id, slug, name, current_version").eq("is_active", true),
      supabase.from("company_modules").select("module_id, is_enabled, installed_version").eq("is_enabled", true),
      supabase.from("companies").select("id").eq("is_master", false).eq("is_active", true),
    ]);
    const counts = new Map<string, number>();
    const outdated = new Map<string, number>();
    (enabled ?? []).forEach((r: any) => {
      counts.set(r.module_id, (counts.get(r.module_id) ?? 0) + 1);
      const m = (modules ?? []).find((mm: any) => mm.id === r.module_id);
      if (m && r.installed_version && r.installed_version !== m.current_version) {
        outdated.set(r.module_id, (outdated.get(r.module_id) ?? 0) + 1);
      }
    });
    const ranking = (modules ?? [])
      .map((m: any) => ({ slug: m.slug, name: m.name, version: m.current_version, installs: counts.get(m.id) ?? 0, outdated: outdated.get(m.id) ?? 0 }))
      .sort((a, b) => b.installs - a.installs);
    return {
      totalActiveClients: companies?.length ?? 0,
      totalInstalls: (enabled ?? []).length,
      totalPendingUpdates: Array.from(outdated.values()).reduce((a, b) => a + b, 0),
      ranking,
    };
  });

/* ============================================================
 * CERTIFICAÇÃO DE MÓDULOS — Matriz de Prontidão
 * ============================================================ */

const ReadinessChecklistSchema = z.object({
  interface: z.boolean().optional(),
  permissions: z.boolean().optional(),
  dashboard: z.boolean().optional(),
  reports: z.boolean().optional(),
  logs: z.boolean().optional(),
  communication: z.boolean().optional(),
  integrations: z.boolean().optional(),
  parameters: z.boolean().optional(),
  install: z.boolean().optional(),
  uninstall: z.boolean().optional(),
  update: z.boolean().optional(),
  demo: z.boolean().optional(),
  flows: z.boolean().optional(),
});

export const READINESS_CHECKLIST_KEYS = [
  "interface",
  "permissions",
  "dashboard",
  "reports",
  "logs",
  "communication",
  "integrations",
  "parameters",
  "install",
  "uninstall",
  "update",
  "demo",
  "flows",
] as const;

export const READINESS_CHECKLIST_LABELS: Record<string, string> = {
  interface: "Interface pronta",
  permissions: "Permissões funcionando",
  dashboard: "Dashboard funcionando",
  reports: "Relatórios funcionando",
  logs: "Logs funcionando",
  communication: "Comunicação funcionando",
  integrations: "Integrações funcionando",
  parameters: "Parametrizações funcionando",
  install: "Instalação funcionando",
  uninstall: "Remoção funcionando",
  update: "Atualização funcionando",
  demo: "Demonstração funcionando",
  flows: "Fluxos completos funcionando",
};

export const READINESS_STATUS_LABELS: Record<string, string> = {
  em_desenvolvimento: "Em desenvolvimento",
  em_revisao: "Em revisão",
  em_testes: "Em testes",
  certificado: "Certificado",
  publicado: "Publicado",
};

const CertificationSchema = z.object({
  slug: z.string().min(1).max(100),
  readiness_status: z.enum(["em_desenvolvimento", "em_revisao", "em_testes", "certificado", "publicado"]).optional(),
  readiness_checklist: ReadinessChecklistSchema.optional(),
  demo_url: z.string().max(500).optional().nullable(),
  docs_url: z.string().max(500).optional().nullable(),
  segments: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export const updateModuleCertification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CertificationSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: m } = await supabase.from("modules").select("id").eq("slug", data.slug).maybeSingle();
    if (!m) throw new Error("Módulo não encontrado");

    const patch: Record<string, unknown> = {};
    if (data.readiness_status !== undefined) patch.readiness_status = data.readiness_status;
    if (data.readiness_checklist !== undefined) patch.readiness_checklist = data.readiness_checklist;
    if (data.demo_url !== undefined) patch.demo_url = data.demo_url;
    if (data.docs_url !== undefined) patch.docs_url = data.docs_url;
    if (data.segments !== undefined) patch.segments = data.segments;

    if (data.readiness_status === "certificado" || data.readiness_status === "publicado") {
      patch.certified_at = new Date().toISOString();
      patch.certified_by = userId;
    }

    const { error } = await supabase.from("modules").update(patch as never).eq("id", m.id);
    if (error) throw new Error(error.message);

    await supabase.from("audit_logs").insert({
      action: "module.certification.updated",
      entity: "modules",
      entity_id: m.id,
      after: { slug: data.slug, ...patch },
    } as never);

    return { ok: true };
  });

const InstallWithTemplateSchema = z.object({
  companyId: z.string().uuid(),
  slug: z.string().min(1).max(100),
  segment: z
    .enum([
      "default",
      "clinica",
      "psicologia",
      "gastroenterologia",
      "academia",
      "crossfit",
      "restaurante",
      "bar",
      "microcervejaria",
      "escritorio",
      "eventos",
      "educacao",
      "viagens",
    ])
    .default("default"),
  installDependencies: z.boolean().default(true),
});

/**
 * Instalação em 1 clique: instala o módulo + dependências + aplica template do segmento
 * em company_settings. Só permite instalar módulos certificados ou publicados.
 */
export const installModuleWithTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InstallWithTemplateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: m } = await supabase
      .from("modules")
      .select("id, slug, current_version, dependencies, readiness_status")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!m) throw new Error("Módulo não encontrado");

    const status = (m as { readiness_status?: string }).readiness_status;
    if (status !== "certificado" && status !== "publicado") {
      throw new Error(
        `Módulo "${m.slug}" ainda não foi certificado para instalação (status: ${status ?? "em_desenvolvimento"}).`,
      );
    }

    const installedSlugs: string[] = [];

    // Dependências (instaladas automaticamente se installDependencies=true)
    const deps = ((m.dependencies ?? []) as string[]) || [];
    if (deps.length > 0) {
      const { data: depMods } = await supabase
        .from("modules")
        .select("id, slug, current_version, readiness_status")
        .in("slug", deps);
      const { data: enabledDeps } = await supabase
        .from("company_modules")
        .select("module_id, is_enabled")
        .eq("company_id", data.companyId)
        .in("module_id", (depMods ?? []).map((d: { id: string }) => d.id));
      const enabledSet = new Set(
        (enabledDeps ?? []).filter((r: { is_enabled: boolean }) => r.is_enabled).map((r: { module_id: string }) => r.module_id),
      );
      for (const d of depMods ?? []) {
        if (enabledSet.has(d.id)) continue;
        if (!data.installDependencies) {
          throw new Error(`Dependência não instalada: ${d.slug}`);
        }
        const dStatus = (d as { readiness_status?: string }).readiness_status;
        if (dStatus !== "certificado" && dStatus !== "publicado") {
          throw new Error(`Dependência "${d.slug}" não está certificada.`);
        }
        await supabase.from("company_modules").upsert(
          {
            company_id: data.companyId,
            module_id: d.id,
            is_enabled: true,
            installed_version: d.current_version,
            installed_at: new Date().toISOString(),
            enabled_at: new Date().toISOString(),
          },
          { onConflict: "company_id,module_id" },
        );
        installedSlugs.push(d.slug);
      }
    }

    // Módulo principal
    const { error } = await supabase.from("company_modules").upsert(
      {
        company_id: data.companyId,
        module_id: m.id,
        is_enabled: true,
        installed_version: m.current_version,
        installed_at: new Date().toISOString(),
        enabled_at: new Date().toISOString(),
      },
      { onConflict: "company_id,module_id" },
    );
    if (error) throw new Error(error.message);
    installedSlugs.push(m.slug);

    // Aplica template do segmento em company_settings
    const template = getSegmentTemplate(m.slug, data.segment as SegmentKey);
    const settingsApplied: string[] = [];
    for (const [key, value] of Object.entries(template)) {
      const { error: sErr } = await supabase.from("company_settings").upsert(
        {
          company_id: data.companyId,
          key,
          value: value as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "company_id,key" },
      );
      if (!sErr) settingsApplied.push(key);
    }

    await supabase.from("audit_logs").insert({
      action: "module.installed_with_template",
      entity: "company_modules",
      entity_id: m.id,
      after: {
        company_id: data.companyId,
        slug: m.slug,
        segment: data.segment,
        installed: installedSlugs,
        settings_applied: settingsApplied,
      },
    } as never);

    await supabase.from("onboarding_checklist").upsert(
      {
        company_id: data.companyId,
        item_key: "modules_activated",
        status: "done",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "company_id,item_key" },
    );

    return {
      ok: true,
      installed: installedSlugs,
      settingsApplied,
      segment: data.segment,
    };
  });

