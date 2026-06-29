// Dashboard Executivo Impulsionando — cockpit-mestre cross-tenant.
// Consolida KPIs globais (MRR, tenants, leads, trial conv, churn, N8N) e
// expõe atalhos para os cockpits profundos (briefing, macro, churn, tenants).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { fetchMacroDashboard } from "@/lib/core-dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, TrendingUp, Users, Sparkles, Activity,
  AlertTriangle, ArrowUpRight, Workflow, Wallet, Target,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/executivo")({
  head: () => ({
    meta: [
      { title: "Dashboard Executivo — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ExecutivoPage,
});

const fmtBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    .format((cents ?? 0) / 100);
const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(v ?? 0);

function ExecutivoPage() {
  const fn = useServerFn(fetchMacroDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["exec-macro", 30],
    queryFn: () => fn({ data: { days: 30, orderBy: "revenue" as const } }),
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) return <ExecSkeleton />;
  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-destructive text-sm">
            Não foi possível carregar o cockpit executivo: {String((error as any)?.message ?? "sem dados")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const t = data.totals;
  const niches = Object.entries(data.byNiche)
    .sort((a, b) => b[1].revenueCents - a[1].revenueCents)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Badge variant="outline" className="mb-2">Cockpit-mestre · últimos 30 dias</Badge>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" /> Dashboard Executivo Impulsionando
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visão consolidada de receita, base de clientes, conversão e saúde operacional do ecossistema.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/admin/executive-briefing"><Button variant="outline" size="sm"><Sparkles className="h-4 w-4 mr-2" />Briefing IA</Button></Link>
              <Link to="/admin/core/dashboard-macro" as any><Button variant="outline" size="sm"><Activity className="h-4 w-4 mr-2" />Macro detalhado</Button></Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<Wallet className="h-5 w-5" />} label="Receita (30d)" value={fmtBRL(t.revenueCents)}
            sub={`${t.invoicesPaid} faturas pagas · ${t.invoicesOverdue} vencidas`} accent="text-emerald-600" />
          <KpiCard icon={<Building2 className="h-5 w-5" />} label="Tenants ativos" value={fmtNum(t.companies)}
            sub={`${t.activeSubs} assinaturas ativas`} accent="text-blue-600" />
          <KpiCard icon={<Target className="h-5 w-5" />} label="Trials → Conv." value={`${t.trialConvRate}%`}
            sub={`${t.trialsConverted}/${t.trialsStarted} convertidos`} accent="text-violet-600" />
          <KpiCard icon={<Users className="h-5 w-5" />} label="Leads (30d)" value={fmtNum(t.leads)}
            sub={`${t.trialsLost} trials perdidos`} accent="text-pink-600" />
          <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="Churn" value={`${t.churnRate}%`}
            sub={`${t.cancelledSubs} cancelamentos`} accent="text-amber-600"
            alert={t.churnRate > 5} />
          <KpiCard icon={<Workflow className="h-5 w-5" />} label="N8N execuções" value={fmtNum(t.n8nEvents)}
            sub={`${t.n8nFailures} falhas`} accent="text-indigo-600"
            alert={t.n8nFailures > 0} />
          <KpiCard icon={<AlertTriangle className="h-5 w-5" />} label="Faturas abertas" value={fmtNum(t.invoicesOpen)}
            sub={`${t.invoicesOverdue} vencidas`} accent="text-orange-600"
            alert={t.invoicesOverdue > 0} />
          <KpiCard icon={<Activity className="h-5 w-5" />} label="Saúde geral" value={
            t.n8nFailures === 0 && t.invoicesOverdue === 0 ? "Verde" :
            t.n8nFailures > 10 || t.invoicesOverdue > 5 ? "Vermelho" : "Amarelo"
          } sub="Heurística cross-módulo" accent="text-cyan-600" />
        </div>

        {/* Top tenants + nichos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Top tenants por receita (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {data.topCompanies.slice(0, 8).map((c) => (
                <Link
                  key={c.companyId}
                  to="/admin/clientes/$slug" as any
                  params={{ slug: c.companyId }}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm font-medium">{c.companyName}</span>
                    {c.n8nFailed > 0 && (
                      <Badge variant="destructive" className="text-[10px] h-4">{c.n8nFailed} N8N err</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">{fmtBRL(c.revenueCents)}</span>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              {data.topCompanies.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">Nenhuma receita registrada no período.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Receita por nicho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {niches.map(([slug, n]) => (
                <div key={slug} className="flex items-center justify-between rounded-md px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium">{n.nicheName}</span>
                    <Badge variant="outline" className="text-[10px] h-4">{n.companies} tenants</Badge>
                  </div>
                  <div className="text-sm font-semibold">{fmtBRL(n.revenueCents)}</div>
                </div>
              ))}
              {niches.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">Sem dados de receita por nicho ainda.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Atalhos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cockpits profundos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <ShortcutLink to="/admin/cockpit-tenants" label="Cockpit de Tenants" desc="Saúde por cliente" />
            <ShortcutLink to="/admin/churn-radar" label="Churn Radar" desc="Risco e cancelamentos" />
            <ShortcutLink to="/admin/billing" label="Financeiro Global" desc="Faturas e assinaturas" />
            <ShortcutLink to="/admin/comunicacao" label="Comunicação" desc="Outbox unificado" />
            <ShortcutLink to="/admin/nichos" label="Nichos & Segmentos" desc="Catálogo Impulsionando" />
            <ShortcutLink to="/admin/vitrine" label="Vitrine B2B" desc="Marketplace governança" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, accent, alert,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  accent: string; alert?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${alert ? "border-amber-500/50" : ""}`}>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={accent}>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function ShortcutLink({ to, label, desc }: { to: string; label: string; desc: string }) {
  return (
    <Link to={to as any} className="group rounded-md border p-3 hover:bg-accent transition-colors flex items-start justify-between gap-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

function ExecSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-4">
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" /><Skeleton className="h-64" />
      </div>
    </div>
  );
}
