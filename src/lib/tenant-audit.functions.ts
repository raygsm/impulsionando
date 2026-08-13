/**
 * Auditoria operacional por cliente usando somente contratos atuais do Core.
 * O slug canônico é resolvido via communication_tenants; estruturas legadas
 * (companies.subdomain, n8n_workflows, core_whatsapp_credentials etc.) não são usadas.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveClientCompanyBySlug, canonicalClientHost } from "@/lib/client-registry";
import { z } from "zod";

export type AuditStatus = "ok" | "warn" | "error" | "muted";
export type AuditItem = {
  id: string;
  category: "dados" | "plano" | "modulos" | "pagamentos" | "comunicacao" | "fiscal" | "ia" | "automacoes" | "publicacao";
  label: string;
  status: AuditStatus;
  detail: string;
  action?: string;
};

const Input = z.object({ slug: z.string().min(1) });

export const auditTenantFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const items: AuditItem[] = [];
    const resolved = await resolveClientCompanyBySlug(sb, data.slug);

    if (!resolved) throw new Error(`Cliente ${data.slug} não encontrado no registry`);
    if (!resolved.company) {
      return {
        company: { id: null, name: resolved.registry.display_name, slug: data.slug },
        items: [{
          id: "company-link",
          category: "dados" as const,
          label: "Vínculo com cadastro central",
          status: "error" as const,
          detail: "Cliente ativo no registry, mas communication_tenants.company_id ainda está vazio.",
          action: "Criar/vincular o cadastro central da empresa.",
        }],
        summary: { ok: 0, warn: 0, error: 1 },
        score: 0,
      };
    }

    const company = resolved.company;
    const companyId = company.id;
    const tenantId = resolved.registry.id;

    const missing: string[] = [];
    if (!company.legal_name) missing.push("razão social");
    if (!company.document) missing.push("CNPJ/CPF");
    if (!company.email) missing.push("email");
    if (!company.phone) missing.push("telefone");
    if (!company.logo_url) missing.push("logo");
    items.push({
      id: "dados-basicos", category: "dados", label: "Dados cadastrais",
      status: missing.length === 0 ? "ok" : missing.length > 2 ? "error" : "warn",
      detail: missing.length ? `Faltando: ${missing.join(", ")}` : "Todos os campos essenciais preenchidos.",
      action: missing.length ? "Completar os dados da empresa." : undefined,
    });

    items.push({
      id: "ativacao", category: "plano", label: "Ativação central",
      status: company.is_active && resolved.registry.active ? "ok" : "error",
      detail: `empresa=${company.is_active ? "ativa" : "inativa"} · registry=${resolved.registry.active ? "ativo" : "inativo"} · status=${company.status}`,
    });

    const courtesyStatus = (company as any).full_courtesy_status as string | undefined;
    const courtesyEnds = (company as any).full_courtesy_ends_at as string | undefined;
    const { data: contracts, error: contractError } = await sb
      .from("billing_contracts")
      .select("id,status,plan_id,created_at")
      .eq("company_id", companyId)
      .limit(10);
    const courtesyActive = courtesyStatus === "active";
    const hasContract = !contractError && (contracts?.length ?? 0) > 0;
    items.push({
      id: "plano", category: "plano", label: "Plano / cortesia",
      status: courtesyActive || hasContract ? "ok" : "warn",
      detail: courtesyActive
        ? `Cortesia ativa${courtesyEnds ? ` até ${courtesyEnds}` : ""}`
        : hasContract
          ? `${contracts.length} contrato(s) encontrado(s)`
          : "Sem contrato ou cortesia operacional registrada.",
    });

    const { data: companyModules, error: companyModulesError } = await sb
      .from("company_modules")
      .select("module_id,is_enabled,installed_version")
      .eq("company_id", companyId);
    const enabledRows = (companyModules ?? []).filter((m: any) => m.is_enabled);
    const moduleIds = enabledRows.map((m: any) => m.module_id).filter(Boolean);
    let activeModules: string[] = [];
    if (!companyModulesError && moduleIds.length) {
      const { data: moduleRows } = await sb.from("modules").select("id,slug,name").in("id", moduleIds);
      activeModules = (moduleRows ?? []).map((m: any) => m.slug);
    }
    items.push({
      id: "modulos", category: "modulos", label: "Módulos habilitados",
      status: companyModulesError ? "error" : activeModules.length ? "ok" : "warn",
      detail: companyModulesError ? companyModulesError.message : activeModules.length ? activeModules.join(", ") : "Nenhum módulo habilitado para a empresa.",
      action: !activeModules.length ? "Configurar company_modules para o cliente." : undefined,
    });

    const { count: professionalCount } = await sb
      .from("agenda_professionals")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);
    const { count: offeringCount } = await sb
      .from("chrismed_service_offerings")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);
    if (data.slug === "chrismed") {
      items.push({
        id: "agenda", category: "modulos", label: "Agenda CHRISMED",
        status: (professionalCount ?? 0) > 0 && (offeringCount ?? 0) > 0 ? "ok" : "warn",
        detail: `${professionalCount ?? 0} profissional(is) · ${offeringCount ?? 0} oferta(s) de serviço`,
      });
    }

    const { data: mpRows, error: mpError } = await sb
      .from("mpago_credentials")
      .select("environment,active")
      .eq("company_id", companyId);
    const mpProd = (mpRows ?? []).some((r: any) => r.environment === "production" && r.active);
    items.push({
      id: "mpago", category: "pagamentos", label: "Mercado Pago",
      status: mpError ? "error" : mpProd ? "ok" : (mpRows?.length ?? 0) ? "warn" : "error",
      detail: mpError ? mpError.message : mpProd ? "Credencial de produção ativa." : "Sem credencial de produção ativa.",
      action: !mpProd ? "Configurar credenciais reais antes de liberar checkout." : undefined,
    });

    const { data: channelRows, error: channelError } = await sb
      .from("communication_channel_endpoints")
      .select("channel,provider,status,is_primary,last_error")
      .eq("tenant_id", tenantId);
    const activeChannels = (channelRows ?? []).filter((c: any) => c.status === "ACTIVE");
    const pendingChannels = (channelRows ?? []).filter((c: any) => c.status === "PENDING_CONNECTION");
    items.push({
      id: "canais", category: "comunicacao", label: "Canais de comunicação",
      status: channelError ? "error" : activeChannels.length ? "ok" : pendingChannels.length ? "warn" : "error",
      detail: channelError
        ? channelError.message
        : `${activeChannels.length} ativo(s) · ${pendingChannels.length} aguardando conexão`,
      action: !activeChannels.length ? "Conectar ao menos um canal real." : undefined,
    });

    const { data: brain, error: brainError } = await sb
      .from("core_ai_brains")
      .select("status,agent_name,tone,updated_at")
      .eq("company_id", companyId)
      .maybeSingle();
    items.push({
      id: "cerebro-ia", category: "ia", label: "Cérebro IA",
      status: brainError ? "error" : brain?.status === "active" ? "ok" : brain ? "warn" : "warn",
      detail: brainError
        ? "Estrutura do Cérebro IA ainda não está aplicada no banco atual."
        : brain
          ? `status=${brain.status} · agente=${brain.agent_name ?? "não nomeado"}`
          : "Cérebro IA ainda não configurado para este cliente.",
      action: brainError ? "Aplicar a migration de reconciliação do Cérebro IA." : undefined,
    });

    const { data: workflowRows, error: workflowError } = await sb
      .from("tenant_workflow_state")
      .select("status,registry_id,last_execution_at,last_error")
      .eq("tenant_id", tenantId);
    const activeWorkflows = (workflowRows ?? []).filter((w: any) => w.status === "ACTIVE").length;
    const readyWorkflows = (workflowRows ?? []).filter((w: any) => w.status === "READY").length;
    items.push({
      id: "n8n", category: "automacoes", label: "Jornadas n8n",
      status: workflowError ? "error" : activeWorkflows ? "ok" : readyWorkflows ? "warn" : "error",
      detail: workflowError ? workflowError.message : `${activeWorkflows} ativa(s) · ${readyWorkflows} pronta(s) aguardando vínculo`,
      action: readyWorkflows ? "Vincular apenas os workflows READY; preservar os ACTIVE." : undefined,
    });

    items.push({
      id: "fiscal", category: "fiscal", label: "Fiscal",
      status: "muted",
      detail: "Nenhum contrato fiscal canônico foi identificado no schema atual durante esta reconciliação; não é tratado como pronto por inferência.",
    });

    const host = canonicalClientHost(data.slug);
    items.push({
      id: "publicacao", category: "publicacao", label: "Publicação / domínio canônico",
      status: resolved.registry.active ? "ok" : "warn",
      detail: host,
    });

    const summary = {
      ok: items.filter((i) => i.status === "ok").length,
      warn: items.filter((i) => i.status === "warn").length,
      error: items.filter((i) => i.status === "error").length,
    };
    const scored = items.filter((i) => i.status !== "muted");
    const score = scored.length === 0 ? 0 : Math.round((summary.ok * 100 + summary.warn * 50) / scored.length);
    return { company: { id: companyId, name: company.name, slug: data.slug }, items, summary, score };
  });
