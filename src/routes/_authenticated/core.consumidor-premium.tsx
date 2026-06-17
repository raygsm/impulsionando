/**
 * /core/consumidor-premium — Painel Master Impulsionando do clube Premium R$9,99.
 *
 * KPIs reais: total de consumidores, premium ativos/pendentes/inadimplentes,
 * MRR consumidor, faturas em aberto, faturamento últimos 30 dias.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getConsumerPremiumOverview } from "@/lib/consumer.functions";
import { Crown, Users, DollarSign, AlertTriangle, Receipt, TrendingUp, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/consumidor-premium")({
  component: Page,
});

const BRL = (cents: number) => (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const fn = useServerFn(getConsumerPremiumOverview);
  const q = useQuery({ queryKey: ["consumer-premium-overview"], queryFn: () => fn() });
  const d = q.data ?? {};

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <Badge className="bg-gradient-primary mb-2"><Crown className="w-3 h-3 mr-1" /> Clube Premium</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Consumidor Final — Premium R$ 9,99</h1>
          <p className="text-sm text-muted-foreground">Visão master da base de consumidores e do MRR do clube.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/vitrine" target="_blank">Vitrine pública →</Link></Button>
          <Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Users} label="Consumidores cadastrados" value={Number(d.total_consumers ?? 0)} />
        <Kpi icon={Crown} label="Premium ativos" value={Number(d.premium_active ?? 0)} accent />
        <Kpi icon={DollarSign} label="MRR Premium" value={BRL(Number(d.mrr_cents ?? 0))} accent />
        <Kpi icon={TrendingUp} label="Faturamento 30d" value={BRL(Number(d.revenue_30d_cents ?? 0))} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Receipt} label="Premium pendentes (1ª fatura)" value={Number(d.premium_pending ?? 0)} />
        <Kpi icon={AlertTriangle} label="Premium inadimplentes" value={Number(d.premium_past_due ?? 0)} />
        <Kpi icon={Receipt} label="Faturas em aberto" value={Number(d.invoices_open ?? 0)} />
        <Kpi icon={Receipt} label="Faturas pagas (30d)" value={Number(d.invoices_paid_30d ?? 0)} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-2">Como funciona o clube</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li>Visitante navega em <code>/vitrine</code> e descobre bares/restaurantes parceiros.</li>
          <li>Faz login → vai para <code>/clube</code>, completa perfil e clica em <strong>Virar Premium</strong>.</li>
          <li>RPC <code>consumer_upgrade_to_premium</code> cria membership em <em>pending</em> e fatura PIX R$ 9,99.</li>
          <li>Confirmação de pagamento move para <em>active</em> e entra no MRR Premium acima.</li>
        </ul>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-4 h-4" /> {label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </Card>
  );
}
