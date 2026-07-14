/**
 * Onda B — Auditoria "Full Plan" por cliente.
 * Verifica se um tenant tem tudo que um plano Full precisa: dados, plano/cortesia,
 * módulos ativos, credenciais MP, WhatsApp, fiscal, Cérebro IA, N8N e publicação.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

    const { data: company } = await sb
      .from("companies")
      .select("id,name,legal_name,document,email,phone,logo_url,domain,subdomain,is_active,status,status_commercial,status_financial,status_technical,full_courtesy_status,full_courtesy_ends_at,niche_id,primary_color,cover_image_url")
      .eq("subdomain", data.slug)
      .maybeSingle();

    if (!company) throw new Error(`Empresa ${data.slug} não encontrada`);
    const companyId = company.id as string;

    // 1. Dados básicos
    const missing: string[] = [];
    if (!company.legal_name) missing.push("razão social");
    if (!company.document) missing.push("CNPJ");
    if (!company.email) missing.push("email");
    if (!company.phone) missing.push("telefone");
    if (!company.logo_url) missing.push("logo");
    items.push({
      id: "dados-basicos", category: "dados", label: "Dados cadastrais",
      status: missing.length === 0 ? "ok" : missing.length > 2 ? "error" : "warn",
      detail: missing.length ? `Faltando: ${missing.join(", ")}` : "Todos os campos essenciais preenchidos.",
      action: missing.length ? "Editar em Dados." : undefined,
    });

    items.push({
      id: "identidade-visual", category: "dados", label: "Identidade visual",
      status: company.primary_color && company.cover_image_url ? "ok" : "warn",
      detail: `${company.primary_color ? "Cor" : "sem cor"} · ${company.cover_image_url ? "capa OK" : "sem capa"}`,
    });

    items.push({
      id: "ativacao", category: "plano", label: "Ativação",
      status: company.is_active ? "ok" : "error",
      detail: `is_active=${company.is_active} · status=${company.status}`,
    });

    // 2. Plano / cortesia
    const courtesyActive = company.full_courtesy_status === "active";
    items.push({
      id: "plano-full", category: "plano", label: "Plano Full / cortesia",
      status: courtesyActive ? "ok" : "warn",
      detail: courtesyActive ? `Cortesia Full ativa até ${company.full_courtesy_ends_at ?? "?"}` : "Sem cortesia Full ativa — verificar assinatura.",
    });

    // 3. Módulos ativos
    const { data: mods } = await sb.from("company_modules").select("module_slug,is_enabled").eq("company_id", companyId);
    const activeMods = (mods ?? []).filter((m: any) => m.is_enabled).map((m: any) => m.module_slug);
    const requiredMods = ["agenda", "crm", "financeiro", "site", "whatsapp"];
    const missingMods = requiredMods.filter((r) => !activeMods.includes(r));
    items.push({
      id: "modulos", category: "modulos", label: "Módulos essenciais",
      status: missingMods.length === 0 ? "ok" : missingMods.length >= 3 ? "error" : "warn",
      detail: activeMods.length ? `Ativos: ${activeMods.join(", ")}` : "Nenhum módulo ativo.",
      action: missingMods.length ? `Ativar: ${missingMods.join(", ")}` : undefined,
    });

    // 4. Agenda populada
    const [{ count: proCount }, { count: svcCount }] = await Promise.all([
      sb.from("agenda_professionals").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      sb.from("agenda_services").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    ]);
    items.push({
      id: "agenda", category: "modulos", label: "Agenda",
      status: (proCount ?? 0) > 0 && (svcCount ?? 0) > 0 ? "ok" : (proCount ?? 0) === 0 && (svcCount ?? 0) === 0 ? "error" : "warn",
      detail: `${proCount ?? 0} profissionais · ${svcCount ?? 0} serviços cadastrados`,
      action: (proCount ?? 0) === 0 ? "Cadastrar profissionais em Agenda." : undefined,
    });

    // 5. Mercado Pago
    const { data: mp } = await sb.from("mpago_credentials").select("environment,active").eq("company_id", companyId);
    const mpProd = (mp ?? []).find((r: any) => r.environment === "production" && r.active);
    items.push({
      id: "mpago", category: "pagamentos", label: "Mercado Pago (produção)",
      status: mpProd ? "ok" : (mp?.length ? "warn" : "error"),
      detail: mp?.length ? `${mp.length} credenciais (${(mp as any[]).map((r) => r.environment).join(", ")})` : "Sem credenciais.",
      action: !mpProd ? "Configurar na aba Mercado Pago." : undefined,
    });

    // 6. WhatsApp
    const { count: waCount } = await sb.from("core_whatsapp_credentials").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true);
    items.push({
      id: "whatsapp", category: "comunicacao", label: "WhatsApp",
      status: (waCount ?? 0) > 0 ? "ok" : "warn",
      detail: `${waCount ?? 0} conexão(ões) ativa(s)`,
      action: (waCount ?? 0) === 0 ? "Conectar WhatsApp em Configurações → Canais." : undefined,
    });

    // 7. Fiscal
    const { count: fiscalCount } = await sb.from("core_fiscal_issuer_config").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_active", true);
    items.push({
      id: "fiscal", category: "fiscal", label: "Emissor fiscal",
      status: (fiscalCount ?? 0) > 0 ? "ok" : "warn",
      detail: `${fiscalCount ?? 0} emissor(es) ativo(s)`,
    });

    // 8. Cérebro IA
    const { data: brain } = await sb.from("core_ai_brains").select("status,persona,updated_at").eq("company_id", companyId).maybeSingle();
    items.push({
      id: "cerebro-ia", category: "ia", label: "Cérebro IA",
      status: brain?.status === "active" ? "ok" : brain ? "warn" : "error",
      detail: brain ? `status=${brain.status} · persona=${brain.persona ?? "—"}` : "Não configurado.",
    });

    // 9. N8N Workflows
    const { count: wfCount } = await sb.from("n8n_workflows").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("active", true);
    items.push({
      id: "n8n", category: "automacoes", label: "Jornadas N8N",
      status: (wfCount ?? 0) >= 3 ? "ok" : (wfCount ?? 0) > 0 ? "warn" : "error",
      detail: `${wfCount ?? 0} workflow(s) ativos`,
      action: (wfCount ?? 0) < 3 ? "Publicar pelo menos captação, conversão e retenção." : undefined,
    });

    // 10. Publicação / domínio
    const hasCustomDomain = !!(company.domain && !String(company.domain).endsWith(".impulsionando.com.br"));
    items.push({
      id: "dominio", category: "publicacao", label: "Domínio",
      status: hasCustomDomain ? "ok" : company.subdomain ? "warn" : "error",
      detail: company.domain ?? (company.subdomain ? `${company.subdomain}.impulsionando.com.br` : "sem domínio"),
    });

    // Resumo
    const summary = {
      ok: items.filter((i) => i.status === "ok").length,
      warn: items.filter((i) => i.status === "warn").length,
      error: items.filter((i) => i.status === "error").length,
    };
    const score = items.length === 0 ? 0 : Math.round((summary.ok * 100 + summary.warn * 50) / items.length);
    return { company: { id: companyId, name: company.name, slug: data.slug }, items, summary, score };
  });
