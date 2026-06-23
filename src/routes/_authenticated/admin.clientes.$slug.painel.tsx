// Painel Impulsionando — dashboard universal módulo-aware (padrão pós-instalação).
// Renderiza KPIs SOMENTE dos módulos contratados pelo tenant. Mesma rota serve
// CHRISMED, RioMed e qualquer cliente novo do core Impulsionando.
// IDENTIDADE: somente Impulsionando (logo + cores + slogan "Seu Dashboard").
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getImpulsionandoPainel } from "@/lib/impulsionando-painel.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, MessageCircle, Calendar, Wallet, Package,
  Megaphone, Workflow, ShoppingCart, FileText, ArrowRight, TrendingUp,
  AlertTriangle, Activity, ChevronRight,
} from "lucide-react";
import { ClientDashboardHero } from "@/components/admin/ClientDashboardHero";
import { ClientFeatureMenu } from "@/components/admin/ClientFeatureMenu";
import { getTenantFeatures } from "@/lib/tenant-features";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/painel")({
  component: PainelPage,
});


const fmtMoney = (v: number, c: string = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v ?? 0);
const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(v ?? 0);

function PainelPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getImpulsionandoPainel);
  const { data, isLoading, error } = useQuery({
    queryKey: ["impulsionando-painel", slug],
    queryFn: () => fn({ data: { slug } }),
    refetchInterval: 60_000,
  });

  if (isLoading) return <PainelSkeleton />;
  if (error || !data) return (
    <div className="container mx-auto p-6">
      <Card className="border-destructive/40">
        <CardContent className="p-6 text-destructive">
          Não foi possível carregar o painel: {String((error as any)?.message ?? "tenant não encontrado")}
        </CardContent>
      </Card>
    </div>
  );

  const { company, modules, kpis } = data;
  const moduleCount = modules.length;

  const enabledSet = new Set<string>(data.enabled ?? []);
  const features = useMemo(() => getTenantFeatures(slug), [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ClientDashboardHero
        tenantName={company.name}
        subdomain={company.subdomain ?? slug}
        moduleCount={moduleCount}
        generatedAt={data.generatedAt}
      />



      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* MÓDULOS — KPIs proporcionais ao plano */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {kpis.crm && (
            <ModuleCard
              icon={<Users className="h-5 w-5" />}
              title="CRM 360"
              accent="text-blue-600"
              href={`/admin/clientes/${slug}/crm`}
              metrics={[
                { label: "Leads (30d)", value: fmtNum(kpis.crm.leads30), highlight: true },
                { label: "Hoje", value: fmtNum(kpis.crm.leadsToday) },
                { label: "Oport. abertas", value: fmtNum(kpis.crm.oppsOpen) },
                { label: "Ganhas (30d)", value: `${kpis.crm.oppsWon30} · ${fmtMoney(kpis.crm.oppsWonValue)}` },
              ]}
            />
          )}

          {kpis.support && (
            <ModuleCard
              icon={<MessageCircle className="h-5 w-5" />}
              title="Suporte"
              accent="text-violet-600"
              href={`/admin/suporte-pro`}
              alert={kpis.support.urgent > 0}
              metrics={[
                { label: "Tickets abertos", value: fmtNum(kpis.support.open), highlight: true },
                { label: "Urgentes", value: fmtNum(kpis.support.urgent), tone: kpis.support.urgent > 0 ? "red" : undefined },
                { label: "Resolvidos (7d)", value: fmtNum(kpis.support.solvedWeek) },
              ]}
            />
          )}

          {kpis.agenda && (
            <ModuleCard
              icon={<Calendar className="h-5 w-5" />}
              title="Agenda"
              accent="text-emerald-600"
              href={`/admin/clientes/${slug}/agenda`}
              metrics={[
                { label: "Hoje", value: fmtNum(kpis.agenda.todayCount), highlight: true },
                { label: "Próx. 7 dias", value: fmtNum(kpis.agenda.next7) },
              ]}
            />
          )}

          {kpis.finance && (
            <ModuleCard
              icon={<Wallet className="h-5 w-5" />}
              title="Financeiro"
              accent="text-amber-600"
              href={`/admin/clientes/${slug}/financeiro`}
              alert={kpis.finance.overdue > 0}
              metrics={[
                { label: "Pagas (30d)", value: fmtMoney(kpis.finance.paidValue30), highlight: true },
                { label: "Em aberto", value: fmtNum(kpis.finance.openInvoices) },
                { label: "Vencidas", value: fmtNum(kpis.finance.overdue), tone: kpis.finance.overdue > 0 ? "red" : undefined },
              ]}
            />
          )}

          {kpis.inventory && (
            <ModuleCard
              icon={<Package className="h-5 w-5" />}
              title="Estoque"
              accent="text-cyan-600"
              href={`/admin/clientes/${slug}/produtos`}
              alert={kpis.inventory.low > 0}
              metrics={[
                { label: "SKUs", value: fmtNum(kpis.inventory.totalSkus), highlight: true },
                { label: "Estoque baixo", value: fmtNum(kpis.inventory.low), tone: kpis.inventory.low > 0 ? "amber" : undefined },
              ]}
            />
          )}

          {kpis.marketing && (
            <ModuleCard
              icon={<Megaphone className="h-5 w-5" />}
              title="Marketing & Funil"
              accent="text-pink-600"
              href={`/admin/clientes/${slug}/marketing`}
              metrics={[
                { label: "Novos leads (30d)", value: fmtNum(kpis.marketing.newLeads30), highlight: true },
                { label: "Disparos pendentes", value: fmtNum(kpis.marketing.pendingDispatches) },
              ]}
            />
          )}

          {kpis.automation && (
            <ModuleCard
              icon={<Workflow className="h-5 w-5" />}
              title="Automação (N8N)"
              accent="text-indigo-600"
              href={`/admin/clientes/${slug}/n8n`}
              alert={kpis.automation.failed7 > 0}
              metrics={[
                { label: "Execuções (7d)", value: fmtNum(kpis.automation.runs7), highlight: true },
                { label: "Erros (7d)", value: fmtNum(kpis.automation.failed7), tone: kpis.automation.failed7 > 0 ? "red" : undefined },
              ]}
            />
          )}

          {kpis.pos && (
            <ModuleCard
              icon={<ShoppingCart className="h-5 w-5" />}
              title="POS / Vendas"
              accent="text-rose-600"
              href={`/admin/clientes/${slug}/pos`}
              metrics={[
                { label: "Faturamento (30d)", value: fmtMoney(kpis.pos.sales30, "BOB"), highlight: true },
                { label: "Vendas", value: fmtNum(kpis.pos.count30) },
              ]}
            />
          )}

          {kpis.fiscal && (
            <ModuleCard
              icon={<FileText className="h-5 w-5" />}
              title="Fiscal"
              accent="text-slate-600"
              href={`/admin/clientes/${slug}/fiscal`}
              alert={kpis.fiscal.errors30 > 0}
              metrics={[
                { label: "Emitidas (30d)", value: fmtNum(kpis.fiscal.emitted30), highlight: true },
                { label: "Erros (30d)", value: fmtNum(kpis.fiscal.errors30), tone: kpis.fiscal.errors30 > 0 ? "red" : undefined },
              ]}
            />
          )}
        </div>

        {/* MÓDULOS CONTRATADOS — grid de descoberta */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" /> Módulos do plano ({moduleCount})
              </CardTitle>
              <Badge variant="outline">Plano Full · Impulsionando</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ModulesGrid modules={modules} slug={slug} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── components ───
function ModuleCard({
  icon, title, accent, href, alert, metrics,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  href: string;
  alert?: boolean;
  metrics: { label: string; value: string; highlight?: boolean; tone?: "red" | "amber" }[];
}) {
  return (
    <Card className={`group relative overflow-hidden transition-all hover:shadow-elegant hover:-translate-y-0.5 ${alert ? "border-amber-500/50" : ""}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      {alert && (
        <div className="absolute top-3 right-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className={accent}>{icon}</span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <span className={`font-semibold ${m.highlight ? "text-lg" : "text-sm"} ${m.tone === "red" ? "text-destructive" : m.tone === "amber" ? "text-amber-600" : ""}`}>
              {m.value}
            </span>
          </div>
        ))}
        <Link to={href as any} className="block pt-2">
          <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
            Abrir módulo <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ModulesGrid({ modules, slug }: { modules: any[]; slug: string }) {
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    modules.forEach((m) => {
      const k = m.category || "Outros";
      (g[k] ??= []).push(m);
    });
    return g;
  }, [modules]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{cat}</div>
          <div className="flex flex-wrap gap-2">
            {items.map((m) => (
              <Link key={m.slug} to={`/admin/clientes/${slug}/${m.slug}` as any}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3">
                  {m.name} <ArrowRight className="h-3 w-3 ml-1.5 opacity-50" />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PainelSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
      </div>
    </div>
  );
}
