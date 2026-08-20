import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Banknote, BriefcaseBusiness, Clock3, Landmark, PiggyBank, TrendingUp, UsersRound, ReceiptText } from "lucide-react";

type FinancialAccount = { code: string; name: string; institution: string; purpose: string; allocation_pct: number | null; configured: boolean };
type FinancialAlert = { severity: string; code: string; message: string; clients_remaining?: number; mrr_remaining?: number };
type RecurringCost = { supplier: string; service: string; plan: string; monthly_brl: number; confidence: string; payment_status?: string };
type DashboardPayload = {
  phase: string;
  paying_clients: number;
  mrr: number;
  avg_ticket: number;
  next_hire_clients: number;
  next_hire_mrr: number;
  expected_operational_staff: number;
  current_operational_staff: number;
  employee_cost_each: number;
  tax_pct: number;
  technology_pct: number;
  marketing_commercial_pct: number;
  structural_reserve_pct: number;
  structural_reserve_active: boolean;
  base_partner_prolabore_total: number;
  raygs_reimbursement_monthly: number;
  raygs_reimbursement_original: number;
  raygs_reimbursed: number;
  raygs_reimbursement_remaining: number;
  raygs_reimbursement_months_remaining: number;
  profit_distribution_pct: number;
  profit_retention_pct: number;
  recurring_costs_monthly_brl: number;
  recurring_costs: RecurringCost[];
  accounts: FinancialAccount[];
  alerts: FinancialAlert[];
};

const brl = (value: number | null | undefined) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
const phaseLabel = (phase?: string) => phase === "0_90" ? "Fase 0-90 dias" : phase === "91_180" ? "Fase 91-180 dias" : "Fase 181+ dias";

async function fetchFinancialGovernance(): Promise<DashboardPayload> {
  const { data, error } = await (supabase as any).rpc("impulsionando_financial_dashboard");
  if (error) throw error;
  return data as DashboardPayload;
}

export function ImpulsionandoFinancialGovernance() {
  const { data, isLoading, error } = useQuery({ queryKey: ["impulsionando-financial-governance"], queryFn: fetchFinancialGovernance, refetchInterval: 30000 });
  if (isLoading) return <Card className="p-5 text-sm text-muted-foreground">Carregando governança financeira...</Card>;
  if (error || !data) return <Card className="border-destructive/30 p-5 text-sm text-destructive">Não foi possível carregar a governança financeira.</Card>;

  const hireClientsRemaining = Math.max((data.next_hire_clients ?? 8) - (data.paying_clients ?? 0), 0);
  const hireMrrRemaining = Math.max((data.next_hire_mrr ?? 0) - (data.mrr ?? 0), 0);
  const reimbursementPct = data.raygs_reimbursement_original > 0 ? Math.min(100, Math.round((data.raygs_reimbursed / data.raygs_reimbursement_original) * 100)) : 100;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ERP da própria Impulsionando</p>
          <h2 className="mt-1 text-xl font-semibold">Governança financeira e capacidade operacional</h2>
          <p className="mt-1 text-sm text-muted-foreground">Receita, custos, fundos, pró-labores, aporte e contratações calculados pelas regras internas.</p>
        </div>
        <Badge variant="secondary">{phaseLabel(data.phase)}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><UsersRound className="h-4 w-4 text-primary" />Clientes pagantes</div><div className="mt-3 text-3xl font-semibold">{data.paying_clients}</div><p className="mt-1 text-xs text-muted-foreground">Somente contratos com evidência de pagamento.</p></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-primary" />MRR atual</div><div className="mt-3 text-3xl font-semibold">{brl(data.mrr)}</div><p className="mt-1 text-xs text-muted-foreground">Ticket médio: {brl(data.avg_ticket)}</p></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-primary" />Próxima contratação</div><div className="mt-3 text-3xl font-semibold">{data.next_hire_clients} clientes</div><p className="mt-1 text-xs text-muted-foreground">Faltam {hireClientsRemaining} clientes e {brl(hireMrrRemaining)} de MRR mínimo.</p></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><BriefcaseBusiness className="h-4 w-4 text-primary" />Equipe operacional</div><div className="mt-3 text-3xl font-semibold">{data.current_operational_staff}/{data.expected_operational_staff}</div><p className="mt-1 text-xs text-muted-foreground">Custo-alvo por profissional: {brl(data.employee_cost_each)}</p></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><PiggyBank className="h-4 w-4 text-primary" />Regras de caixa</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Impostos</div><div className="mt-1 text-lg font-semibold">{data.tax_pct}% do bruto</div></div>
            <div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Tecnologia/licenças</div><div className="mt-1 text-lg font-semibold">{data.technology_pct}% do bruto</div></div>
            <div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Marketing + Comercial</div><div className="mt-1 text-lg font-semibold">{data.marketing_commercial_pct}% do bruto</div></div>
            <div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Reserva estrutural</div><div className="mt-1 text-lg font-semibold">{data.structural_reserve_pct}% {data.structural_reserve_active ? "ativa" : "a partir do dia 91"}</div></div>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm"><div className="font-medium">Lucro trimestral</div><p className="mt-1 text-muted-foreground">{data.profit_distribution_pct}% distribuível / {data.profit_retention_pct}% retido como reserva, sujeito à decisão dos sócios.</p></div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Banknote className="h-4 w-4 text-primary" />Sócios e aporte</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3"><span>Pró-labore mínimo dos dois sócios</span><strong>{brl(data.base_partner_prolabore_total)}/mês</strong></div>
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3"><span>Reembolso mensal do aporte Raygs</span><strong>{brl(data.raygs_reimbursement_monthly)}</strong></div>
            <div className="rounded-xl border p-3"><div className="flex items-center justify-between gap-3"><span>Saldo do aporte a reembolsar</span><strong>{brl(data.raygs_reimbursement_remaining)}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${reimbursementPct}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{reimbursementPct}% reembolsado · cerca de {data.raygs_reimbursement_months_remaining} meses no ritmo-alvo atual.</p></div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><ReceiptText className="h-4 w-4 text-primary" />Custos recorrentes mapeados</div><strong>{brl(data.recurring_costs_monthly_brl)}/mês</strong></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.recurring_costs ?? []).map((cost) => <div key={`${cost.supplier}-${cost.service}`} className="rounded-xl border p-3"><div className="font-medium">{cost.supplier} · {cost.service}</div><div className="mt-1 text-sm font-semibold">{brl(cost.monthly_brl)}</div><div className="mt-1 text-xs text-muted-foreground">{cost.plan} · {cost.confidence === "actual_recurring" ? "recorrência real" : cost.confidence === "actual_usage_observed" ? "uso real observado" : "piso do menor plano pago"}</div></div>)}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold"><Landmark className="h-4 w-4 text-primary" />Contas gerenciais do ERP</div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">{(data.accounts ?? []).map((account) => <div key={account.code} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-2"><div><div className="font-medium">{account.name}</div><div className="mt-0.5 text-xs text-muted-foreground">{account.institution}</div></div><Badge variant={account.configured ? "default" : "outline"}>{account.configured ? "Configurada" : "Dados pendentes"}</Badge></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{account.purpose}</p>{account.allocation_pct != null ? <div className="mt-3 text-sm font-semibold">Regra: {account.allocation_pct}% do bruto</div> : null}</div>)}</div>
      </Card>

      {(data.alerts ?? []).length > 0 ? <Card className="border-warning/40 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-warning" />Alertas de gestão</div><div className="mt-3 space-y-2">{data.alerts.map((alert) => <div key={alert.code} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{alert.message}</div>)}</div></Card> : null}
    </section>
  );
}
