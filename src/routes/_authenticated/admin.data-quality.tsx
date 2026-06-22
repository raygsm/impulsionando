import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getDataQuality } from "@/lib/data-quality.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ShieldCheck, Copy as CopyIcon, RefreshCw, Database } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/data-quality")({
  component: DataQualityPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={() => { reset(); router.invalidate(); }} size="sm">Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function fmtNum(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  const color =
    tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function DataQualityPage() {
  const [days, setDays] = useState(90);
  const fetchFn = useServerFn(getDataQuality);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["data-quality", days],
    queryFn: () => fetchFn({ data: { days } }),
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const d = data;
  const dupTone: "ok" | "warn" | "bad" =
    d.duplicates.dupRate >= 5 ? "bad" : d.duplicates.dupRate >= 2 ? "warn" : "ok";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="h-6 w-6" /> Data Quality & Dedupe Health
          </h1>
          <p className="text-sm text-muted-foreground">
            Duplicidades, integridade referencial e saúde do mecanismo de dedupe — janela {d.windowDays}d.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="365">365 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Taxa de duplicidade" value={fmtPct(d.duplicates.dupRate)} tone={dupTone}
          hint={`${fmtNum(d.duplicates.totalDupRecords)} registros excedentes`} />
        <Kpi label="Marketing leads" value={fmtNum(d.counts.marketingLeads)} hint={`${d.duplicates.mlDupEmail} grupos dup. e-mail`} />
        <Kpi label="CRM leads" value={fmtNum(d.counts.crmLeads)} hint={`${d.duplicates.crmDupEmail + d.duplicates.crmDupPhone + d.duplicates.crmDupDoc} grupos dup.`} />
        <Kpi label="Customers" value={fmtNum(d.counts.customers)} hint={`${d.duplicates.custDupEmail + d.duplicates.custDupPhone + d.duplicates.custDupDoc} grupos dup.`} />
        <Kpi label="Leads sem origem" value={fmtNum(d.integrity.mlNoSource + d.integrity.crmNoSource)} tone="warn" />
        <Kpi label="Leads sem contato" value={fmtNum(d.integrity.mlNoContact + d.integrity.crmNoContact)} tone="warn" />
        <Kpi label="Customers órfãos" value={fmtNum(d.integrity.custOrphan)} tone={d.integrity.custOrphan > 0 ? "bad" : "ok"} />
        <Kpi label="Consumidores sem opt-in" value={fmtNum(d.integrity.consumerNoOptin)} tone="warn" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CopyIcon className="h-4 w-4" /> Duplicidades por escopo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Marketing — e-mail</div><div className="text-right tabular-nums">{d.duplicates.mlDupEmail}</div>
              <div className="text-muted-foreground">CRM — e-mail</div><div className="text-right tabular-nums">{d.duplicates.crmDupEmail}</div>
              <div className="text-muted-foreground">CRM — telefone</div><div className="text-right tabular-nums">{d.duplicates.crmDupPhone}</div>
              <div className="text-muted-foreground">CRM — documento</div><div className="text-right tabular-nums">{d.duplicates.crmDupDoc}</div>
              <div className="text-muted-foreground">Customers — e-mail</div><div className="text-right tabular-nums">{d.duplicates.custDupEmail}</div>
              <div className="text-muted-foreground">Customers — telefone</div><div className="text-right tabular-nums">{d.duplicates.custDupPhone}</div>
              <div className="text-muted-foreground">Customers — documento</div><div className="text-right tabular-nums">{d.duplicates.custDupDoc}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Dedupe Engine</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Thresholds configurados</span><span className="tabular-nums">{d.dedupeEngine.thresholds.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Eventos recentes</span><span className="tabular-nums">{d.dedupeEngine.recentEvents.length}</span></div>
            {d.dedupeEngine.lastEvent && (
              <div className="rounded border p-2 bg-muted/30">
                <div className="text-xs text-muted-foreground">Último evento</div>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant={d.dedupeEngine.lastEvent.state === "ok" ? "secondary" : "destructive"}>
                    {d.dedupeEngine.lastEvent.state}
                  </Badge>
                  <span className="tabular-nums">{d.dedupeEngine.lastEvent.dedupe_pct?.toFixed?.(2) ?? "—"}%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(d.dedupeEngine.lastEvent.created_at).toLocaleString("pt-BR")} · {d.dedupeEngine.lastEvent.samples ?? 0} amostras
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {Object.entries(d.dedupeEngine.stateCount).map(([s, c]) => (
                <div key={s} className="flex justify-between text-xs"><span className="text-muted-foreground">{s}</span><span className="tabular-nums">{c}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Top grupos duplicados</CardTitle></CardHeader>
        <CardContent>
          {d.topDuplicates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem duplicidades detectadas na janela.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr><th className="py-2">Escopo</th><th>Campo</th><th>Chave</th><th className="text-right">Ocorrências</th></tr>
                </thead>
                <tbody>
                  {d.topDuplicates.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2"><Badge variant="outline">{r.scope}</Badge></td>
                      <td>{r.field}</td>
                      <td className="font-mono text-xs truncate max-w-[420px]">{r.key}</td>
                      <td className="text-right tabular-nums font-medium">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
