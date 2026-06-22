import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getOperationsSummary } from "@/lib/riomed-operations.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Users, Package, FileText, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/operacoes")({
  head: () => ({ meta: [{ title: "RioMed — Operações · Impulsionando" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='operations' title='Operações RioMed'><Page /></TenantModuleShell>),
});

function Page() {
  const fn = useServerFn(getOperationsSummary);
  const { data, isLoading } = useQuery({ queryKey: ["riomed-ops"], queryFn: () => fn() });
  if (isLoading) return <div className="p-6">Carregando…</div>;
  const d = data!;
  const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BOB" }).format(v ?? 0);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Operações — Rio Med</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada de OS, técnicos, locação e indicadores operacionais.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Wrench className="h-4 w-4" />} label="OS abertas" value={(d.os.byStatus.open ?? 0) + (d.os.byStatus.in_progress ?? 0)} />
        <Kpi icon={<AlertTriangle className="h-4 w-4 text-destructive" />} label="SLA vencido" value={d.os.slaOverdue} accent="destructive" />
        <Kpi icon={<Users className="h-4 w-4" />} label="Técnicos disp." value={`${d.techs.available}/${d.techs.total}`} />
        <Kpi icon={<Package className="h-4 w-4" />} label="Util. locação" value={`${d.rental.utilization}%`} />
        <Kpi icon={<FileText className="h-4 w-4" />} label="Contratos ativos" value={d.rental.activeContracts} />
        <Kpi label="Receita OS" value={money(d.os.revenue)} />
        <Kpi label="Receita locação" value={money(d.rental.revenue)} />
        <Kpi label="Ativos cadastrados" value={d.rental.assets} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>OS por status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(d.os.byStatus).map(([s, n]) => (
                <Badge key={s} variant="outline" className="text-sm">{s}: {n as number}</Badge>
              ))}
              {Object.keys(d.os.byStatus).length === 0 && <span className="text-muted-foreground text-sm">Sem OS</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Carga por técnico</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Técnico</TableHead><TableHead className="text-right">OS</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.techs.workload.slice(0, 8).map((w) => (
                  <TableRow key={w.technicianId}><TableCell>{w.name}</TableCell><TableCell className="text-right">{w.count}</TableCell></TableRow>
                ))}
                {d.techs.workload.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Sem atribuições</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>OS recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Status</TableHead><TableHead>Prio.</TableHead><TableHead>Abertura</TableHead><TableHead>SLA</TableHead><TableHead className="text-right">Custo</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {d.recentOs.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell><Badge variant={o.status === "closed" ? "default" : o.status === "open" ? "secondary" : "outline"}>{o.status}</Badge></TableCell>
                  <TableCell>{o.priority}</TableCell>
                  <TableCell className="text-xs">{new Date(o.opened_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">{o.sla_due_at ? new Date(o.sla_due_at).toLocaleString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-right">{money(Number(o.total_cost ?? 0))}</TableCell>
                </TableRow>
              ))}
              {d.recentOs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem OS</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contratos de locação recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nº</TableHead><TableHead>Cliente</TableHead><TableHead>Período</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {d.recentContracts.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.contract_number}</TableCell>
                  <TableCell>{c.customer_name}</TableCell>
                  <TableCell className="text-xs">{c.start_date} → {c.end_date ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                  <TableCell className="text-right">{money(Number(c.total_amount ?? 0))}</TableCell>
                </TableRow>
              ))}
              {d.recentContracts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem contratos</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon?: React.ReactNode; label: string; value: React.ReactNode; accent?: "destructive" }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-2 text-muted-foreground">{icon}{label}</CardTitle></CardHeader>
      <CardContent><div className={`text-2xl font-bold ${accent === "destructive" ? "text-destructive" : ""}`}>{value}</div></CardContent>
    </Card>
  );
}
