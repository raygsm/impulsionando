import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Gerador de Projetos por Prompt com IA.
 * Reusa provisioning existente (cloneCompany / installModule). Não cria módulos novos.
 */

const AnalyzeInput = z.object({
  prompt: z.string().min(20).max(8000),
  clientData: z.record(z.any()).default({}),
  projectData: z.record(z.any()).default({}),
  filesMeta: z
    .array(z.object({ kind: z.string(), name: z.string(), mime: z.string().optional() }))
    .default([]),
});

const AnalysisSchema = z.object({
  segmento: z.string().describe("Segmento de mercado identificado"),
  tipo_negocio: z.string(),
  publico_alvo: z.string(),
  modulos_sugeridos: z.array(z.string()).describe("Slugs do catálogo de módulos certificados"),
  paginas_sugeridas: z.array(z.string()),
  comunicacoes_sugeridas: z.array(z.string()).describe("event_codes do catálogo de comunicação"),
  identidade_sugerida: z.object({
    cor_primaria: z.string().optional(),
    cor_secundaria: z.string().optional(),
    tom_voz: z.string().optional(),
  }).optional(),
  resumo_executivo: z.string(),
});

export const analyzeProjectPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando pode usar o gerador de IA.");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada");

    const { data: mods } = await supabase
      .from("modules")
      .select("slug, name, category")
      .eq("is_active", true);
    const moduleSlugs = (mods ?? []).map((m: any) => m.slug);
    const moduleCatalog = (mods ?? [])
      .map((m: any) => `- ${m.slug} (${m.category}): ${m.name}`)
      .join("\n");

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const filesDesc = data.filesMeta.length
      ? data.filesMeta.map((f) => `- ${f.kind}: ${f.name} (${f.mime ?? "?"})`).join("\n")
      : "Nenhum arquivo enviado.";

    const systemPrompt = `Você é o arquiteto de implantações da plataforma Impulsionando Tecnologia.
Seu trabalho é analisar o pedido do cliente e propor a estrutura ideal usando APENAS módulos certificados existentes no catálogo.

CATÁLOGO DE MÓDULOS DISPONÍVEIS (use APENAS estes slugs em "modulos_sugeridos"):
${moduleCatalog}

REGRAS:
1. NÃO invente slugs de módulos. Use somente os listados acima.
2. Em "comunicacoes_sugeridas" use event_codes padronizados (ex: user_welcome, appointment_new_customer, billing_invoice_due, billing_invoice_paid, password_recovery).
3. Identifique o segmento (ex: psicologia, clinica, restaurante, academia, eventos, escritorio, educacao).
4. Sugira páginas em linguagem natural: ["Home", "Quem Somos", "Serviços", "Agenda", "Contato", "FAQ", "Política de Privacidade", "Área do Cliente"].
5. Quando arquivos PDF/PPT forem enviados, considere extrair tom de voz, segmento e elementos institucionais para a identidade sugerida.
6. Seja conciso. O resumo_executivo deve ter no máximo 3 frases.`;

    const userPrompt = `DADOS DO CLIENTE:
${JSON.stringify(data.clientData, null, 2)}

DADOS DO PROJETO:
${JSON.stringify(data.projectData, null, 2)}

ARQUIVOS ENVIADOS:
${filesDesc}

PROMPT DO PROJETO:
${data.prompt}`;

    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        experimental_output: Output.object({ schema: AnalysisSchema }),
      });
      const analysis = (result as any).experimental_output ?? result.text;
      const filtered = {
        ...analysis,
        modulos_sugeridos: (analysis.modulos_sugeridos ?? []).filter((s: string) =>
          moduleSlugs.includes(s),
        ),
      };
      return filtered;
    } catch (e: any) {
      throw new Error(`Falha na análise IA: ${e.message ?? String(e)}`);
    }
  });

