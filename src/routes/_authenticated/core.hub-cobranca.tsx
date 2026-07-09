import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/PageElements";
import { fetchBillingOverview } from "@/lib/billing-overview.functions";
import { getIntegrationsAutomationHealth } from "@/lib/integrations-automation-health.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Wallet, CreditCard, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Plug, ScrollText, FileText, Banknote, Gift, RefreshCw, Webhook, ArrowRight,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/hub-cobranca")({
  head: () => ({ meta: [{ title: "Cobrança & Mercado Pago — Hub" }, { name: "robots", content: "noindex" }] }),
  component: HubCobranca,
});

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Stat({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon: LucideIcon; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : tone === "bad" ? "text-red-600" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">{title}</div>
        {right}
      </div>
      {children}
    </Card>
  );
}

function ShortcutLink({ to, label, desc, icon: Icon }: { to: string; label: string; desc: string; icon: LucideIcon }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-md border p-3 hover:bg-muted transition-colors">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-1">
          {label}
          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}

function HubCobranca() {
  const billing = useServerFn(fetchBillingOverview);
  const health = useServerFn(getIntegrationsAutomationHealth);

  const overview = useQuery({ queryKey: ["hub-cobranca", "overview"], queryFn: () => billing() });
  const mpHealth = useQuery({ queryKey: ["hub-cobranca", "mp-health"], queryFn: () => health({ data: { days: 30 } }) });

  const courtesy = useQuery({
    queryKey: ["hub-cobranca", "courtesy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,public_slug,full_courtesy_status,full_courtesy_ends_at,full_courtesy_days")
        .eq("full_courtesy_status", "active")
        .order("full_courtesy_ends_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const kpis = overview.data?.kpis;
  const rows = overview.data?.rows ?? [];
  const mp = mpHealth.data?.mercadoPago;

  const now = Date.now();
  const courtesyActive = courtesy.data ?? [];
  const courtesyEndingSoon = courtesyActive.filter((c) => {
    if (!c.full_courtesy_ends_at) return false;
    const daysLeft = Math.ceil((new Date(c.full_courtesy_ends_at).getTime() - now) / 86_400_000);
    return daysLeft <= 7;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cobrança & Mercado Pago — Hub"
        description="Visão consolidada da operação financeira do Core: MRR, contratos, cortesias Full, pagamentos, webhooks e reembolsos do Mercado Pago."
      />

      {/* KPIs financeiros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="MRR" value={BRL(kpis?.mrr ?? 0)} icon={TrendingUp} tone="ok" />
        <Stat label="Contratos ativos" value={kpis?.active_contracts ?? 0} icon={CheckCircle2} />
        <Stat label="Recebido 30d" value={BRL(kpis?.paid_30d ?? 0)} icon={Banknote} tone="ok" />
        <Stat label="Faturas vencidas" value={kpis?.overdue_invoices ?? 0} icon={AlertTriangle} tone={kpis?.overdue_invoices ? "bad" : undefined} />
        <Stat label="Cortesias Full" value={courtesyActive.length} icon={Gift} tone={courtesyActive.length ? "warn" : undefined} />
      </div>

      {/* Cortesias */}
      <Section
        title="Clientes em Cortesia Full"
        right={<span className="text-xs text-muted-foreground">{courtesyEndingSoon.length} termina(m) em ≤ 7 dias</span>}
      >
        {courtesyActive.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cliente em cortesia Full ativa.</p>
        ) : (
          <div className="overflow-x-auto scroll-contrast">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left font-medium py-2">Cliente</th>
                  <th className="text-left font-medium">Dias configurados</th>
                  <th className="text-left font-medium">Encerra em</th>
                  <th className="text-left font-medium">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {courtesyActive.map((c) => {
                  const end = c.full_courtesy_ends_at ? new Date(c.full_courtesy_ends_at) : null;
                  const daysLeft = end ? Math.ceil((end.getTime() - now) / 86_400_000) : null;
                  const critical = daysLeft !== null && daysLeft <= 7;
                  return (
                    <tr key={c.id} className="border-b last:border-b-0">
                      <td className="py-2">{c.name}</td>
                      <td>{c.full_courtesy_days ?? "—"}</td>
                      <td>{end ? end.toLocaleDateString("pt-BR") : "—"}</td>
                      <td>
                        {daysLeft === null ? (
                          <Badge variant="outline">ativa</Badge>
                        ) : critical ? (
                          <Badge variant="destructive">{daysLeft}d restantes</Badge>
                        ) : (
                          <Badge variant="secondary">{daysLeft}d restantes</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        {c.public_slug ? (
                          <Link to="/admin/clientes/$slug/plano" params={{ slug: c.public_slug }} className="text-xs underline text-primary">
                            gerenciar
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Contratos por cliente (top 10 por MRR) */}
      <Section
        title="Top clientes por MRR"
        right={
          <Link to="/core/financeiro-consolidado" className="text-xs text-primary underline">
            ver todos
          </Link>
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem contratos.</p>
        ) : (
          <div className="overflow-x-auto scroll-contrast">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left font-medium py-2">Cliente</th>
                  <th className="text-right font-medium">MRR</th>
                  <th className="text-left font-medium pl-4">Contrato</th>
                  <th className="text-left font-medium">Próx. vencimento</th>
                  <th className="text-right font-medium">Vencidas</th>
                  <th className="text-right font-medium">Recebido 30d</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r) => (
                  <tr key={r.company_id} className="border-b last:border-b-0">
                    <td className="py-2">
                      {r.public_slug ? (
                        <Link to="/admin/clientes/$slug/mercado-pago" params={{ slug: r.public_slug }} className="hover:underline">
                          {r.company_name}
                        </Link>
                      ) : r.company_name}
                    </td>
                    <td className="text-right font-mono">{BRL(r.mrr)}</td>
                    <td className="pl-4">
                      <Badge variant={r.contract_status === "active" ? "default" : "outline"}>
                        {r.contract_status ?? "—"}
                      </Badge>
                    </td>
                    <td>{r.next_due_date ? new Date(r.next_due_date).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="text-right">
                      {r.overdue_invoices > 0 ? (
                        <Badge variant="destructive">{r.overdue_invoices}</Badge>
                      ) : "0"}
                    </td>
                    <td className="text-right font-mono">{BRL(r.paid_30d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Mercado Pago health */}
      <div className="grid md:grid-cols-2 gap-3">
        <Section title="Mercado Pago — Webhooks (30d)">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Eventos recebidos" value={mp?.total ?? 0} icon={Webhook} />
            <Stat label="Processados" value={mp?.processed ?? 0} icon={CheckCircle2} tone="ok" />
            <Stat label="Assinatura inválida" value={mp?.invalidSignatures ?? 0} icon={AlertTriangle} tone={mp?.invalidSignatures ? "bad" : undefined} />
            <Stat label="Erros de processamento" value={mp?.errors ?? 0} icon={AlertTriangle} tone={mp?.errors ? "warn" : undefined} />
          </div>
          {mp?.eventTypes?.length ? (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1">Tipos de evento</div>
              <div className="flex flex-wrap gap-1.5">
                {mp.eventTypes.map((t) => (
                  <Badge key={t.type} variant="outline" className="text-[10px]">
                    {t.type} · {t.count}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Section>

        <Section title="Ações & operação">
          <div className="grid gap-2">
            <ShortcutLink to="/core/integracoes/mercadopago" label="Integração Mercado Pago" desc="Credenciais, ambiente e teste de conexão" icon={Plug} />
            <ShortcutLink to="/admin/mpago-eventos" label="Eventos Mercado Pago" desc="Auditoria de webhooks e replays" icon={Webhook} />
            <ShortcutLink to="/admin/billing-contracts" label="Contratos & recorrência" desc="Ciclo, valor, próximo vencimento" icon={FileText} />
            <ShortcutLink to="/admin/billing-policy" label="Régua de cobrança" desc="Dunning, lembretes e políticas" icon={ScrollText} />
            <ShortcutLink to="/admin/billing-health" label="Saúde da cobrança" desc="Falhas, retries, cancelamentos" icon={AlertTriangle} />
            <ShortcutLink to="/admin/cobrancas" label="Cobranças em aberto" desc="Faturas pendentes e ações manuais" icon={Clock} />
            <ShortcutLink to="/core/repasses" label="Repasses" desc="Split, comissões e antecipações" icon={Banknote} />
            <ShortcutLink to="/finance" label="ERP Financeiro" desc="Livro-caixa, contas e conciliação" icon={Wallet} />
            <ShortcutLink to="/core/financeiro-master" label="Financeiro Master" desc="Visão consolidada por marca" icon={TrendingUp} />
            <ShortcutLink to="/finance/webhook-log" label="Log de webhooks financeiros" desc="Requests e reprocessamentos" icon={RefreshCw} />
          </div>
        </Section>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Este hub é somente leitura e consolida telas já existentes. Nenhuma regra de cobrança foi alterada. Ativação
        real de disparos, refunds e conversão de cortesia continua ocorrendo nas telas dedicadas com auditoria própria.
      </p>
    </div>
  );
}
