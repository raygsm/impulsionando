import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getSegmentTemplate, type SegmentKey } from "@/data/moduleSegmentTemplates";

// ============ Site Templates ============
export const listSiteTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { templates: data ?? [] };
  });

export const upsertSiteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    slug: string;
    niche?: string | null;
    description?: string | null;
    pages?: unknown;
    sections?: unknown;
    default_colors?: unknown;
    status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      slug: data.slug,
      niche: data.niche ?? null,
      description: data.description ?? null,
      pages: (data.pages ?? []) as never,
      sections: (data.sections ?? []) as never,
      default_colors: (data.default_colors ?? {}) as never,
      status: data.status ?? "active",
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("site_templates")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("site_templates")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

export const deleteSiteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_templates")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AI Prompt Library ============
export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_prompt_library")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { prompts: data ?? [] };
  });

export const upsertPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    name: string;
    category?: string | null;
    niche?: string | null;
    purpose?: string | null;
    prompt: string;
    variables?: unknown;
    status?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      category: data.category ?? null,
      niche: data.niche ?? null,
      purpose: data.purpose ?? null,
      prompt: data.prompt,
      variables: (data.variables ?? {}) as never,
      status: data.status ?? "active",
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("ai_prompt_library")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("ai_prompt_library")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row!.id };
  });

export const deletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_prompt_library")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const incrementPromptUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("ai_prompt_library")
      .select("usage_count")
      .eq("id", data.id)
      .single();
    await context.supabase
      .from("ai_prompt_library")
      .update({ usage_count: (row?.usage_count ?? 0) + 1 })
      .eq("id", data.id);
    return { ok: true };
  });

// ============ Generated Pages ============
export const listGeneratedPagesByCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("generated_pages")
      .select("*")
      .eq("company_id", data.companyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { pages: rows ?? [] };
  });

// ============ Fase 2: Criar Projeto da Fábrica ============
const CreateProjectSchema = z.object({
  client: z.object({
    existingCompanyId: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    tradeName: z.string().max(200).optional().or(z.literal("")),
    legalName: z.string().max(200).optional().or(z.literal("")),
    ownerName: z.string().max(200).optional().or(z.literal("")),
    whatsapp: z.string().max(50).optional().or(z.literal("")),
    email: z.string().max(200).optional().or(z.literal("")),
    document: z.string().max(30).optional().or(z.literal("")),
    segment: z.string().max(80).optional().or(z.literal("")),
    notes: z.string().max(2000).optional().or(z.literal("")),
  }),
  project: z.object({
    name: z.string().min(1).max(200),
    niche: z.string().max(80).optional().or(z.literal("")),
    environment: z.enum(["demo", "teste", "real"]),
    domain: z.string().max(200).optional().or(z.literal("")),
    subdomain: z.string().max(80).optional().or(z.literal("")),
    internalOwner: z.string().max(200).optional().or(z.literal("")),
    clientOwner: z.string().max(200).optional().or(z.literal("")),
    status: z.string().max(40).optional().or(z.literal("")),
  }),
  model: z.object({
    kind: z.enum(["template", "clone", "empty", "demo-base", "module-base", "combo"]),
    templateId: z.string().uuid().optional(),
    sourceCompanyId: z.string().uuid().optional(),
  }),
  modules: z
    .array(z.object({ slug: z.string().min(1).max(80), segment: z.string().max(40).default("default") }))
    .default([]),
  toggles: z.record(z.string().max(80), z.boolean()).default({}),
  plan: z
    .object({
      planId: z.string().uuid().optional(),
      setupAmount: z.number().min(0).optional(),
      recurringAmount: z.number().min(0).optional(),
      dueDay: z.number().int().min(1).max(28).optional(),
      setupPaid: z.boolean().optional(),
      pixKey: z.string().max(200).optional().or(z.literal("")),
      generateFirstInvoice: z.boolean().optional(),
    })
    .optional(),
  adminUser: z
    .object({
      email: z.string().email().optional().or(z.literal("")),
      name: z.string().max(200).optional().or(z.literal("")),
      phone: z.string().max(50).optional().or(z.literal("")),
      sendWelcome: z.boolean().optional(),
    })
    .optional(),
  confirm: z.literal(true),
});

