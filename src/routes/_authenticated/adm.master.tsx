import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, PlayCircle, FileText, Package, Layers, Mail,
  TrendingUp, AlertTriangle, CheckCircle2, Activity, Settings, DollarSign, Building2,
  RefreshCw, ArrowRight, ShieldAlert, Globe, Cpu, LifeBuoy,
} from "lucide-react";
import { CoreSection, LoadingState, EmptyState, ErrorState } from "@/components/impulsionando";
import { formatInt } from "@/lib/format";
import { getActionCenter } from "@/lib/action-center.functions";

export const Route = createFileRoute("/_authenticated/adm/master")({
  head: () => ({
    meta: [
      { title: "Cockpit executivo — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdmMasterPage,
});

// ─────────────────────────── Métricas operacionais ────────────────────────────

interface Metrics {
  leadsTotal: number;
  leadsWeek: number;
  demosWeek: number;
  visitsWeek: number;
  quotesTotal: number;
  quotesWeek: number;
  emailsSent: number;
  emailsFailed: number;
  nichesCount: number;
  modulesCount: number;
  plansCount: number;
  customersActive: number;
  topNiches: { niche: string; count: number }[];
  topOrigins: { origin: string; count: number }[];
}

async function loadMetrics(): Promise<Metrics> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [
    leadsAll, leadsRecent, demosRecent, visitsRecent, quotesAll, quotesRecent,
    emailsSent, emailsFailed, niches, modules, plans, customers,
    leadsByNiche, leadsByOrigin,
  ] = await Promise.all([
    supabase.from("marketing_leads").select("*", { count: "exact", head: true }),
    supabase.from("marketing_leads").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("demo_leads").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("demo_visit_sessions").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("quotes").select("*", { count: "exact", head: true }),
    supabase.from("quotes").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("email_send_log").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("email_send_log").select("*", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("niches").select("*", { count: "exact", head: true }),
    supabase.from("modules").select("*", { count: "exact", head: true }),
    supabase.from("billing_plans").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("marketing_leads").select("niche").not("niche", "is", null).limit(500),
    supabase.from("marketing_leads").select("origin").not("origin", "is", null).limit(500),
  ]);

  const tally = (rows: any[] | null, key: string) => {
    const m = new Map<string, number>();
    (rows ?? []).forEach((r) => {
      const v = r[key];
      if (!v) return;
      m.set(v, (m.get(v) ?? 0) + 1);
    });
    return [...m.entries()]
      .map(([k, count]) => ({ [key]: k, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  };

  return {
    leadsTotal: leadsAll.count ?? 0,
    leadsWeek: leadsRecent.count ?? 0,
    demosWeek: demosRecent.count ?? 0,
    visitsWeek: visitsRecent.count ?? 0,
    quotesTotal: quotesAll.count ?? 0,
    quotesWeek: quotesRecent.count ?? 0,
    emailsSent: emailsSent.count ?? 0,
    emailsFailed: emailsFailed.count ?? 0,
    nichesCount: niches.count ?? 0,
    modulesCount: modules.count ?? 0,
    plansCount: plans.count ?? 0,
    customersActive: customers.count ?? 0,
    topNiches: tally(leadsByNiche.data, "niche") as any,
    topOrigins: tally(leadsByOrigin.data, "origin") as any,
  };
}

// ─────────────────────────── Componentes visuais ──────────────────────────────

type KpiTone = "default" | "primary" | "warning" | "danger" | "success";

const toneClasses: Record<KpiTone, { value: string; icon: string }> = {
  default: { value: "text-foreground", icon: "bg-muted text-muted-foreground" },
  primary: { value: "text-primary", icon: "bg-primary/10 text-primary" },
  warning: { value: "text-foreground", icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  danger:  { value: "text-destructive", icon: "bg-destructive/10 text-destructive" },
  success: { value: "text-foreground", icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

function KpiCard({
  icon: Icon, label, value, hint, tone = "default", href, loading,
}: {
  icon: any; label: string; value: number | string; hint?: string;
  tone?: KpiTone; href?: string; loading?: boolean;
}) {
  const cls = toneClasses[tone];
  const body = (
    <Card className="p-5 hover:shadow-sm transition h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
          <div className={`text-2xl sm:text-3xl font-bold mt-1 tabular-nums ${cls.value}`}>
            {loading ? <span className="inline-block h-7 w-16 rounded bg-muted animate-pulse" /> : value}
          </div>
          {hint && <div className="text-xs text-muted-foreground mt-1 truncate">{hint}</div>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cls.icon}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
      {href && (
        <div className="mt-3 text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          Abrir <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </div>
      )}
    </Card>
  );
  return href ? (
    <Link to={href as any} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      {body}
    </Link>
  ) : body;
}

function BarList({ items, empty }: { items: { label: string; count: number }[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-2">
      {items.map((i) => {
        const pct = max > 0 ? (i.count / max) * 100 : 0;
        return (
          <li key={i.label} className="flex items-center gap-3">
            <span className="text-sm w-32 truncate" title={i.label}>{i.label}</span>
            <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold w-12 text-right tabular-nums">{formatInt(i.count)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────── Página ───────────────────────────────────────────

function AdmMasterPage() {
  const metricsQ = useQuery({
    queryKey: ["adm-master-metrics"],
    queryFn: loadMetrics,
    refetchInterval: 60_000,
  });

  const actionCenterFn = useServerFn(getActionCenter);
  const actionsQ = useQuery({
    queryKey: ["adm-master-actions"],
    queryFn: () => actionCenterFn(),
    refetchInterval: 60_000,
    retry: false,
  });

  const data = metricsQ.data;
  const loading = metricsQ.isLoading;
  const actions = actionsQ.data?.actions ?? [];
  const actionsSummary = actionsQ.data?.summary;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Cabeçalho */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cockpit executivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada da operação Impulsionando — atualização automática a cada 60s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1" aria-live="polite">
            <Activity className="w-3 h-3" aria-hidden="true" />
            {loading ? "carregando" : metricsQ.error ? "com erro" : "online"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { metricsQ.refetch(); actionsQ.refetch(); }}
            aria-label="Atualizar métricas"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" aria-hidden="true" /> Atualizar
          </Button>
        </div>
      </header>

      {/* Erro global (não bloqueia o restante) */}
      {metricsQ.error && (
        <ErrorState
          title="Falha ao carregar métricas operacionais"
          description="Verifique suas permissões ou tente novamente em instantes. As demais seções continuam disponíveis."
          action={<Button size="sm" variant="outline" onClick={() => metricsQ.refetch()}>Tentar novamente</Button>}
          detail={(metricsQ.error as Error).message}
        />
      )}

      {/* 1) Resumo executivo */}
      <CoreSection
        title="Resumo executivo"
        description="Indicadores primários do ecossistema. Cada card leva à visão detalhada."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Building2} tone="primary"
            label="Clientes ativos"
            value={data ? formatInt(data.customersActive) : "—"}
            hint="Contas conectadas ao Core"
            href="/core/clientes"
            loading={loading}
          />
          <KpiCard
            icon={CheckCircle2}
            label="Planos configurados"
            value={data ? formatInt(data.plansCount) : "—"}
            hint="Catálogo de planos disponíveis"
            href="/planos"
            loading={loading}
          />
          <KpiCard
            icon={Package}
            label="Módulos publicados"
            value={data ? formatInt(data.modulesCount) : "—"}
            hint="Módulos ativos no catálogo"
            href="/modulos"
            loading={loading}
          />
          <KpiCard
            icon={Layers}
            label="Nichos ativos"
            value={data ? formatInt(data.nichesCount) : "—"}
            hint="Verticais mapeadas"
            href="/nichos"
            loading={loading}
          />
        </div>
      </CoreSection>

      {/* 2) Atenção imediata */}
      <CoreSection
        title="Atenção imediata"
        description="Fila priorizada de itens que exigem ação da equipe Impulsionando."
        actions={
          actionsSummary && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Total {formatInt(actionsSummary.total)}</Badge>
              <Badge variant="outline" className="border-destructive/40 text-destructive">
                Críticas {formatInt(actionsSummary.critical)}
              </Badge>
              <Link to="/admin/action-center" className="text-xs text-primary hover:underline">
                Abrir Action Center
              </Link>
            </div>
          )
        }
      >
        {actionsQ.isLoading ? (
          <LoadingState label="Carregando fila de atenção…" />
        ) : actionsQ.error ? (
          <ErrorState
            title="Fila de atenção indisponível"
            description="Esta visão requer acesso da equipe Impulsionando. Os demais blocos permanecem funcionais."
            variant="compact"
            detail={(actionsQ.error as Error).message}
          />
        ) : actions.length === 0 ? (
          <EmptyState
            title="Nenhuma ação pendente no momento"
            description="Assim que surgirem faturas em atraso, tickets críticos, suspensões ou leads sem follow-up, eles aparecerão aqui automaticamente."
            variant="compact"
          />
        ) : (
          <Card className="p-2">
            <ul className="divide-y">
              {actions.slice(0, 8).map((a: any) => {
                const tone =
                  a.priority >= 80 ? { chip: "bg-destructive/10 text-destructive border-destructive/30", label: "Crítico" } :
                  a.priority >= 60 ? { chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", label: "Atenção" } :
                                     { chip: "bg-muted text-muted-foreground border-border", label: "Informativo" };
                return (
                  <li key={a.id}>
                    <Link
                      to={a.link}
                      className="flex items-center gap-3 p-3 hover:bg-muted/40 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${tone.chip}`}>
                        <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                        {tone.label} · {a.priority}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{a.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{a.subtitle}</div>
                      </div>
                      <Badge variant="outline" className="hidden sm:inline-flex">{a.category}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {actions.length > 8 && (
              <div className="p-3 border-t text-center">
                <Link to="/admin/action-center" className="text-sm text-primary hover:underline">
                  Ver todas as {formatInt(actions.length)} pendências
                </Link>
              </div>
            )}
          </Card>
        )}
      </CoreSection>

      {/* 3) Funil de aquisição (últimos 7 dias) */}
      <CoreSection
        title="Aquisição · últimos 7 dias"
        description="Fluxo de visitas → demos → leads → orçamentos gerados no ecossistema."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Activity} label="Visitas demo"
            value={data ? formatInt(data.visitsWeek) : "—"}
            hint="Sessões nas páginas de demonstração"
            loading={loading}
          />
          <KpiCard
            icon={PlayCircle} label="Demos liberadas"
            value={data ? formatInt(data.demosWeek) : "—"}
            hint="Leads que ativaram demo"
            loading={loading}
          />
          <KpiCard
            icon={Users} label="Novos leads"
            value={data ? formatInt(data.leadsWeek) : "—"}
            hint={data ? `${formatInt(data.leadsTotal)} no histórico` : undefined}
            href="/core/marketing-leads"
            loading={loading}
          />
          <KpiCard
            icon={FileText} label="Orçamentos"
            value={data ? formatInt(data.quotesWeek) : "—"}
            hint={data ? `${formatInt(data.quotesTotal)} no histórico` : undefined}
            loading={loading}
          />
        </div>
      </CoreSection>

      {/* 4) Comunicação */}
      <CoreSection
        title="Comunicação"
        description="Saúde dos envios transacionais e de marketing."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Mail} tone="success" label="E-mails entregues"
            value={data ? formatInt(data.emailsSent) : "—"}
            loading={loading}
          />
          <KpiCard
            icon={AlertTriangle}
            tone={data && data.emailsFailed > 0 ? "danger" : "default"}
            label="Falhas de envio"
            value={data ? formatInt(data.emailsFailed) : "—"}
            hint={data && data.emailsFailed > 0 ? "Revise a fila e credenciais" : "Sem incidentes"}
            loading={loading}
          />
        </div>
      </CoreSection>

      {/* 5) Análises: nichos e origens */}
      <CoreSection
        title="Análises de aquisição"
        description="Distribuição dos leads por nicho e origem — amostragem das últimas 500 entradas."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" aria-hidden="true" /> Top nichos buscados
            </h3>
            {loading ? (
              <LoadingState compact label="Carregando…" />
            ) : (
              <BarList
                items={(data?.topNiches ?? []).map((n: any) => ({ label: n.niche, count: n.count }))}
                empty="Sem dados suficientes para o período."
              />
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" /> Origens dos leads
            </h3>
            {loading ? (
              <LoadingState compact label="Carregando…" />
            ) : (
              <BarList
                items={(data?.topOrigins ?? []).map((o: any) => ({ label: o.origin, count: o.count }))}
                empty="Sem dados suficientes para o período."
              />
            )}
          </Card>
        </div>
      </CoreSection>

      {/* 6) Ações rápidas */}
      <CoreSection
        title="Ações rápidas"
        description="Rotas executivas mais utilizadas do Core. Cada bloco leva à visão especializada."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickGroup
            icon={DollarSign}
            title="Financeiro e cobrança"
            items={[
              { to: "/admin/cobrancas", label: "Central de cobranças" },
              { to: "/admin/billing", label: "Faturamento" },
              { to: "/admin/billing-contracts", label: "Contratos" },
              { to: "/admin/revenue-forecast", label: "Previsão de receita" },
            ]}
          />
          <QuickGroup
            icon={Building2}
            title="Clientes e operação"
            items={[
              { to: "/admin/tenant-360", label: "Cliente 360" },
              { to: "/admin/command-center", label: "Command Center" },
              { to: "/admin/action-center", label: "Action Center" },
              { to: "/admin/funil-360", label: "Funil 360°" },
            ]}
          />
          <QuickGroup
            icon={TrendingUp}
            title="Crescimento e retenção"
            items={[
              { to: "/admin/expansion-radar", label: "Expansion Radar" },
              { to: "/admin/churn-risk", label: "Churn Risk" },
              { to: "/admin/cohort-retention", label: "Cohort Retention" },
              { to: "/admin/peer-benchmark", label: "Peer Benchmark" },
            ]}
          />
          <QuickGroup
            icon={Cpu}
            title="Automação e IA"
            items={[
              { to: "/adm/agentes", label: "Agentes IA" },
              { to: "/admin/ai-automation-health", label: "Saúde da automação" },
              { to: "/admin/executive-briefing", label: "Briefing executivo (IA)" },
              { to: "/core", label: "Cockpit Core" },
            ]}
          />
          <QuickGroup
            icon={Globe}
            title="Publicação e domínios"
            items={[
              { to: "/core/dominios", label: "Domínios" },
              { to: "/core/publicacao", label: "Publicações" },
              { to: "/core/releases", label: "Releases" },
              { to: "/admin/uptime", label: "Uptime" },
            ]}
          />
          <QuickGroup
            icon={LifeBuoy}
            title="Governança e suporte"
            items={[
              { to: "/admin/audit-trail", label: "Trilha de auditoria" },
              { to: "/admin/health", label: "Health Score" },
              { to: "/admin/attribution", label: "Atribuição de receita" },
              { to: "/admin/niche-matrix", label: "Matriz de nichos" },
            ]}
          />
        </div>
      </CoreSection>
    </div>
  );
}

function QuickGroup({
  icon: Icon, title, items,
}: { icon: any; title: string; items: { to: string; label: string }[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.to}>
            <Link
              to={i.to as any}
              className="flex items-center justify-between text-sm px-2 py-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate">{i.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
