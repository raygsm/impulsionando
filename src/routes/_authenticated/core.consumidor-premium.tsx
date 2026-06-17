/**
 * /core/consumidor-premium — Painel Master Impulsionando do clube Premium R$9,99.
 *
 * KPIs reais: total de consumidores, premium ativos/pendentes/inadimplentes,
 * MRR consumidor, faturas em aberto, faturamento últimos 30 dias.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getConsumerPremiumOverview } from "@/lib/consumer.functions";
import { listOpenInvoices } from "@/lib/admin-invoices.functions";
import { adminMarkInvoicePaid } from "@/lib/admin-billing.functions";
import { Crown, Users, DollarSign, AlertTriangle, Receipt, TrendingUp, RefreshCw, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/consumidor-premium")({
  component: Page,
});

const BRL = (cents: number) => (Number(cents || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Page() {
  const qc = useQueryClient();
  const fn = useServerFn(getConsumerPremiumOverview);
  const fnInv = useServerFn(listOpenInvoices);
  const markPaid = useServerFn(adminMarkInvoicePaid);
  const q = useQuery({ queryKey: ["consumer-premium-overview"], queryFn: () => fn() });
  const inv = useQuery({ queryKey: ["admin-open-invoices"], queryFn: () => fnInv() });
  const d = q.data ?? {};

  const mut = useMutation({
    mutationFn: (v: { kind: "consumer" | "erp"; invoice_id: string }) => markPaid({ data: v }),
    onSuccess: () => {
      toast.success("Fatura baixada");
      qc.invalidateQueries({ queryKey: ["admin-open-invoices"] });
      qc.invalidateQueries({ queryKey: ["consumer-premium-overview"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">

        <div>
          <Badge className="bg-gradient-primary mb-2"><Crown className="w-3 h-3 mr-1" /> Clube Premium</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Clube Impulsionando — Premium R$ 9,99</h1>
          <p className="text-sm text-muted-foreground">Visão master da base de membros e do MRR do Clube.</p>

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

      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4" /> Faturas em aberto
          <Badge variant="outline" className="ml-auto">{(inv.data?.consumer.length ?? 0) + (inv.data?.erp.length ?? 0)}</Badge>
        </h2>
        {inv.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Clube Premium (R$ 9,99)</h3>
              {(inv.data?.consumer ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma fatura em aberto.</p>
              ) : (
                <div className="space-y-1">
                  {inv.data!.consumer.map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between gap-2 border rounded-md p-2 text-sm">
                      <div className="font-mono text-xs">{i.id.slice(0, 8)}</div>
                      <div>{BRL(i.amount_cents)}</div>
                      <Badge variant={i.status === "overdue" ? "destructive" : "secondary"}>{i.status}</Badge>
                      <div className="text-xs text-muted-foreground">{new Date(i.due_date).toLocaleDateString("pt-BR")}</div>
                      <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate({ kind: "consumer", invoice_id: i.id })}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar pago
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Contratos ERP</h3>
              {(inv.data?.erp ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma fatura em aberto.</p>
              ) : (
                <div className="space-y-1">
                  {inv.data!.erp.map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between gap-2 border rounded-md p-2 text-sm">
                      <div className="font-mono text-xs">{i.id.slice(0, 8)}</div>
                      <div>R$ {Number(i.amount).toFixed(2)}</div>
                      <Badge variant={i.status === "overdue" ? "destructive" : "secondary"}>{i.status}</Badge>
                      <div className="text-xs text-muted-foreground">{i.due_date ? new Date(i.due_date).toLocaleDateString("pt-BR") : "—"}</div>
                      <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate({ kind: "erp", invoice_id: i.id })}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar pago
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Pagamentos via PIX/InfinitePay fecham automaticamente as faturas pelo webhook
              <code className="mx-1">/api/public/payments/close-invoice</code>. Use o botão acima apenas para baixa manual.
            </p>
          </div>
        )}
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
