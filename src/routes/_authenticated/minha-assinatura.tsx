import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, CreditCard, FileCheck2, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getMyCanonicalBilling, quoteMyPlanChange, requestMyPlanChange, acceptMyPlanChange } from "@/lib/canonical-billing.functions";

export const Route = createFileRoute("/_authenticated/minha-assinatura")({ component: MeuPlanoPage });

function money(v: number | string | null | undefined) { return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function date(v?: string | null) { return v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—"; }

function MeuPlanoPage() {
  const qc = useQueryClient();
  const load = useServerFn(getMyCanonicalBilling);
  const quoteFn = useServerFn(quoteMyPlanChange);
  const requestFn = useServerFn(requestMyPlanChange);
  const acceptFn = useServerFn(acceptMyPlanChange);
  const [quote, setQuote] = useState<any>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ["canonical-my-billing"], queryFn: () => load() });
  const contract: any = data?.contract;
  const plans: any[] = data?.plans ?? [];
  const plan = plans.find((p) => p.id === contract?.plan_id);

  const change = useMutation({
    mutationFn: async (newPlanId: string) => {
      const q = await quoteFn({ data: { contractId: contract.id, newPlanId } });
      const r = await requestFn({ data: { contractId: contract.id, newPlanId } });
      return { q, r };
    },
    onSuccess: ({ q, r }) => { setQuote(q); setRequestId(r.requestId); },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: () => acceptFn({ data: { requestId: requestId!, termsVersion: "company-plan-change-v1" } }),
    onSuccess: () => { toast.success("Alteração aceita e registrada. O Core seguirá a liquidação/aplicação da mudança."); setQuote(null); setRequestId(null); qc.invalidateQueries({ queryKey: ["canonical-my-billing"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  if (error) return <Card className="p-6 text-sm text-destructive">{(error as Error).message}</Card>;

  if (!contract) return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div><h1 className="text-2xl font-bold">Meu Plano</h1><p className="text-muted-foreground">Sua empresa ainda não possui um contrato ativo no billing canônico.</p></div>
      <Card className="p-8 text-center"><CreditCard className="mx-auto h-10 w-10 text-primary"/><h2 className="mt-4 text-xl font-semibold">Escolha como quer começar</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Essencial, Ideal ou Full. A implantação é assistida e o vencimento mensal é sempre no dia 5.</p><Button asChild className="mt-5"><Link to="/planos">Ver planos <ArrowRight className="ml-2 h-4 w-4"/></Link></Button></Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div><h1 className="text-2xl font-bold">Meu Plano</h1><p className="text-muted-foreground">Plano, vencimentos, faturas e evolução do seu ecossistema em um só lugar.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><Sparkles className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Plano atual</div><div className="font-semibold">{plan?.name ?? "Plano"}</div></Card>
        <Card className="p-4"><CreditCard className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Mensalidade</div><div className="font-semibold">{money(contract.recurring_amount)}</div></Card>
        <Card className="p-4"><CalendarDays className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Próximo vencimento</div><div className="font-semibold">{date(contract.next_due_date)}</div><div className="text-xs text-muted-foreground">Sempre dia {contract.due_day}</div></Card>
        <Card className="p-4"><FileCheck2 className="h-4 w-4 text-primary"/><div className="mt-2 text-xs text-muted-foreground">Status</div><Badge className="mt-1">{contract.status}</Badge></Card>
      </div>

      <Card className="p-6"><h2 className="text-lg font-semibold">Evoluir ou ajustar o plano</h2><p className="mt-1 text-sm text-muted-foreground">O setup é cobrado somente na implantação inicial. Na troca de plano, o Core calcula apenas a diferença da mensalidade até o próximo dia 5: cobrança proporcional no upgrade e crédito proporcional no downgrade.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{plans.map((p) => { const current=p.id===contract.plan_id; return <div key={p.id} className={current?"rounded-lg border border-primary p-4":"rounded-lg border p-4"}><div className="flex items-center justify-between"><div className="font-semibold">{p.name}</div>{current&&<Badge>Atual</Badge>}</div><div className="mt-2 text-xl font-bold">{money(p.recurring_amount)}<span className="text-xs font-normal text-muted-foreground">/mês</span></div><div className="mt-1 text-xs text-muted-foreground">{p.included_module_count>=90?"Módulos homologados":`Até ${p.included_module_count} módulos`}</div><Button className="mt-4 w-full" variant={current?"outline":"default"} disabled={current||change.isPending} onClick={()=>change.mutate(p.id)}>{current?"Plano atual":"Simular mudança"}</Button></div>})}</div></Card>

      <Card className="p-6"><h2 className="text-lg font-semibold">Faturas recentes</h2><div className="mt-3 space-y-2">{(data?.invoices ?? []).length===0?<p className="text-sm text-muted-foreground">Nenhuma fatura emitida ainda.</p>:(data?.invoices ?? []).map((i:any)=><div key={i.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0"><div><div className="font-medium">{money(i.amount)}</div><div className="text-xs text-muted-foreground">Vencimento {date(i.due_date)}</div></div><Badge variant={i.status==="paid"?"default":"outline"}>{i.status}</Badge></div>)}</div></Card>

      <Card className="p-6"><h2 className="text-lg font-semibold">Alterações de plano</h2><div className="mt-3 space-y-2">{(data?.requests ?? []).length===0?<p className="text-sm text-muted-foreground">Nenhuma alteração solicitada.</p>:(data?.requests ?? []).map((r:any)=><div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-sm last:border-0"><div><div className="font-medium capitalize">{r.direction}</div><div className="text-xs text-muted-foreground">Cobrança {money(r.prorata_charge)} · Crédito {money(r.prorata_credit)} · Próximo dia 5: {date(r.next_anchor_date)}</div></div><Badge variant="outline">{r.status}</Badge></div>)}</div></Card>

      <Dialog open={!!quote} onOpenChange={(v)=>{if(!v){setQuote(null);setRequestId(null)}}}><DialogContent><DialogHeader><DialogTitle>Confirmar alteração de plano</DialogTitle><DialogDescription>Confira o cálculo automático antes de aceitar.</DialogDescription></DialogHeader>{quote&&<div className="space-y-3 text-sm"><div className="rounded-md border p-4"><div className="font-semibold">{quote.current_plan} → {quote.new_plan}</div><div className="mt-2">Mensalidade atual: {money(quote.old_monthly)}</div><div>Nova mensalidade: {money(quote.new_monthly)}</div><div>Diferença a cobrar agora: <strong>{money(quote.prorata_charge)}</strong></div><div>Crédito proporcional: <strong>{money(quote.prorata_credit)}</strong></div><div>Setup nesta troca: <strong>{money(quote.setup_charge)}</strong></div><div>Próximo vencimento: <strong>{date(quote.next_anchor_date)}</strong></div></div><label className="flex gap-2 rounded-md bg-muted/40 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary"/><span>Ao confirmar, registro meu aceite das condições desta alteração. A cobrança/crédito e a aplicação ficam auditados no Core.</span></label><Button className="w-full" onClick={()=>accept.mutate()} disabled={accept.isPending||!requestId}>{accept.isPending?"Registrando aceite…":"Aceitar alteração"}</Button></div>}</DialogContent></Dialog>
    </div>
  );
}