const SaveDraftInput = z.object({
  id: z.string().uuid().optional(),
  prompt: z.string().min(1).max(8000),
  clientData: z.record(z.any()),
  projectData: z.record(z.any()),
  uploadedFiles: z
    .array(
      z.object({
        kind: z.enum(["logo", "institucional", "apoio"]),
        bucketPath: z.string(),
        originalName: z.string().optional(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().optional(),
      }),
    )
    .default([]),
  aiAnalysis: z.any().optional(),
  status: z.enum(["rascunho", "analisado"]).default("analisado"),
});

export const saveDraftGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveDraftInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    let genId = data.id;
    if (genId) {
      const { error } = await supabase
        .from("ai_project_generations")
        .update({
          prompt: data.prompt,
          client_data: data.clientData,
          project_data: data.projectData,
          uploaded_files: data.uploadedFiles,
          ai_analysis: data.aiAnalysis ?? null,
          ai_model: data.aiAnalysis ? "google/gemini-3-flash-preview" : null,
          status: data.status,
        } as never)
        .eq("id", genId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await supabase
        .from("ai_project_generations")
        .insert({
          prompt: data.prompt,
          client_data: data.clientData,
          project_data: data.projectData,
          uploaded_files: data.uploadedFiles,
          ai_analysis: data.aiAnalysis ?? null,
          ai_model: data.aiAnalysis ? "google/gemini-3-flash-preview" : null,
          status: data.status,
          created_by: userId,
        } as never)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      genId = (row as any).id;

      if (data.uploadedFiles.length > 0) {
        await supabase.from("ai_project_files").insert(
          data.uploadedFiles.map((f) => ({
            generation_id: genId!,
            kind: f.kind,
            bucket_path: f.bucketPath,
            original_name: f.originalName ?? null,
            mime_type: f.mimeType ?? null,
            size_bytes: f.sizeBytes ?? null,
          })) as never,
        );
      }
    }
    return { id: genId };
  });

// ============================================================================
// Validate analysis plan
// ============================================================================
const ValidateInput = z.object({ generationId: z.string().uuid() });

export const validateAnalysisPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ValidateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data: gen } = await supabase
      .from("ai_project_generations")
      .select("client_data, project_data, ai_analysis")
      .eq("id", data.generationId)
      .maybeSingle();
    if (!gen) throw new Error("Geração não encontrada.");

    const analysis = (gen as any).ai_analysis ?? {};
    const client = (gen as any).client_data ?? {};
    const project = (gen as any).project_data ?? {};

    const slugs: string[] = (analysis.modulos_sugeridos ?? []).filter(Boolean);
    const { data: mods } = await supabase
      .from("modules")
      .select("slug, name, category, readiness_status, current_version")
      .in("slug", slugs.length ? slugs : ["__none__"]);
    const modIndex = new Map((mods ?? []).map((m: any) => [m.slug, m]));
    const modulesPlan = slugs.map((slug) => {
      const m = modIndex.get(slug) as any;
      return {
        slug,
        exists: !!m,
        name: m?.name ?? slug,
        category: m?.category ?? null,
        certified: m?.readiness_status === "certificado",
        version: m?.current_version ?? null,
      };
    });

    const events: string[] = (analysis.comunicacoes_sugeridas ?? []).filter(Boolean);
    const { data: tpls } = await supabase
      .from("message_templates")
      .select("event_code, channel")
      .is("company_id", null)
      .in("event_code", events.length ? events : ["__none__"]);
    const tplByEvent = new Map<string, Set<string>>();
    (tpls ?? []).forEach((t: any) => {
      const set = tplByEvent.get(t.event_code) ?? new Set<string>();
      set.add(t.channel);
      tplByEvent.set(t.event_code, set);
    });
    const commsPlan = events.map((code) => ({
      event_code: code,
      channels: Array.from(tplByEvent.get(code) ?? []),
      template_available: (tplByEvent.get(code)?.size ?? 0) > 0,
    }));

    const pages = (analysis.paginas_sugeridas ?? []).map((p: string) => ({
      name: p,
      reused: true,
    }));

    let duplicate: any = null;
    const doc = (client.document ?? "").replace(/\D/g, "");
    if (doc.length >= 11) {
      const { data: existing } = await supabase
        .from("companies")
        .select("id, name, email, whatsapp, subdomain, segment, owner_name, document, status")
        .eq("document", client.document)
        .maybeSingle();
      if (existing) {
        const e: any = existing;
        const fillable: Record<string, any> = {};
        if (!e.email && client.email) fillable.email = client.email;
        if (!e.whatsapp && client.whatsapp) fillable.whatsapp = client.whatsapp;
        if (!e.segment && (project.segment || analysis.segmento))
          fillable.segment = project.segment ?? analysis.segmento;
        if (!e.subdomain && project.subdomain) fillable.subdomain = project.subdomain;
        if (!e.owner_name && client.responsibleName) fillable.owner_name = client.responsibleName;
        duplicate = { existing: e, fillable };
      }
    }

    return {
      modules: modulesPlan,
      communications: commsPlan,
      pages,
      duplicate,
      summary: {
        modules_total: modulesPlan.length,
        modules_ready: modulesPlan.filter((m) => m.exists && m.certified).length,
        comms_total: commsPlan.length,
        comms_ready: commsPlan.filter((c) => c.template_available).length,
      },
    };
  });

// ============================================================================
// Approve and provision (with incremental progress)
// ============================================================================
const ApproveInput = z.object({
  generationId: z.string().uuid(),
  mergeIntoExistingCompanyId: z.string().uuid().optional(),
});

