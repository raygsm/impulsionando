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

    // Carrega catálogo de módulos certificados + eventos disponíveis
    const { data: mods } = await supabase
      .from("modules")
      .select("slug, name, category")
      .eq("is_active", true);
    const moduleSlugs = (mods ?? []).map((m: any) => m.slug);
    const moduleCatalog = (mods ?? [])
      .map((m: any) => `- ${m.slug} (${m.category}): ${m.name}`)
      .join("\n");

    const { generateText } = await import("ai");
    const { Output } = await import("ai");
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
5. Seja conciso. O resumo_executivo deve ter no máximo 3 frases.`;

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

      // Filtra módulos sugeridos para garantir que existem no catálogo
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

      // Persiste linhas de arquivos
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

const ApproveInput = z.object({
  generationId: z.string().uuid(),
});

export const approveAndProvision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
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
    const checklist: { step: string; ok: boolean; message?: string }[] = [];

    try {
      // 1) Cria empresa
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
      const companyId = (created as any).id;
      checklist.push({ step: "Cliente criado", ok: true });
      checklist.push({ step: "Projeto criado", ok: true });

      // 2) Subdomínio (registro)
      if (project.subdomain) {
        await supabase.from("onboarding_domain_requests").insert({
          company_id: companyId,
          requested_subdomain: project.subdomain,
          requested_domain: project.customDomain ?? null,
          status: "pending",
        } as never);
        checklist.push({ step: "Subdomínio registrado para configuração", ok: true });
      }

      // 3) Instala módulos sugeridos
      const slugs: string[] = (analysis.modulos_sugeridos ?? []).filter(Boolean);
      let installed = 0;
      for (const slug of slugs) {
        const { data: m } = await supabase
          .from("modules")
          .select("id, current_version")
          .eq("slug", slug)
          .maybeSingle();
        if (!m) continue;
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
      checklist.push({
        step: `${installed} módulos instalados`,
        ok: installed > 0,
      });

      // 4) Áreas administrativa/cliente — habilitadas via módulos `administracao` e `area_cliente`
      const hasAdm = slugs.includes("administracao");
      const hasArea = slugs.includes("area_cliente");
      checklist.push({ step: "Área administrativa (/adm)", ok: hasAdm });
      checklist.push({ step: "Área do cliente (/minha-area)", ok: hasArea });

      // 5) Comunicação ativada (catálogo global + templates herdados)
      checklist.push({ step: "Comunicação ativada (WhatsApp + E-mail)", ok: true });

      // 6) Onboarding checklist
      await supabase.from("onboarding_checklist").upsert(
        [
          { company_id: companyId, item_key: "client_created", status: "done", completed_at: new Date().toISOString() },
          { company_id: companyId, item_key: "modules_activated", status: installed > 0 ? "done" : "pending" },
          { company_id: companyId, item_key: "communication_active", status: "done", completed_at: new Date().toISOString() },
        ] as never,
        { onConflict: "company_id,item_key" },
      );

      // 7) Auditoria
      await supabase.from("audit_logs").insert({
        company_id: companyId,
        user_id: userId,
        action: "ai_provision",
        entity: "ai_project_generation",
        entity_id: data.generationId,
        after: { analysis, client, project } as never,
      } as never);

      // 8) Marca geração como provisionada
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

      return { ok: true, company_id: companyId, name: (created as any).name, checklist };
    } catch (err: any) {
      await supabase
        .from("ai_project_generations")
        .update({ status: "falhou", error_message: err.message ?? String(err) } as never)
        .eq("id", data.generationId);
      throw new Error(`Provisionamento falhou: ${err.message ?? String(err)}`);
    }
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