export const createProjectFromFactory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateProjectSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const events: Array<{ at: string; key: string; ok: boolean; message?: string }> = [];
    const push = (key: string, ok: boolean, message?: string) =>
      events.push({ at: new Date().toISOString(), key, ok, ...(message ? { message } : {}) });

    push("projeto_iniciado", true);

    // 1) Reuse company by id or document, else create
    let companyId = data.client.existingCompanyId;
    if (!companyId && data.client.document) {
      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .eq("document", data.client.document)
        .maybeSingle();
      if (existing) companyId = existing.id;
    }
    const companyPayload: Record<string, unknown> = {
      name: data.client.name,
      trade_name: data.client.tradeName || null,
      legal_name: data.client.legalName || null,
      owner_name: data.client.ownerName || null,
      whatsapp: data.client.whatsapp || null,
      email: data.client.email || null,
      document: data.client.document || null,
      segment: data.client.segment || data.project.niche || null,
      environment: data.project.environment,
      domain: data.project.domain || null,
      subdomain: data.project.subdomain || null,
      status: data.project.status || "active",
    };
    if (companyId) {
      const { error } = await supabase.from("companies").update(companyPayload as never).eq("id", companyId);
      if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
      push("cliente_reutilizado", true);
    } else {
      const { data: c, error } = await supabase
        .from("companies")
        .insert(companyPayload as never)
        .select("id")
        .single();
      if (error || !c) throw new Error(`Falha ao criar cliente: ${error?.message ?? "sem retorno"}`);
      companyId = c.id;
      push("cliente_criado", true);
    }
    push("projeto_criado", true, data.project.name);
    push("ambiente_definido", true, data.project.environment);
    if (data.project.niche) push("nicho_escolhido", true, data.project.niche);
    push("template_escolhido", true, data.model.kind);

    // 2) Generation row for log/timeline (reuses existing table)
    const { data: gen } = await supabase
      .from("ai_project_generations")
      .insert({
        company_id: companyId,
        created_by: userId,
        prompt: `[FÁBRICA] ${data.project.name}`,
        client_data: data.client as never,
        project_data: data.project as never,
        uploaded_files: [] as never,
        status: "provisioning",
        provisioning_steps: events as never,
        provisioning_started_at: new Date().toISOString(),
        approved_by: userId,
        approved_at: new Date().toISOString(),
      } as never)
      .select("id")
      .single();
    const generationId = (gen as { id: string } | null)?.id ?? null;

    // 3) Install modules + presets (structural only — no real data copy)
    const installed: string[] = [];
    const failed: { slug: string; reason: string }[] = [];
    for (const mod of data.modules) {
      const { data: m } = await supabase
        .from("modules")
        .select("id, slug, current_version, readiness_status")
        .eq("slug", mod.slug)
        .maybeSingle();
      if (!m) {
        failed.push({ slug: mod.slug, reason: "não encontrado" });
        push(`modulo_falhou:${mod.slug}`, false, "não encontrado");
        continue;
      }
      const { error: instErr } = await supabase.from("company_modules").upsert(
        {
          company_id: companyId,
          module_id: m.id,
          is_enabled: true,
          installed_version: m.current_version,
          installed_at: new Date().toISOString(),
          enabled_at: new Date().toISOString(),
        } as never,
        { onConflict: "company_id,module_id" },
      );
      if (instErr) {
        failed.push({ slug: mod.slug, reason: instErr.message });
        push(`modulo_falhou:${mod.slug}`, false, instErr.message);
        continue;
      }
      const template = getSegmentTemplate(m.slug, (mod.segment || "default") as SegmentKey);
      for (const [key, value] of Object.entries(template)) {
        await supabase.from("company_settings").upsert(
          {
            company_id: companyId,
            key,
            value: value as never,
            updated_at: new Date().toISOString(),
          } as never,
          { onConflict: "company_id,key" },
        );
      }
      installed.push(m.slug);
    }
    if (installed.length) push("modulos_instalados", true, installed.join(", "));
    push("preset_aplicado", true);

    // 4) Apply factory toggles into company_settings
    for (const [key, val] of Object.entries(data.toggles)) {
      await supabase.from("company_settings").upsert(
        {
          company_id: companyId,
          key: `factory.${key}`,
          value: val as never,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "company_id,key" },
      );
    }
    push("config_salva", true);

    // 4.1) Plano + Setup + Contrato + 1ª Fatura + Admin user + Welcome
    let contractId: string | null = null;
    let firstInvoiceId: string | null = null;
    let adminUserId: string | null = null;
    let inviteLink: string | null = null;

    const needsAdmin = !!(data.adminUser?.email || data.client.email);
    const needsPlan = !!(data.plan?.planId);

    if (needsAdmin || needsPlan) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (needsAdmin) {
          const adminEmail = (data.adminUser?.email || data.client.email || "").toLowerCase();
          const adminName = data.adminUser?.name || data.client.ownerName || data.client.name;
          const adminPhone = data.adminUser?.phone || data.client.whatsapp || null;

          if (adminEmail) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
            const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === adminEmail);
            if (found) {
              adminUserId = found.id;
              push("admin_reutilizado", true, adminEmail);
            } else {
              const { data: created, error: uErr } = await supabaseAdmin.auth.admin.createUser({
                email: adminEmail,
                email_confirm: true,
                user_metadata: { display_name: adminName, phone: adminPhone },
              });
              if (uErr || !created.user) {
                push("admin_falhou", false, uErr?.message ?? "sem retorno");
              } else {
                adminUserId = created.user.id;
                push("admin_criado", true, adminEmail);
                const { data: link } = await supabaseAdmin.auth.admin.generateLink({
                  type: "magiclink",
                  email: adminEmail,
                });
                inviteLink = link?.properties?.action_link ?? null;
              }
            }

            if (adminUserId) {
              const { data: gestor } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("slug", "gestor-empresa")
                .maybeSingle();
              if (gestor) {
                await supabaseAdmin.from("user_profiles").upsert(
                  {
                    user_id: adminUserId,
                    company_id: companyId!,
                    profile_id: gestor.id,
                    display_name: adminName,
                    email: adminEmail,
                    is_active: true,
                  } as never,
                  { onConflict: "user_id,company_id" },
                );
                push("admin_vinculado", true, "gestor-empresa");
              }
            }
          }
        }

        if (needsPlan && data.plan?.planId) {
          const { data: plan } = await supabaseAdmin
            .from("billing_plans")
            .select("id, recurring_amount, setup_fee, due_day")
            .eq("id", data.plan.planId)
            .maybeSingle();

          if (plan) {
            const dueDay = data.plan.dueDay ?? plan.due_day;
            const recurring = data.plan.recurringAmount ?? Number(plan.recurring_amount);
            const setupAmt = data.plan.setupAmount ?? Number(plan.setup_fee);
            const today = new Date();
            const due = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
            const todayIso = today.toISOString().slice(0, 10);
            const dueIso = due.toISOString().slice(0, 10);

            const { data: existingContract } = await supabaseAdmin
              .from("billing_contracts")
              .select("id")
              .eq("company_id", companyId!)
              .maybeSingle();

            if (existingContract) {
              contractId = existingContract.id;
              push("contrato_reutilizado", true);
            } else {
              const { data: ct, error: ctErr } = await supabaseAdmin
                .from("billing_contracts")
                .insert({
                  company_id: companyId!,
                  plan_id: plan.id,
                  start_date: todayIso,
                  due_day: dueDay,
                  next_due_date: dueIso,
                  recurring_amount: recurring,
                  setup_amount: setupAmt,
                  setup_paid_at: data.plan.setupPaid ? new Date().toISOString() : null,
                  pix_key: data.plan.pixKey || null,
                  status: "active",
                } as never)
                .select("id")
                .single();
              if (ctErr || !ct) {
                push("contrato_falhou", false, ctErr?.message ?? "sem retorno");
              } else {
                contractId = (ct as { id: string }).id;
                push("contrato_criado", true, `R$ ${recurring.toFixed(2)}/mês`);
              }
            }

            if (contractId && (data.plan.generateFirstInvoice ?? true)) {
              const amount = recurring + (setupAmt && !data.plan.setupPaid ? setupAmt : 0);
              const { data: inv, error: invErr } = await supabaseAdmin
                .from("billing_invoices")
                .upsert(
                  {
                    contract_id: contractId,
                    company_id: companyId!,
                    period_start: todayIso,
                    period_end: dueIso,
                    due_date: dueIso,
                    amount,
                    status: "open",
                    pix_key: data.plan.pixKey || null,
                  } as never,
                  { onConflict: "contract_id,due_date" },
                )
                .select("id")
                .single();
              if (invErr || !inv) {
                push("fatura_falhou", false, invErr?.message ?? "sem retorno");
              } else {
                firstInvoiceId = (inv as { id: string }).id;
                push("fatura_gerada", true, `R$ ${amount.toFixed(2)} venc. ${dueIso}`);
              }
            }
          } else {
            push("plano_nao_encontrado", false, data.plan.planId);
          }
        }

        if (data.adminUser?.sendWelcome !== false) {
          const welcomeEmail = (data.adminUser?.email || data.client.email || "").toLowerCase();
          const welcomeName = data.adminUser?.name || data.client.ownerName || data.client.name;
          const welcomePhone = data.adminUser?.phone || data.client.whatsapp || null;
          if (welcomeEmail) {
            try {
              await supabaseAdmin.rpc("enqueue_message", {
                _event_code: "user_welcome",
                _company_id: companyId!,
                _recipient_user_id: adminUserId ?? undefined,
                _recipient_email: welcomeEmail,
                _recipient_phone: welcomePhone ?? "",
                _recipient_name: welcomeName ?? "Cliente",
                _payload: {
                  user_name: welcomeName ?? "Cliente",
                  user_email: welcomeEmail,
                  app_url: "https://impulsionando.com.br/onboarding",
                  invite_link: inviteLink ?? "https://impulsionando.com.br/auth",
                  company_name: data.client.tradeName || data.client.name,
                  project_name: data.project.name,
                  modules: installed.join(", "),
                } as never,
                _channels: ["email", "whatsapp", "in_app"] as never,
                _reference_type: "factory_project",
                _reference_id: companyId!,
              } as never);
              push("boas_vindas_enviado", true, welcomeEmail);
            } catch (e) {
              push("boas_vindas_falhou", false, (e as Error).message);
            }
          }
        }
      } catch (e) {
        push("provisionamento_extra_falhou", false, (e as Error).message);
      }
    }

    // 5) Audit
    await supabase.from("audit_logs").insert({
      action: "factory.project.created",
      entity: "companies",
      entity_id: companyId,
      after: {
        project: data.project,
        modules: installed,
        failed,
        model: data.model,
        contractId,
        firstInvoiceId,
        adminUserId,
      } as never,
    } as never);

    push("projeto_concluido", failed.length === 0, failed.length ? `Falhas: ${failed.map((f) => f.slug).join(", ")}` : undefined);
    if (generationId) {
      await supabase
        .from("ai_project_generations")
        .update({
          status: failed.length ? "completed_with_errors" : "completed",
          provisioned_at: new Date().toISOString(),
          provisioning_steps: events as never,
          error_message: failed.length ? `Falhas: ${failed.map((f) => f.slug).join(", ")}` : null,
        } as never)
        .eq("id", generationId);
    }

    return {
      companyId: companyId!,
      generationId,
      installed,
      failed,
      events,
      contractId,
      firstInvoiceId,
      adminUserId,
      inviteLink,
    };
  });

