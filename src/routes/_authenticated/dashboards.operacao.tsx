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
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCurrentUser } from "@/hooks/use-current-user";

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

function OperacaoPage() {
  const { data: me } = useCurrentUser();
  const isSuper = !!me?.isSuperAdmin;
  const [tab, setTab] = useState(isSuper ? "super" : "empresa");
  return (
    <div className="space-y-6">
      <PageHeader title="Operação Core" description="Visão consolidada das Fases 1-5: receita, repasses, compliance, identidade, WhatsApp e nota fiscal." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {isSuper && <TabsTrigger value="super">Super Admin</TabsTrigger>}
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          {isSuper && <TabsTrigger value="contador">Contador</TabsTrigger>}
        </TabsList>
        {isSuper && <TabsContent value="super" className="mt-6"><SuperAdminTab /></TabsContent>}
        <TabsContent value="empresa" className="mt-6"><EmpresaTab /></TabsContent>
        {isSuper && <TabsContent value="contador" className="mt-6"><ContadorTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