type Step = { key: string; label: string; ok: boolean | null; message?: string };

export const approveAndProvision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");

    const { data: gen, error: e0 } = await supabase
      .from("ai_project_generations")
      .select("*")
      .eq("id", data.generationId)
      .maybeSingle();
    if (e0 || !gen) throw new Error("Geração não encontrada.");
    if ((gen as any).status === "provisionado") {
      return { ok: true, company_id: (gen as any).company_id, already: true };
    }

    const client = (gen as any).client_data ?? {};
    const project = (gen as any).project_data ?? {};
    const analysis = (gen as any).ai_analysis ?? {};

    const steps: Step[] = [
      { key: "client", label: "Verificar/criar cliente", ok: null },
      { key: "domain", label: "Registrar subdomínio", ok: null },
      { key: "modules", label: "Instalar módulos", ok: null },
      { key: "areas", label: "Habilitar áreas (Admin/Cliente)", ok: null },
      { key: "comms", label: "Ativar comunicação", ok: null },
      { key: "checklist", label: "Inicializar onboarding checklist", ok: null },
      { key: "audit", label: "Registrar auditoria", ok: null },
    ];

    const pushStep = async (key: string, ok: boolean, message?: string) => {
      const idx = steps.findIndex((s) => s.key === key);
      if (idx >= 0) steps[idx] = { ...steps[idx], ok, message };
      await supabase
        .from("ai_project_generations")
        .update({ provisioning_steps: steps as never } as never)
        .eq("id", data.generationId);
    };

    await supabase
      .from("ai_project_generations")
      .update({
        status: "provisionando",
        provisioning_started_at: new Date().toISOString(),
        provisioning_steps: steps as never,
      } as never)
      .eq("id", data.generationId);

    try {
      let companyId: string | null = data.mergeIntoExistingCompanyId ?? null;
      let companyName: string | null = null;
      let reused = !!data.mergeIntoExistingCompanyId;

      if (!companyId && client.document) {
        const { data: existing } = await supabase
          .from("companies")
          .select("id, name")
          .eq("document", client.document)
          .maybeSingle();
        if (existing) {
          companyId = (existing as any).id;
          companyName = (existing as any).name;
          reused = true;
        }
      }

      if (companyId) {
        const { data: row } = await supabase
          .from("companies")
          .select("email, whatsapp, owner_name, segment, subdomain, instagram, website, primary_color, secondary_color, name")
          .eq("id", companyId)
          .maybeSingle();
        const cur: any = row ?? {};
        const patch: any = {};
        if (!cur.email && client.email) patch.email = client.email;
        if (!cur.whatsapp && client.whatsapp) patch.whatsapp = client.whatsapp;
        if (!cur.owner_name && client.responsibleName) patch.owner_name = client.responsibleName;
        if (!cur.segment && (project.segment || analysis.segmento))
          patch.segment = project.segment ?? analysis.segmento;
        if (!cur.subdomain && project.subdomain) patch.subdomain = project.subdomain;
        if (!cur.instagram && client.instagram) patch.instagram = client.instagram;
        if (!cur.website && client.website) patch.website = client.website;
        if (!cur.primary_color && analysis?.identidade_sugerida?.cor_primaria)
          patch.primary_color = analysis.identidade_sugerida.cor_primaria;
        if (!cur.secondary_color && analysis?.identidade_sugerida?.cor_secundaria)
          patch.secondary_color = analysis.identidade_sugerida.cor_secundaria;
        if (Object.keys(patch).length > 0) {
          await supabase.from("companies").update(patch as never).eq("id", companyId);
        }
        companyName = companyName ?? cur.name ?? null;
        await pushStep(
          "client",
          true,
          `Cliente existente reutilizado por CPF/CNPJ. ${Object.keys(patch).length} campo(s) complementado(s).`,
        );
      } else {
        const insertCompany: any = {
          name: client.companyName ?? project.projectName ?? "Novo cliente",
          legal_name: client.legalName ?? null,
          trade_name: client.companyName ?? null,
          document: client.document ?? null,
          owner_name: client.responsibleName ?? null,
          email: client.email ?? null,
          financial_email: client.financialEmail ?? client.email ?? null,
          phone: client.whatsapp ?? null,
          whatsapp: client.whatsapp ?? null,
          instagram: client.instagram ?? null,
          website: client.website ?? null,
          segment: project.segment ?? analysis.segmento ?? null,
          subdomain: project.subdomain ?? null,
          domain: project.customDomain ?? null,
          address_city: project.city ?? null,
          address_state: project.state ?? null,
          primary_color: analysis?.identidade_sugerida?.cor_primaria ?? null,
          secondary_color: analysis?.identidade_sugerida?.cor_secundaria ?? null,
          is_master: false,
          is_active: true,
          is_demo: false,
          status: "active",
        };
        const { data: created, error: e1 } = await supabase
          .from("companies")
          .insert(insertCompany)
          .select("id, name")
          .single();
        if (e1) throw new Error(`Falha ao criar empresa: ${e1.message}`);
        companyId = (created as any).id;
        companyName = (created as any).name;
        await pushStep("client", true, "Novo cliente criado.");
      }

      if (project.subdomain) {
        await supabase.from("onboarding_domain_requests").insert({
          company_id: companyId,
          requested_subdomain: project.subdomain,
          requested_domain: project.customDomain ?? null,
          status: "pending",
        } as never);
        await pushStep("domain", true, `Subdomínio "${project.subdomain}" registrado.`);
      } else {
        await pushStep("domain", true, "Sem subdomínio solicitado.");
      }

      const slugs: string[] = (analysis.modulos_sugeridos ?? []).filter(Boolean);
      let installed = 0;
      let skipped = 0;
      for (const slug of slugs) {
        const { data: m } = await supabase
          .from("modules")
          .select("id, current_version")
          .eq("slug", slug)
          .maybeSingle();
        if (!m) {
          skipped++;
          continue;
        }
        const { error } = await supabase.from("company_modules").upsert(
          {
            company_id: companyId,
            module_id: (m as any).id,
            is_enabled: true,
            installed_version: (m as any).current_version,
            installed_at: new Date().toISOString(),
            enabled_at: new Date().toISOString(),
          },
          { onConflict: "company_id,module_id" },
        );
        if (!error) installed++;
      }
      await pushStep(
        "modules",
        installed > 0,
        `${installed} módulo(s) instalado(s)${skipped ? `, ${skipped} ignorado(s)` : ""}.`,
      );

      const hasAdm = slugs.includes("administracao");
      const hasArea = slugs.includes("area_cliente");
      await pushStep(
        "areas",
        hasAdm || hasArea,
        `Admin: ${hasAdm ? "sim" : "não"} • Área Cliente: ${hasArea ? "sim" : "não"}`,
      );

      await pushStep("comms", true, "WhatsApp + E-mail ativados via catálogo global.");

      await supabase.from("onboarding_checklist").upsert(
        [
          { company_id: companyId, item_key: "client_created", status: "done", completed_at: new Date().toISOString() },
          { company_id: companyId, item_key: "modules_activated", status: installed > 0 ? "done" : "pending" },
          { company_id: companyId, item_key: "communication_active", status: "done", completed_at: new Date().toISOString() },
        ] as never,
        { onConflict: "company_id,item_key" },
      );
      await pushStep("checklist", true);

      await supabase.from("audit_logs").insert({
        company_id: companyId,
        user_id: userId,
        action: reused ? "ai_provision_merge" : "ai_provision",
        entity: "ai_project_generation",
        entity_id: data.generationId,
        after: { analysis, client, project, reused } as never,
      } as never);
      await pushStep("audit", true);

      await supabase
        .from("ai_project_generations")
        .update({
          status: "provisionado",
          company_id: companyId,
          approved_by: userId,
          approved_at: new Date().toISOString(),
          provisioned_at: new Date().toISOString(),
        } as never)
        .eq("id", data.generationId);

      return { ok: true, company_id: companyId, name: companyName, reused, checklist: steps };
    } catch (err: any) {
      await supabase
        .from("ai_project_generations")
        .update({
          status: "falhou",
          error_message: err.message ?? String(err),
          provisioning_steps: steps as never,
        } as never)
        .eq("id", data.generationId);
      throw new Error(`Provisionamento falhou: ${err.message ?? String(err)}`);
    }
  });

// ============================================================================
// Polling endpoint: get provisioning status
// ============================================================================
const StatusInput = z.object({ generationId: z.string().uuid() });

export const getProvisioningStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data: row } = await supabase
      .from("ai_project_generations")
      .select("status, provisioning_steps, error_message, company_id, provisioned_at")
      .eq("id", data.generationId)
      .maybeSingle();
    return {
      status: (row as any)?.status ?? "desconhecido",
      steps: ((row as any)?.provisioning_steps ?? []) as Step[],
      error: (row as any)?.error_message ?? null,
      company_id: (row as any)?.company_id ?? null,
      provisioned_at: (row as any)?.provisioned_at ?? null,
    };
  });

export const listGenerationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
    if (!staff) throw new Error("Apenas equipe Impulsionando.");
    const { data, error } = await supabase
      .from("ai_project_generations")
      .select("id, status, client_data, project_data, ai_analysis, company_id, created_at, provisioned_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { generations: data ?? [] };
  });