// ============ Fase 3: Helpers para Instalação/Configuração Pós-Install ============
export const listCompaniesForFactory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("companies")
      .select("id, name, trade_name, document, environment, segment, status, is_master, is_active")
      .eq("is_master", false)
      .order("name");
    return { companies: data ?? [] };
  });

export const listInstallableModules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("modules")
      .select("id, slug, name, description, category, readiness_status, current_version, dependencies, sort_order")
      .eq("is_active", true)
      .order("sort_order");
    return { modules: data ?? [] };
  });

export const getCompanyModuleSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; prefix: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("company_settings")
      .select("key, value")
      .eq("company_id", data.companyId)
      .like("key", `${data.prefix}%`);
    return { settings: rows ?? [] };
  });

export const saveModuleAssistantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; values: Record<string, unknown>; markConfigured?: boolean; moduleSlug?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    for (const [key, value] of Object.entries(data.values)) {
      await supabase.from("company_settings").upsert(
        { company_id: data.companyId, key, value: value as never, updated_at: new Date().toISOString() } as never,
        { onConflict: "company_id,key" },
      );
    }
    await supabase.from("audit_logs").insert({
      action: "factory.module.configured",
      entity: "company_settings",
      entity_id: data.companyId,
      after: { module: data.moduleSlug, keys: Object.keys(data.values) } as never,
    } as never);
    return { ok: true };
  });

