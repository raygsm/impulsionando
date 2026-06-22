import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getContabHealth } from "@/lib/contab-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, RefreshCw, FileText, ClipboardList, Receipt, Wallet, Bell, FileSignature } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/contab-health")({
  component: Page,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function onTimeVariant(p: number): "default" | "secondary" | "destructive" {
  if (p >= 95) return "default";
  if (p >= 80) return "secondary";
  return "destructive";
}

function Page() {
  const fn = useServerFn(getContabHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "contab-health", days],
    queryFn: () => fn({ data: { days } }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Contábil & Office Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Carteira, obrigações fiscais, documentos, tarefas, IRPF e financeiro do escritório.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Clientes Ativos</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.clients.active)}<span className="text-sm text-muted-foreground">/{fmt(data.clients.total)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(data.clients.inOnboarding)} em onboarding · {fmt(data.clients.churned)} churn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">MRR Carteira</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(data.clients.mrr)}</div>
            <p className="text-xs text-muted-foreground">Contratos ativos: {brl(data.contracts.mrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4" />On-Time Rate</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={onTimeVariant(data.obligations.onTimeRate)} className="text-base">{pct(data.obligations.onTimeRate)}</Badge>
            <p className="text-xs text-muted-foreground mt-1">{fmt(data.obligations.paid)} pagas · {fmt(data.obligations.overdue)} atrasadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Obrigações Atrasadas</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.obligations.overdue > 0 ? "text-destructive" : ""}`}>{fmt(data.obligations.overdue)}</div>
            <p className="text-xs text-muted-foreground">{brl(data.obligations.amountOverdue)} em débito</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Vencem em 30d</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{fmt(data.obligations.dueSoon)}</div>
            <p className="text-xs text-muted-foreground">{brl(data.obligations.amountDueSoon)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Docs Pendentes</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.documents.pending)}</div>
            <p className="text-xs text-muted-foreground">SLA médio {data.documents.avgReviewDays.toFixed(1)}d</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" />Tarefas Abertas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(data.tasks.open)}</div>
            <p className="text-xs text-muted-foreground">{fmt(data.tasks.overdue)} atrasadas · {fmt(data.tasks.highPriority)} alta prio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />Caixa do Office</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.office.net >= 0 ? "text-emerald-600" : "text-destructive"}`}>{brl(data.office.net)}</div>
            <p className="text-xs text-muted-foreground">A receber {brl(data.office.toReceive)} · A pagar {brl(data.office.toPay)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Obrigações por Tipo</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Pagas</th>
                    <th className="text-right">Atrasadas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.obligations.byType.map((t) => (
                    <tr key={t.type} className="border-b last:border-0">
                      <td className="py-2 font-medium">{t.type}</td>
                      <td className="text-right">{fmt(t.total)}</td>
                      <td className="text-right text-emerald-600">{fmt(t.paid)}</td>
                      <td className={`text-right ${t.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}>{fmt(t.overdue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Regime Tributário</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {data.clients.byRegime.map((r) => (
                  <tr key={r.regime} className="border-b last:border-0">
                    <td className="py-2 capitalize">{r.regime}</td>
                    <td className="text-right">{fmt(r.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Jornadas IRPF</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Em andamento</span><span className="font-medium">{fmt(data.irpf.active)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Concluídas</span><span className="font-medium text-emerald-600">{fmt(data.irpf.done)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">A restituir</span><span className="font-medium">{fmt(data.irpf.restituir)} · {brl(data.irpf.restituirTotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">A pagar</span><span className="font-medium text-amber-600">{fmt(data.irpf.pagar)} · {brl(data.irpf.pagarTotal)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Honorários</span><span className="font-medium">{brl(data.irpf.feePaid)}<span className="text-xs text-muted-foreground">/{brl(data.irpf.feeTotal)}</span></span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Lembretes</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{fmt(data.reminders.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Enviados</span><span className="font-medium text-emerald-600">{fmt(data.reminders.sent)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pendentes</span><span className="font-medium">{fmt(data.reminders.pending)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Falhas</span><span className={`font-medium ${data.reminders.failed > 0 ? "text-destructive" : ""}`}>{fmt(data.reminders.failed)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSignature className="h-4 w-4" />Contratos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{fmt(data.contracts.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ativos</span><span className="font-medium text-emerald-600">{fmt(data.contracts.active)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vencem em 30d</span><span className={`font-medium ${data.contracts.expiring30d > 0 ? "text-amber-600" : ""}`}>{fmt(data.contracts.expiring30d)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">MRR contratado</span><span className="font-medium">{brl(data.contracts.mrr)}</span></div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
