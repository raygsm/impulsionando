import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { BrainKnowledgeItem } from "./types";

type AuthFinancialContext = {
  authenticated: boolean;
  userId?: string;
  companyId?: string | null;
  isStaff: boolean;
  knowledge: BrainKnowledgeItem[];
};

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v || null;
}

function money(value: unknown): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(n) ? n : 0);
}

export async function loadAuthenticatedFinancialContext(request: Request): Promise<AuthFinancialContext> {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.startsWith("Bearer ")) return { authenticated: false, isStaff: false, knowledge: [] };

  const token = header.slice(7).trim();
  if (!token) return { authenticated: false, isStaff: false, knowledge: [] };

  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return { authenticated: false, isStaff: false, knowledge: [] };

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return { authenticated: false, isStaff: false, knowledge: [] };

  const { data: staff } = await supabase.rpc("is_impulsionando_staff", { _user: userId });
  const isStaff = staff === true;

  if (isStaff) {
    const { data: rows } = await supabaseAdmin
      .from("core_company_access_policy")
      .select("company_id,company_name,lifecycle_status,service_state,access_mode,subdomain")
      .order("company_name")
      .limit(200);

    const clients = rows ?? [];
    const counts = clients.reduce<Record<string, number>>((acc, row: any) => {
      const key = String(row.service_state ?? row.lifecycle_status ?? "unknown");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const summary = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join("; ") || "sem clientes ativos";
    const compact = clients.map((row: any) =>
      `${row.company_name} | ${row.lifecycle_status} | ${row.service_state ?? "sem_estado"} | ${row.access_mode ?? "sem_modo"} | ${row.subdomain ?? "sem_subdominio"}`,
    ).join("\n");

    return {
      authenticated: true,
      userId,
      isStaff: true,
      knowledge: [
        {
          title: "Governança financeira do ecossistema",
          body: `Visão autenticada da equipe Impulsionando. Total de clientes no Core: ${clients.length}. Estados: ${summary}. Toda empresa comercial ativa deve estar no Core, com vencimento recorrente no dia 5, pró-rata na primeira contratação/mudança quando aplicável, suspensão por inadimplência e reativação somente após pagamento confirmado.`,
          tags: ["financeiro", "core", "governanca", "staff"],
        },
        {
          title: "Estado financeiro dos clientes",
          body: compact || "Nenhum cliente comercial ativo encontrado.",
          tags: ["financeiro", "clientes", "estado", "staff"],
        },
      ],
    };
  }

  const { data: companyId } = await supabase.rpc("current_user_company_id");
  if (!companyId) return { authenticated: true, userId, companyId: null, isStaff: false, knowledge: [] };

  const { data: policy } = await supabaseAdmin
    .from("core_company_access_policy")
    .select("company_name,lifecycle_status,service_state,access_mode,subdomain,root_domain,finance_only,watermark_required")
    .eq("company_id", companyId)
    .maybeSingle();

  const { data: contract } = await supabaseAdmin
    .from("billing_contracts")
    .select("id,status,next_due_date,recurring_amount,plan_id")
    .eq("company_id", companyId)
    .not("status", "in", "(cancelled,archived)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let invoice: any = null;
  if (contract?.id) {
    const { data } = await supabaseAdmin
      .from("billing_invoices")
      .select("id,due_date,amount,status")
      .eq("contract_id", contract.id)
      .in("status", ["open", "overdue"])
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    invoice = data;
  }

  const body = policy
    ? [
        `Empresa: ${policy.company_name}.`,
        `Ciclo no Core: ${policy.lifecycle_status}.`,
        `Estado do serviço: ${policy.service_state}.`,
        `Modo de acesso: ${policy.access_mode}.`,
        `Subdomínio: ${policy.subdomain ? `${policy.subdomain}.${policy.root_domain}` : "ainda não definido"}.`,
        contract ? `Contrato: ${contract.status}; recorrência ${money(contract.recurring_amount)}; próximo vencimento ${contract.next_due_date ?? "não informado"}.` : "Contrato recorrente ainda não ativado.",
        invoice ? `Cobrança em aberto: ${money(invoice.amount)}, vencimento ${invoice.due_date}, status ${invoice.status}.` : "Nenhuma cobrança aberta/atrasada identificada.",
        policy.finance_only ? "Acesso operacional bloqueado: somente financeiro/regularização deve permanecer utilizável; dashboard pode ser apenas visual com marca-d'água." : "Acesso operacional completo autorizado pelo estado financeiro atual.",
      ].join(" ")
    : "Empresa autenticada sem política financeira consolidada encontrada; não invente status e oriente conferência no Financeiro.";

  return {
    authenticated: true,
    userId,
    companyId,
    isStaff: false,
    knowledge: [{ title: "Situação financeira autenticada da empresa", body, tags: ["financeiro", "core", "autenticado"] }],
  };
}