// ============ Fase 4: Criador de Páginas / Templates por Projeto ============
export const applyTemplateToProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; templateId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: tpl, error: tplErr } = await supabase
      .from("site_templates")
      .select("id, name, slug, niche, pages, sections, default_colors")
      .eq("id", data.templateId)
      .single();
    if (tplErr || !tpl) throw new Error(`Template não encontrado: ${tplErr?.message ?? ""}`);

    const pages = Array.isArray(tpl.pages) ? (tpl.pages as Array<Record<string, unknown> | string>) : [];
    const created: string[] = [];
    for (const p of pages) {
      const isStr = typeof p === "string";
      const name = isStr ? (p as string) : String((p as Record<string, unknown>).name ?? (p as Record<string, unknown>).slug ?? "Página");
      const slug = isStr
        ? (p as string).toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : String((p as Record<string, unknown>).slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      const { data: row } = await supabase
        .from("generated_pages")
        .insert({
          company_id: data.companyId,
          template_id: tpl.id,
          name,
          slug,
          content: {
            sections: tpl.sections ?? [],
            colors: tpl.default_colors ?? {},
          } as never,
          status: "draft",
          created_by: userId,
        } as never)
        .select("id")
        .single();
      if (row) created.push((row as { id: string }).id);
    }

    await supabase.from("audit_logs").insert({
      action: "factory.pages.template_applied",
      entity: "generated_pages",
      entity_id: data.companyId,
      after: { template: tpl.slug, pages: created.length } as never,
    } as never);

    return { created };
  });

