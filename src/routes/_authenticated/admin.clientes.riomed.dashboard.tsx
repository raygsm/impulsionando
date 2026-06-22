import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getRiomedManagementDashboard } from "@/lib/riomed-customer-area.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, ShoppingCart, FileText, DollarSign, Activity, Hospital, Package, HeadphonesIcon, MessageCircle, Target, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/dashboard")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='dashboard' title='Dashboard RioMed'><DashboardPage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

const MODULES = [
  { to: "/admin/clientes/riomed", label: "Visão geral" },
  { to: "/admin/clientes/riomed/produtos", label: "Produtos" },
  { to: "/admin/clientes/riomed/precos-listas", label: "Preços" },
  { to: "/admin/clientes/riomed/estoque-almoxarifados", label: "Estoque" },
  { to: "/admin/clientes/riomed/locacao", label: "Locação" },
  { to: "/admin/clientes/riomed/assistencia", label: "Assistência" },
  { to: "/admin/clientes/riomed/parceiros", label: "Parceiros" },
  { to: "/admin/clientes/riomed/crm", label: "CRM" },
  { to: "/admin/clientes/riomed/vendedores", label: "Vendedores" },
  { to: "/admin/clientes/riomed/pedidos", label: "Cotizações & Pedidos" },
  { to: "/admin/clientes/riomed/comissoes", label: "Comissões" },
  { to: "/admin/clientes/riomed/marketing", label: "Marketing" },
  { to: "/admin/clientes/riomed/automacao", label: "Automação" },
  { to: "/admin/clientes/riomed/assistente", label: "Assistente IA" },
  { to: "/admin/clientes/riomed/busca-ia", label: "Busca IA" },
  { to: "/admin/clientes/riomed/carrinhos", label: "Carrinhos" },
  { to: "/admin/clientes/riomed/portal", label: "Portal" },
  { to: "/admin/clientes/riomed/financeiro", label: "Financeiro" },
  { to: "/admin/clientes/riomed/relatorios", label: "Relatórios" },
  { to: "/admin/clientes/riomed/governanca", label: "Governança" },
  { to: "/admin/clientes/riomed/importacoes", label: "Importações" },
  { to: "/admin/clientes/riomed/implantacao", label: "Implantação" },
  { to: "/admin/clientes/riomed/routing", label: "Roteamento" },
  { to: "/admin/clientes/riomed/configuracoes-campos", label: "Campos" },
];

function DashboardPage() {
  const fn = useServerFn(getRiomedManagementDashboard);
  const q = useQuery({ queryKey: ["rm-dash"], queryFn: () => fn() });

  if (q.isLoading) return <div className="p-8">Carregando…</div>;
  const d = q.data!;
  const k = d.kpis;
  const convQuoteRate = k.leadsLast30 > 0 ? Math.round((k.quotesLast30 / k.leadsLast30) * 100) : 0;
  const convOrderRate = k.quotesLast30 > 0 ? Math.round((k.ordersLast30 / k.quotesLast30) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Comercial — RioMed</h1>
        <p className="text-muted-foreground">Visão consolidada de vendas, funil, vendedores e operação (últimos 30 dias).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={<Users />} label="Leads" value={k.leadsLast30} />
        <Kpi icon={<FileText />} label="Cotizações" value={k.quotesLast30} sub={`${convQuoteRate}% conversão`} />
        <Kpi icon={<ShoppingCart />} label="Pedidos" value={k.ordersLast30} sub={`${convOrderRate}% fechamento`} />
        <Kpi icon={<DollarSign />} label="Receita" value={Number(k.revenueLast30).toLocaleString()} />
        <Kpi icon={<Target />} label="Cotado" value={Number(k.quotedLast30).toLocaleString()} />
        <Kpi icon={<TrendingUp />} label="Comissão pendente" value={Number(k.commissionPending).toLocaleString()} />
        <Kpi icon={<DollarSign />} label="Comissão paga (mês)" value={Number(k.commissionPaidMonth).toLocaleString()} />
        <Kpi icon={<Activity />} label="Vendedores ativos" value={k.activeSellers} />
        <Kpi icon={<Package />} label="Produtos ativos" value={k.activeProducts} />
        <Kpi icon={<Hospital />} label="Hospitais" value={k.hospitals} />
        <Kpi icon={<HeadphonesIcon />} label="Tickets abertos" value={k.ticketsOpen} />
        <Kpi icon={<MessageCircle />} label="WhatsApp (7d)" value={k.whatsapp7d} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Funil (30d)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FunnelRow label="Captar (leads)" value={d.funnel.captar} max={d.funnel.captar} />
            <FunnelRow label="Converter (cotizações)" value={d.funnel.converter} max={d.funnel.captar} />
            <FunnelRow label="Ganhos" value={d.funnel.ganhos} max={d.funnel.captar} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Origens de leads</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(d.sources).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="capitalize">{k}</span>
                <Badge variant="secondary">{v as number}</Badge>
              </div>
            ))}
            {Object.keys(d.sources).length === 0 && <p className="text-sm text-muted-foreground">Sem leads no período.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de vendedores</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {d.sellerRanking.map((s: any, i: number) => (
            <div key={s.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-muted-foreground w-8">{i + 1}</span>
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.total} leads · {s.won} ganhos</div>
                </div>
              </div>
              <Badge>{s.total > 0 ? Math.round((s.won / s.total) * 100) : 0}% taxa</Badge>
            </div>
          ))}
          {d.sellerRanking.length === 0 && <p className="text-sm text-muted-foreground">Sem dados de vendedores.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Acesso rápido aos módulos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MODULES.map((m) => (
            <Link key={m.to} to={m.to} className="p-3 rounded border hover:bg-muted text-sm">
              {m.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function FunnelRow({ label, value, max }: any) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <strong>{value} ({pct}%)</strong>
      </div>
      <Progress value={pct} />
    </div>
  );
}
