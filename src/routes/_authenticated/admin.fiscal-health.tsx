import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getFiscalHealth } from "@/lib/fiscal-health.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, RefreshCw, AlertTriangle, CheckCircle2, Clock, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/fiscal-health")({
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

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

function Page() {
  const fn = useServerFn(getFiscalHealth);
  const [days, setDays] = useState(30);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "fiscal-health", days],
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
  const k = data.kpis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Fiscal & NF-e Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Saúde da emissão fiscal — NFS-e, rejeições, retries, eventos do provedor e relatórios.
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Aprovação</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pct(k.approvalRate)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.issued)} de {fmt(k.total)} NFs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />Rejeições</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.rejectionRate >= 5 ? "text-destructive" : ""}`}>{fmt(k.rejected)}</div>
            <p className="text-xs text-muted-foreground">{pct(k.rejectionRate)} do total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Pendentes</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.stalePending > 0 ? "text-amber-600" : ""}`}>{fmt(k.pending)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.stalePending)} &gt; 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Retries &ge; 3</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.retriesHigh > 0 ? "text-destructive" : ""}`}>{fmt(k.retriesHigh)}</div>
            <p className="text-xs text-muted-foreground">NFs em loop de falha</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Emitida</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(k.issuedRevenue)}</div>
            <p className="text-xs text-muted-foreground">ISS {brl(k.issTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Receita Perdida</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${k.lostRevenue > 0 ? "text-destructive" : ""}`}>{brl(k.lostRevenue)}</div>
            <p className="text-xs text-muted-foreground">{fmt(k.cancelled)} canceladas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tempo Médio de Emissão</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.avgIssueMinutes.toFixed(1)} min</div>
            <p className="text-xs text-muted-foreground">created → issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Emissores</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(k.activeIssuers)}<span className="text-sm text-muted-foreground">/{fmt(k.totalIssuers)}</span></div>
            <p className="text-xs text-muted-foreground">{fmt(k.homologIssuers)} em homologação</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Status das NFS-e</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr><th className="text-left py-2">Status</th><th className="text-right">Qtd</th><th className="text-right">Valor</th></tr>
              </thead>
              <tbody>
                {data.statusBreakdown.map((s) => (
                  <tr key={s.status} className="border-b last:border-0">
                    <td className="py-2 capitalize">{s.status}</td>
                    <td className="text-right">{fmt(s.count)}</td>
                    <td className="text-right">{brl(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Eventos do Provedor</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr><th className="text-left py-2">Evento</th><th className="text-right">Qtd</th></tr>
              </thead>
              <tbody>
                {data.eventBreakdown.map((e) => (
                  <tr key={e.event_type} className="border-b last:border-0">
                    <td className="py-2">{e.event_type}</td>
                    <td className="text-right">{fmt(e.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Top Mensagens de Rejeição
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topRejections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem rejeições no período. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {data.topRejections.map((r, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <Badge variant="destructive" className="shrink-0">{r.count}×</Badge>
                  <span className="text-muted-foreground">{r.message}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking de Emissores</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Emissor</th>
                  <th className="text-left">Provedor / Amb.</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Emitidas</th>
                  <th className="text-right">Rejeitadas</th>
                  <th className="text-right">Pend.</th>
                  <th className="text-right">Receita</th>
                  <th className="text-right">Aprov.</th>
                </tr>
              </thead>
              <tbody>
                {data.issuerRanking.map((r) => (
                  <tr key={r.issuerId} className="border-b last:border-0">
                    <td className="py-2 font-medium">{r.name}<div className="text-xs text-muted-foreground">{r.cnpj}</div></td>
                    <td><span className="text-xs">{r.provider ?? "—"}</span><div className="text-xs text-muted-foreground">{r.environment ?? "—"}</div></td>
                    <td className="text-right">{fmt(r.total)}</td>
                    <td className="text-right text-emerald-600">{fmt(r.issued)}</td>
                    <td className="text-right text-destructive">{fmt(r.rejected)}</td>
                    <td className="text-right">{fmt(r.pending)}</td>
                    <td className="text-right">{brl(r.revenue)}</td>
                    <td className="text-right">
                      <Badge variant={r.approvalRate >= 95 ? "default" : r.approvalRate >= 85 ? "secondary" : "destructive"}>
                        {pct(r.approvalRate)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Disparos de Relatórios Fiscais ({fmt(k.emailSent)} ok · {fmt(k.emailFailed)} falhas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentEmails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum disparo no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left">Competência</th>
                  <th className="text-left">Destinatário</th>
                  <th className="text-left">Modo</th>
                  <th className="text-right">Tentativa</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEmails.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                    <td>{String(e.month).padStart(2, "0")}/{e.year}</td>
                    <td className="text-xs">{e.recipient}</td>
                    <td className="text-xs">{e.email_mode ?? "—"}</td>
                    <td className="text-right">{e.attempt ?? 1}</td>
                    <td className="text-right">
                      <Badge variant={["sent", "ok", "delivered"].includes((e.status ?? "").toLowerCase()) ? "default" : "destructive"}>
                        {e.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Janela: últimos {data.window.days} dias • Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
