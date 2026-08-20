import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Building2, CreditCard, Headphones, MessageCircle, Workflow, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageElements";
import { ImpulsionandoFinancialGovernance } from "@/components/dashboard/ImpulsionandoFinancialGovernance";

export const Route = createFileRoute("/_authenticated/master-observer")({
  head: () => ({ meta: [{ title: "Gestão Master — Leitura | Impulsionando" }] }),
  component: MasterObserverPage,
});

type Snapshot = {
  access_mode: string;
  active_companies: number;
  paying_clients: number;
  active_billing_contracts: number;
  mrr: number;
  monthly_recurring_costs: number;
  open_support_tickets: number;
  open_conversations: number;
  crm_opportunities: number;
  n8n_active: number;
  n8n_total: number;
};

const brl = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));

async function fetchSnapshot(): Promise<Snapshot> {
  const { data, error } = await (supabase as any).rpc("impulsionando_master_observer_dashboard");
  if (error) throw error;
  return data as Snapshot;
}

function MasterObserverPage() {
  const { data: me, isLoading: loadingUser } = useCurrentUser();
  const { data, isLoading } = useQuery({
    queryKey: ["impulsionando-master-observer-dashboard"],
    queryFn: fetchSnapshot,
    enabled: Boolean(me?.isMasterObserver || me?.isImpulsionandoStaff || me?.isSuperAdmin),
    refetchInterval: 30_000,
  });

  if (loadingUser) return <div className="p-6 text-sm text-muted-foreground">Validando acesso...</div>;
  if (!me) return <Navigate to="/auth" />;
  if (!(me.isMasterObserver || me.isImpulsionandoStaff || me.isSuperAdmin)) return <Navigate to="/dashboard" />;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <PageHeader
        title="Gestão Master Impulsionando"
        description="Visão executiva integral em modo somente leitura. Nenhuma ação desta área altera dados operacionais."
        action={<Badge variant="secondary" className="gap-1"><Eye className="h-3.5 w-3.5" />Somente leitura</Badge>}
      />

      <Card className="border-primary/25 bg-primary/[0.035] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Perfil Master Observer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesso de consulta à gestão da Impulsionando, ERP, CRM, Comercial, Operações e Analytics. Credenciais, cofres de segredos e prontuários clínicos permanecem fora do escopo por segurança e privacidade.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4 text-primary" />Empresas ativas</div><div className="mt-3 text-3xl font-semibold">{isLoading ? "—" : data?.active_companies ?? 0}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4 text-primary" />Clientes pagantes</div><div className="mt-3 text-3xl font-semibold">{isLoading ? "—" : data?.paying_clients ?? 0}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-primary" />MRR</div><div className="mt-3 text-3xl font-semibold">{isLoading ? "—" : brl(data?.mrr)}</div><p className="mt-1 text-xs text-muted-foreground">Custos recorrentes mapeados: {brl(data?.monthly_recurring_costs)}</p></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><Workflow className="h-4 w-4 text-primary" />Automações n8n</div><div className="mt-3 text-3xl font-semibold">{isLoading ? "—" : `${data?.n8n_active ?? 0}/${data?.n8n_total ?? 0}`}</div></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><Headphones className="h-4 w-4 text-primary" />Tickets abertos</div><div className="mt-3 text-3xl font-semibold">{data?.open_support_tickets ?? 0}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><MessageCircle className="h-4 w-4 text-primary" />Conversas abertas</div><div className="mt-3 text-3xl font-semibold">{data?.open_conversations ?? 0}</div></Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="h-4 w-4 text-primary" />Oportunidades CRM</div><div className="mt-3 text-3xl font-semibold">{data?.crm_opportunities ?? 0}</div></Card>
      </div>

      <ImpulsionandoFinancialGovernance />

      <Card className="p-5">
        <h2 className="font-semibold">Áreas de consulta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Este hub centraliza os indicadores. O acesso aos módulos completos será liberado progressivamente com políticas SELECT-only, sem promover o perfil a administrador.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link to={"/crm/board" as never}>CRM <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to={"/dashboards/operacao" as never}>ERP / Operação <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to={"/core/marketing/dashboard" as never}>Marketing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </Card>
    </div>
  );
}
