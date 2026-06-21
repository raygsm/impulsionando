import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, PlayCircle, FileText, Package, Layers, Mail, MessageSquare,
  TrendingUp, AlertTriangle, CheckCircle2, Activity, Settings, DollarSign, Building2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/adm/master")({
  head: () => ({ meta: [{ title: "Admin Master — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdmMasterPage,
});

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

function MetricCard({
  icon: Icon, label, value, sub, accent, href,
}: { icon: any; label: string; value: number | string; sub?: string; accent?: string; href?: string }) {
  const body = (
    <Card className="p-5 hover:shadow-md transition cursor-pointer h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={`text-2xl sm:text-3xl font-bold mt-1 ${accent ?? ""}`}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
  return href ? <Link to={href as any}>{body}</Link> : body;
}

function AdmMasterPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adm-master-metrics"],
    queryFn: loadMetrics,
    refetchInterval: 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Master</h1>
          <p className="text-sm text-muted-foreground">Visão consolidada da operação Impulsionando — atualiza a cada 60s.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1"><Activity className="w-3 h-3" /> {isLoading ? "carregando" : error ? "erro" : "online"}</Badge>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Atualizar</Button>
        </div>
      </div>

      {/* Funil */}
      <section>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">Funil últimos 7 dias</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</>
          ) : (
            <>
              <MetricCard icon={Activity} label="Visitas demo" value={data?.visitsWeek ?? 0} sub="demo_visit_sessions" />
              <MetricCard icon={PlayCircle} label="Demos liberadas" value={data?.demosWeek ?? 0} sub="demo_leads" />
              <MetricCard icon={Users} label="Novos leads" value={data?.leadsWeek ?? 0} sub={`${data?.leadsTotal ?? 0} no total`} href="/core" />
              <MetricCard icon={FileText} label="Orçamentos" value={data?.quotesWeek ?? 0} sub={`${data?.quotesTotal ?? 0} no total`} />
            </>
          )}
        </div>
      </section>

      {/* Catálogo + Comunicação */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</>
        ) : (
          <>
            <MetricCard icon={Layers} label="Nichos" value={data?.nichesCount ?? 0} href="/nichos" />
            <MetricCard icon={Package} label="Módulos" value={data?.modulesCount ?? 0} href="/modulos" />
            <MetricCard icon={CheckCircle2} label="Planos" value={data?.plansCount ?? 0} href="/planos" />
            <MetricCard icon={TrendingUp} label="Clientes ativos" value={data?.customersActive ?? 0} accent="text-primary" />
          </>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}</>
        ) : (
          <>
            <MetricCard icon={Mail} label="E-mails enviados" value={data?.emailsSent ?? 0} accent="text-emerald-600" />
            <MetricCard icon={AlertTriangle} label="Falhas de envio" value={data?.emailsFailed ?? 0} accent={data?.emailsFailed ? "text-destructive" : ""} />
            <MetricCard icon={MessageSquare} label="WhatsApp pendente" value="—" sub="Configure integração" />
            <MetricCard icon={Settings} label="Integrações" value="—" sub="Ver /core" href="/core" />
          </>
        )}
      </section>

      {/* Top Nichos & Origens */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Top nichos buscados</h3>
          {isLoading ? <Skeleton className="h-32" /> : (
            <ul className="space-y-2">
              {(data?.topNiches ?? []).length === 0 && <li className="text-sm text-muted-foreground">Sem dados ainda.</li>}
              {data?.topNiches.map((n: any) => {
                const max = Math.max(...(data?.topNiches ?? []).map((x: any) => x.count));
                const pct = max > 0 ? (n.count / max) * 100 : 0;
                return (
                  <li key={n.niche} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate">{n.niche}</span>
                    <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{n.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Origens de leads</h3>
          {isLoading ? <Skeleton className="h-32" /> : (
            <ul className="space-y-2">
              {(data?.topOrigins ?? []).length === 0 && <li className="text-sm text-muted-foreground">Sem dados ainda.</li>}
              {data?.topOrigins.map((o: any) => {
                const max = Math.max(...(data?.topOrigins ?? []).map((x: any) => x.count));
                const pct = max > 0 ? (o.count / max) * 100 : 0;
                return (
                  <li key={o.origin} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate">{o.origin}</span>
                    <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">{o.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      {/* Atalhos CRUD */}
      <section>
        <h2 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">Gestão</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/core", label: "Cockpit Core", icon: Settings },
            { to: "/bi/master", label: "BI Master", icon: TrendingUp },
            { to: "/admin/billing", label: "Faturamento", icon: FileText },
            { to: "/admin/trials", label: "Trials", icon: Users },
            { to: "/admin/uptime", label: "Uptime", icon: Activity },
            { to: "/adm/agentes", label: "Agentes IA", icon: Settings },
            { to: "/admin/modulos/clonagem", label: "Clonagem módulos", icon: Package },
            { to: "/admin/billing-contracts", label: "Contratos", icon: FileText },
            { to: "/admin/cobrancas", label: "Central de Cobranças", icon: DollarSign },
            { to: "/admin/funil-360", label: "Funil 360º", icon: TrendingUp },
            { to: "/admin/health", label: "Health Score", icon: Activity },
            { to: "/admin/inbox-unificada", label: "Inbox Omnichannel", icon: Mail },
            { to: "/admin/expansion-radar", label: "Expansion Radar", icon: TrendingUp },
            { to: "/admin/attribution", label: "Revenue Attribution", icon: DollarSign },
            { to: "/admin/peer-benchmark", label: "Peer Benchmark", icon: TrendingUp },
            { to: "/admin/tenant-360", label: "Tenant 360º", icon: Building2 },
          ].map((l) => (
            <Link key={l.to} to={l.to as any} className="block">
              <Card className="p-3 hover:border-primary/40 hover:bg-primary/5 transition flex items-center gap-2">
                <l.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">{l.label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" /> Erro ao carregar métricas. Verifique permissões.
          </div>
        </Card>
      )}
    </div>
  );
}