export const upsertGeneratedPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    companyId: string;
    name: string;
    slug: string;
    content?: unknown;
    promptUsed?: string | null;
    status?: string;
    templateId?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: data.companyId,
      name: data.name,
      slug: data.slug,
      content: (data.content ?? {}) as never,
      prompt_used: data.promptUsed ?? null,
      status: data.status ?? "draft",
      template_id: data.templateId ?? null,
      created_by: context.userId,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("generated_pages")
        .update(payload as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("generated_pages")
      .insert(payload as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

export const deleteGeneratedPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("generated_pages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getGeneratedPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("generated_pages")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { page: row };
  });

export const getProjectVariables = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: c } = await context.supabase
      .from("companies")
      .select("name, trade_name, segment, whatsapp, email, domain, primary_color, address_city")
      .eq("id", data.companyId)
      .maybeSingle();
    const { data: mods } = await context.supabase
      .from("company_modules")
      .select("modules(name, slug)")
      .eq("company_id", data.companyId)
      .eq("is_enabled", true);
    const moduleNames = (mods ?? [])
      .map((r) => (r as { modules: { name: string } | null }).modules?.name)
      .filter(Boolean)
      .join(", ");
    return {
      variables: {
        nome_cliente: c?.trade_name || c?.name || "",
        nome_projeto: c?.name || "",
        nicho: c?.segment || "",
        cidade: c?.address_city || "",
        whatsapp: c?.whatsapp || "",
        email: c?.email || "",
        modulos: moduleNames,
        cta_principal: "Fale conosco",
        dominio: c?.domain || "",
        cor_principal: c?.primary_color || "#0ea5e9",
        servicos: "",
        beneficios: "",
        diferenciais: "",
      } as Record<string, string>,
    };
  });
