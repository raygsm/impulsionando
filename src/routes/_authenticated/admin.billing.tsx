import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CalendarDays, CreditCard, FileClock, Receipt, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCanonicalBillingAdmin } from "@/lib/canonical-billing.functions";

export const Route = createFileRoute("/_authenticated/admin/billing")({
  head: () => ({ meta: [{ title: "Planos & Cobrança — Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: BillingCockpit,
});

function money(v: unknown) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function date(v?: string | null) { return v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—"; }

function BillingCockpit() {
  const load = useServerFn(getCanonicalBillingAdmin);
  const { data, isLoading, error, refetch, isFetching } = useQuery({ queryKey: ["canonical-billing-admin"], queryFn: () => load() });
  const contracts: any[] = data?.contracts ?? [];
  const companies = new Map((data?.companies ?? []).map((x: any) => [x.id,x]));
  const plans = new Map((data?.plans ?? []).map((x: any) => [x.id,x]));
  const invoices: any[] = data?.invoices ?? [];
  const requests: any[] = data?.requests ?? [];
  const openInvoices = invoices.filter((x) => ["open","overdue"].includes(x.status));
  const active = contracts.filter((x) => x.status === "active").length;
  const mrr = contracts.filter((x) => x.status === "active").reduce((s,x)=>s+Number(x.recurring_amount||0),0);
  const pendingChanges = requests.filter((x)=>["awaiting_acceptance","accepted"].includes(x.status));

  return (
    <div className="space-y-5">
      <PageHeader title="Planos & Cobrança" description="Fonte operacional única para contratos, vencimentos no dia 5, faturas, setup e alterações de plano. O legado Paddle não é mais a fonte de gestão do Core." />
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={isFetching?"mr-2 h-4 w-4 animate-spin":"mr-2 h-4 w-4"}/>Atualizar</Button><Button asChild variant="outline"><Link to="/core/planos">Gerenciar catálogo</Link></Button><Button asChild variant="outline"><Link to="/admin/billing-policy">Régua de cobrança</Link></Button></div>
      {isLoading ? <Card className="p-6">Carregando…</Card> : error ? <Card className="p-6 text-destructive">{(error as Error).message}</Card> : <>
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="p-4"><CreditCard className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Contratos ativos</div><div className="text-2xl font-bold">{active}</div></Card>
          <Card className="p-4"><Receipt className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">MRR contratado</div><div className="text-2xl font-bold">{money(mrr)}</div></Card>
          <Card className="p-4"><CalendarDays className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Faturas abertas/atrasadas</div><div className="text-2xl font-bold">{openInvoices.length}</div></Card>
          <Card className="p-4"><FileClock className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Mudanças pendentes</div><div className="text-2xl font-bold">{pendingChanges.length}</div></Card>
        </div>

        <Card className="overflow-hidden"><div className="border-b p-4"><h2 className="font-semibold">Contratos</h2><p className="text-sm text-muted-foreground">Plano vigente, setup, mensalidade e próximo dia 5 por cliente.</p></div><div className="divide-y">{contracts.length===0?<div className="p-6 text-sm text-muted-foreground">Nenhum contrato canônico criado ainda.</div>:contracts.map((ct:any)=>{const company:any=companies.get(ct.company_id);const plan:any=plans.get(ct.plan_id);return <div key={ct.id} className="grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center"><div><div className="font-medium">{company?.name??ct.company_id}</div><div className="text-xs text-muted-foreground">{company?.email??"Sem e-mail"}</div></div><div><div className="text-xs text-muted-foreground">Plano</div><div className="font-medium">{plan?.name??"—"}</div></div><div><div className="text-xs text-muted-foreground">Mensalidade</div><div className="font-medium">{money(ct.recurring_amount)}</div></div><div><div className="text-xs text-muted-foreground">Próximo vencimento</div><div className="font-medium">{date(ct.next_due_date)} <span className="text-xs text-muted-foreground">(dia {ct.due_day})</span></div></div><div className="flex items-center gap-2"><Badge variant={ct.status==="active"?"default":"outline"}>{ct.status}</Badge><Button asChild size="sm" variant="ghost"><Link to="/core/cliente/$id" params={{id:ct.company_id}}>Cliente <ArrowRight className="ml-1 h-3 w-3"/></Link></Button></div></div>})}</div></Card>

        <Card className="overflow-hidden"><div className="border-b p-4"><h2 className="font-semibold">Alterações de plano</h2><p className="text-sm text-muted-foreground">Upgrade e downgrade com cálculo proporcional, aceite e liquidação auditável.</p></div><div className="divide-y">{requests.length===0?<div className="p-6 text-sm text-muted-foreground">Nenhuma alteração registrada.</div>:requests.map((r:any)=>{const company:any=companies.get(r.company_id);const from:any=plans.get(r.current_plan_id);const to:any=plans.get(r.new_plan_id);return <div key={r.id} className="grid gap-2 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center"><div><div className="font-medium">{company?.name??r.company_id}</div><div className="text-xs text-muted-foreground capitalize">{r.direction} · {from?.name??"—"} → {to?.name??"—"}</div></div><div><div className="text-xs text-muted-foreground">Cobrança proporcional</div><div>{money(r.prorata_charge)}</div></div><div><div className="text-xs text-muted-foreground">Crédito proporcional</div><div>{money(r.prorata_credit)}</div></div><div><div className="text-xs text-muted-foreground">Solicitado</div><div>{new Date(r.requested_at).toLocaleDateString("pt-BR")}</div></div><Badge variant="outline">{r.status}</Badge></div>})}</div></Card>
      </>}
    </div>
  );
}
