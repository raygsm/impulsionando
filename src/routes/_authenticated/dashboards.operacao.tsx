import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCard } from "@/components/insights/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { fetchOperationsSnapshot } from "@/lib/operations-snapshot.functions";
import { fetchMarketplaceGmvSummary } from "@/lib/marketplace-intermediation.functions";
import { fetchSloDashboard, resolveIncidentFn } from "@/lib/slo-observability.functions";
import { fetchFunnelTelemetry } from "@/lib/funnel-telemetry.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCurrentUser } from "@/hooks/use-current-user";

function FunnelTab() {
  const fn = useServerFn(fetchFunnelTelemetry);
  const { data, isLoading, error } = useQuery({
    queryKey: ["funnel-telemetry"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  if (isLoading || !data) return <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>;
  if (error) return <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>;
  const d = data as any;
  const totals = d.stats.reduce((a: any, r: any) => ({
    total: a.total + (r.total ?? 0),
    sent: a.sent + (r.sent ?? 0),
    failed: a.failed + (r.failed ?? 0),
    queued: a.queued + (r.queued ?? 0),
  }), { total: 0, sent: 0, failed: 0, queued: 0 });
  const delivery = totals.sent + totals.failed > 0 ? ((100 * totals.sent) / (totals.sent + totals.failed)).toFixed(2) : "—";
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Disparos (30d)" value={totals.total} />
        <KpiCard label="Entregues" value={totals.sent} hint={`Taxa ${delivery}%`} />
        <KpiCard label="Falhas" value={totals.failed} />
        <KpiCard label="Em fila" value={totals.queued} />
      </div>
      <Card className="p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Conversão por nicho (90d)</h3>
        {d.conversion.length === 0 ? <p className="text-xs text-muted-foreground">Sem dados ainda.</p> : (
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr>
              <th className="py-1">Nicho</th><th className="text-right">Capture</th><th className="text-right">Convert</th><th className="text-right">Relate</th><th className="text-right">Retain</th><th className="text-right">Expand</th><th className="text-right">C→Cv</th><th className="text-right">Cv→Rt</th>
            </tr></thead>
            <tbody>
              {d.conversion.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1.5 font-mono">{r.niche_slug}</td>
                  <td className="text-right">{r.capture}</td>
                  <td className="text-right">{r.convert}</td>
                  <td className="text-right">{r.relate}</td>
                  <td className="text-right">{r.retain}</td>
                  <td className="text-right">{r.expand}</td>
                  <td className="text-right font-mono">{r.capture_to_convert_pct ?? "—"}%</td>
                  <td className="text-right font-mono">{r.convert_to_retain_pct ?? "—"}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card className="p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Réguas N8N — entrega & latência (30d)</h3>
        {d.stats.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum disparo registrado.</p> : (
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr>
              <th className="py-1">Estágio</th><th>Nicho</th><th>Workflow</th>
              <th className="text-right">Total</th><th className="text-right">Sent</th><th className="text-right">Fail</th><th className="text-right">Entrega</th><th className="text-right">Latência (s)</th>
            </tr></thead>
            <tbody>
              {d.stats.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1.5"><Badge variant="outline">{r.stage}</Badge></td>
                  <td className="font-mono">{r.niche_slug}</td>
                  <td className="max-w-[220px] truncate">{r.workflow_name}</td>
                  <td className="text-right">{r.total}</td>
                  <td className="text-right">{r.sent}</td>
                  <td className="text-right">{r.failed}</td>
                  <td className="text-right font-mono">{r.delivery_rate_pct ?? "—"}%</td>
                  <td className="text-right font-mono">{r.avg_latency_seconds != null ? Number(r.avg_latency_seconds).toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Falhas recentes (7d)</h3>
        {d.failures.length === 0 ? <p className="text-xs text-muted-foreground">Sem falhas — tudo verde.</p> : (
          <ul className="space-y-1 text-xs">
            {d.failures.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between border-b py-1.5 gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <Badge variant="destructive">{f.stage}</Badge>
                  <span className="font-mono truncate">{f.workflow_name}</span>
                  <span className="text-muted-foreground truncate">{f.last_error}</span>
                </span>
                <span className="text-muted-foreground shrink-0">×{f.attempts} · {String(f.updated_at).slice(0,16).replace("T"," ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MarketplaceTab({ companyId }: { companyId?: string }) {
  const fn = useServerFn(fetchMarketplaceGmvSummary);
  const { data, isLoading, error } = useQuery({
    queryKey: ["mkt-gmv", companyId ?? "all"],
    queryFn: () => fn({ data: { companyId, months: 6 } }),
    staleTime: 60_000,
  });
  if (isLoading || !data) return <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>;
  if (error) return <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>;
  const d = data as any;
  const bpsLabel = d.totals.effectiveBps != null ? `${(d.totals.effectiveBps / 100).toFixed(2)}%` : "—";
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="GMV (6m)" value={d.totals.gmv} format="currency" />
        <KpiCard label="Taxa de Intermediação Digital" value={d.totals.fee} format="currency" hint={`Alíquota efetiva ${bpsLabel}`} />
        <KpiCard label="Engagements" value={d.totals.engagements} />
        <KpiCard label="Concluídos" value={d.totals.completed} />
      </div>
      <Card className="p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Histórico mensal por fornecedor</h3>
        {d.rows.length === 0 ? <p className="text-xs text-muted-foreground">Sem engagements no período.</p> : (
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-1">Mês</th><th>Fornecedor</th><th className="text-right">Engagements</th><th className="text-right">Concluídos</th><th className="text-right">GMV</th><th className="text-right">Taxa</th><th className="text-right">bps</th></tr>
            </thead>
            <tbody>
              {d.rows.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1.5 font-mono">{String(r.period_month).slice(0,7)}</td>
                  <td className="max-w-[220px] truncate">{r.company_name}</td>
                  <td className="text-right">{r.engagements_count}</td>
                  <td className="text-right">{r.completed_count}</td>
                  <td className="text-right">R$ {(Number(r.gmv_cents)/100).toFixed(2)}</td>
                  <td className="text-right">R$ {(Number(r.intermediation_fee_cents)/100).toFixed(2)}</td>
                  <td className="text-right font-mono">{r.effective_bps ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/dashboards/operacao")({
  head: () => ({ meta: [{ title: "Operação Core — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: OperacaoPage,
});

function ChipMap({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data ?? {});
  if (!entries.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <Badge key={k} variant="secondary" className="text-xs">{k}: <strong className="ml-1">{v}</strong></Badge>
      ))}
    </div>
  );
}

function SuperAdminTab() {
  const fn = useServerFn(fetchOperationsSnapshot);
  const { data, isLoading, error } = useQuery({
    queryKey: ["ops-snapshot", "super_admin"],
    queryFn: () => fn({ data: { scope: "super_admin" } }),
    staleTime: 60_000,
  });
  if (isLoading || !data) return <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>;
  if (error) return <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>;
  const d = data as any;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="GMV (30d)" value={d.revenue.totalGross} format="currency" />
        <KpiCard label="Taxa Intermediação (30d)" value={d.revenue.totalFee} format="currency" />
        <KpiCard label="Repasses líquidos (30d)" value={d.payouts.totalNet} format="currency" />
        <KpiCard label="NFs (30d)" value={d.fiscal.count} hint={`R$ ${d.fiscal.totalService.toFixed(2)} serviço`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Cálculos de Receita</h3>
          <ChipMap data={d.revenue.byStatus} />
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Repasses</h3>
          <ChipMap data={d.payouts.byStatus} />
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Notas Fiscais</h3>
          <ChipMap data={d.fiscal.byStatus} />
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Compliance</h3>
          <div className="text-xs text-muted-foreground">Total: <strong>{d.compliance.total}</strong> · Bloqueantes: <strong>{d.compliance.blocking}</strong></div>
          <ChipMap data={d.compliance.byScope} />
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">WhatsApp — roteamento</h3>
          <ChipMap data={d.whatsapp.byMode} />
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="text-sm font-semibold">Identidade dos tenants</h3>
          <div className="text-xs text-muted-foreground">DNS</div>
          <ChipMap data={d.identity.byDns} />
          <div className="text-xs text-muted-foreground mt-2">SSL</div>
          <ChipMap data={d.identity.bySsl} />
        </Card>
      </div>
    </div>
  );
}

function EmpresaTab() {
  const { companyId } = useActiveCompany();
  const fn = useServerFn(fetchOperationsSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["ops-snapshot", "empresa", companyId],
    enabled: !!companyId,
    queryFn: () => fn({ data: { scope: "empresa", companyId: companyId! } }),
    staleTime: 60_000,
  });
  if (!companyId) return <Card className="p-6 text-sm text-muted-foreground">Selecione uma empresa.</Card>;
  if (isLoading || !data) return <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>;
  const d = data as any;
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="GMV (30d)" value={d.revenue.totalGross} format="currency" />
        <KpiCard label="Taxa Impulsionando" value={d.revenue.totalFee} format="currency" />
        <KpiCard label="Repasses líquidos" value={d.payouts.totalNet} format="currency" />
        <KpiCard label="WhatsApp" value={0} hint={d.whatsapp.mode} />
      </div>
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Últimos repasses</h3>
        {d.payouts.recent.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum repasse no período.</p> : (
          <table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1">Período</th><th>Status</th><th className="text-right">Líquido</th><th className="text-right">Pago em</th></tr></thead>
            <tbody>
              {d.payouts.recent.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1.5">{r.period_start?.slice(0,10)} → {r.period_end?.slice(0,10)}</td>
                  <td><Badge variant="outline">{r.status}</Badge></td>
                  <td className="text-right">R$ {(r.net_cents/100).toFixed(2)}</td>
                  <td className="text-right text-muted-foreground">{r.paid_at?.slice(0,10) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Notas fiscais recebidas</h3>
        {d.fiscal.recent.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma NF emitida no período.</p> : (
          <table className="w-full text-xs">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1">Data</th><th>NF</th><th>Status</th><th className="text-right">Serviço</th></tr></thead>
            <tbody>
              {d.fiscal.recent.map((r: any) => (
                <tr key={r.created_at} className="border-t">
                  <td className="py-1.5">{r.created_at?.slice(0,10)}</td>
                  <td>{r.nf_number ?? `RPS ${r.rps_number ?? "—"}`}</td>
                  <td><Badge variant="outline">{r.status}</Badge></td>
                  <td className="text-right">R$ {Number(r.service_amount ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function ContadorTab() {
  const fn = useServerFn(fetchOperationsSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["ops-snapshot", "contador"],
    queryFn: () => fn({ data: { scope: "contador" } }),
    staleTime: 30_000,
  });
  if (isLoading || !data) return <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>;
  const d = data as any;
  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold">Emissor</h3>
        {d.issuer ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><div className="text-muted-foreground">Razão</div><div className="font-medium">{d.issuer.legal_name}</div></div>
            <div><div className="text-muted-foreground">CNPJ</div><div className="font-mono">{d.issuer.cnpj}</div></div>
            <div><div className="text-muted-foreground">Ambiente</div><Badge variant={d.issuer.environment === "production" ? "default" : "secondary"}>{d.issuer.environment}</Badge></div>
            <div><div className="text-muted-foreground">Provedor</div><div>{d.issuer.provider}</div></div>
            <div><div className="text-muted-foreground">RPS série</div><div className="font-mono">{d.issuer.rps_serie}</div></div>
            <div><div className="text-muted-foreground">Próximo RPS</div><div className="font-mono">{d.issuer.next_rps_number}</div></div>
          </div>
        ) : <p className="text-xs text-muted-foreground">Emissor não configurado.</p>}
      </Card>
      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold">Fila por status</h3>
        <ChipMap data={d.byStatus} />
      </Card>
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Fila fiscal (50 mais recentes)</h3>
        {d.queue.length === 0 ? <p className="text-xs text-muted-foreground">Sem notas na fila.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Criada</th><th>Beneficiário</th><th>RPS</th><th>NF</th><th>Status</th><th className="text-right">Serviço</th><th className="text-right">ISS</th></tr></thead>
              <tbody>
                {d.queue.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-1.5">{r.created_at?.slice(0,10)}</td>
                    <td className="max-w-[200px] truncate">{r.beneficiary_legal_name}</td>
                    <td className="font-mono">{r.rps_serie}/{r.rps_number}</td>
                    <td className="font-mono">{r.nf_number ?? "—"}</td>
                    <td><Badge variant="outline">{r.status}</Badge></td>
                    <td className="text-right">R$ {Number(r.service_amount ?? 0).toFixed(2)}</td>
                    <td className="text-right">R$ {Number(r.iss_amount ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold">Eventos fiscais recentes</h3>
        {d.events.length === 0 ? <p className="text-xs text-muted-foreground">Sem eventos.</p> : (
          <ul className="text-xs space-y-1">
            {d.events.slice(0, 15).map((e: any, i: number) => (
              <li key={i} className="flex justify-between border-b py-1"><span><Badge variant="secondary" className="mr-2">{e.event_type}</Badge><span className="font-mono text-muted-foreground">{e.invoice_id?.slice(0,8)}</span></span><span className="text-muted-foreground">{e.created_at?.slice(0,16).replace("T"," ")}</span></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SloTab() {
  const fn = useServerFn(fetchSloDashboard);
  const resolveFn = useServerFn(resolveIncidentFn);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["slo-dashboard"],
    queryFn: () => fn({ data: {} }),
    staleTime: 30_000,
  });
  if (isLoading || !data) return <Card className="p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</Card>;
  if (error) return <Card className="p-4 border-rose-200 bg-rose-50 text-rose-900 text-sm">{(error as Error).message}</Card>;
  const d = data as any;
  const fmtBps = (b: number | null) => (b == null ? "—" : `${(b / 100).toFixed(2)}%`);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Endpoints monitorados" value={d.summary.monitored} />
        <KpiCard label="Fora do ar agora" value={d.summary.down} hint={d.summary.down > 0 ? "atenção" : "tudo ok"} />
        <KpiCard label="Incidentes abertos" value={d.summary.openIncidents} />
        <KpiCard label="Sev1 abertos" value={d.summary.sev1Open} />
      </div>
      <Card className="p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Status por endpoint (24h / 7d)</h3>
        {d.status.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum endpoint sob monitoramento.</p> : (
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr>
              <th className="py-1">URL</th><th>Status</th>
              <th className="text-right">Disp 24h</th><th className="text-right">p95 (ms)</th>
              <th className="text-right">Disp 7d</th><th className="text-right">Budget restante</th><th className="text-right">Alvo</th>
            </tr></thead>
            <tbody>
              {d.status.map((r: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="py-1.5 max-w-[260px] truncate font-mono">{r.url}</td>
                  <td><Badge variant={r.currently_up ? "secondary" : "destructive"}>{r.currently_up ? "up" : `down (${r.consecutive_failures}x)`}</Badge></td>
                  <td className="text-right">{fmtBps(r.availability_bps_24h)}</td>
                  <td className="text-right font-mono">{r.p95_ms_24h ?? "—"}</td>
                  <td className="text-right">{fmtBps(r.availability_bps_7d)}</td>
                  <td className="text-right">{fmtBps(r.error_budget_bps_left_7d)}</td>
                  <td className="text-right text-muted-foreground">{fmtBps(r.availability_target_bps)} / {r.latency_p95_target_ms ?? "—"}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Incidentes recentes</h3>
        {d.incidents.length === 0 ? <p className="text-xs text-muted-foreground">Sem incidentes registrados.</p> : (
          <ul className="space-y-1 text-xs">
            {d.incidents.map((i: any) => (
              <li key={i.id} className="flex items-center justify-between border-b py-1.5 gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <Badge variant={i.severity === "sev1" ? "destructive" : "outline"}>{i.severity}</Badge>
                  <Badge variant={i.status === "resolved" ? "secondary" : "default"}>{i.status}</Badge>
                  <span className="truncate">{i.title}</span>
                </span>
                <span className="flex items-center gap-3 text-muted-foreground shrink-0">
                  <span>{String(i.detected_at).slice(0, 16).replace("T", " ")}</span>
                  <span>×{i.event_count}</span>
                  {i.status !== "resolved" && (
                    <button className="text-xs underline" onClick={async () => { await resolveFn({ data: { id: i.id } }); refetch(); }}>resolver</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function OperacaoPage() {
  const { data: me } = useCurrentUser();
  const { companyId: activeCompanyId } = useActiveCompany();
  const isSuper = !!me?.isSuperAdmin;
  const [tab, setTab] = useState(isSuper ? "super" : "empresa");
  return (
    <div className="space-y-6">
      <PageHeader title="Operação Core" description="Visão consolidada do core Impulsionando: receita, repasses, compliance, identidade, WhatsApp, NF, marketplace B2B e SLO." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {isSuper && <TabsTrigger value="super">Super Admin</TabsTrigger>}
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          {isSuper && <TabsTrigger value="contador">Contador</TabsTrigger>}
          {isSuper && <TabsTrigger value="slo">SLO</TabsTrigger>}
        </TabsList>
        {isSuper && <TabsContent value="super" className="mt-6"><SuperAdminTab /></TabsContent>}
        <TabsContent value="empresa" className="mt-6"><EmpresaTab /></TabsContent>
        <TabsContent value="marketplace" className="mt-6"><MarketplaceTab companyId={isSuper ? undefined : activeCompanyId ?? undefined} /></TabsContent>
        {isSuper && <TabsContent value="contador" className="mt-6"><ContadorTab /></TabsContent>}
        {isSuper && <TabsContent value="slo" className="mt-6"><SloTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
