import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchImpulsionandoLeadsForStaff } from "@/lib/marketing-site.functions";
import { Download, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/marketing-leads")({
  head: () => ({ meta: [{ title: "Leads /marketing — Core Impulsionando" }] }),
  component: MarketingLeadsPage,
});

const SERVICES = [
  { slug: "", label: "Todos os serviços" },
  { slug: "agente-virtual", label: "Agente Virtual" },
  { slug: "social-media", label: "Social Media" },
  { slug: "google-ads", label: "Google Ads" },
  { slug: "assessoria-marketing", label: "Assessoria de Marketing" },
];

const STATUSES = [
  { v: "", l: "Todos os status" },
  { v: "new", l: "Novo" },
  { v: "working", l: "Em atendimento" },
  { v: "qualified", l: "Qualificado" },
  { v: "won", l: "Convertido" },
  { v: "lost", l: "Perdido" },
];

const PERIODS = [
  { v: 7, l: "7 dias" },
  { v: 30, l: "30 dias" },
  { v: 90, l: "90 dias" },
  { v: 365, l: "12 meses" },
];

function MarketingLeadsPage() {
  const [serviceSlug, setServiceSlug] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [daysBack, setDaysBack] = useState<number>(30);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["mkt-leads-staff", serviceSlug, status, daysBack],
    queryFn: () => fetchImpulsionandoLeadsForStaff({
      data: {
        serviceSlug: serviceSlug || undefined,
        status: status || undefined,
        daysBack,
      },
    }),
  });

  const exportCsv = useMutation({
    mutationFn: async () => {
      const rows = data?.leads ?? [];
      const header = ["created_at","name","email","phone","company","status","notes","page_url"];
      const csv = [header.join(";")].concat(
        rows.map((r) =>
          header.map((k) => `"${String((r as any)[k] ?? "").replace(/"/g, '""')}"`).join(";"),
        ),
      ).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `marketing-leads-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    },
  });

  const totalLeads = data?.leads.length ?? 0;
  const byService = data?.byService ?? {};
  const totalConv = data?.totalConv ?? 0;
  const convRate = totalLeads ? ((totalConv / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div>
      <PageHeader
        title="Leads — Impulsionando Brasil (/marketing)"
        description="Leads originados no site público da Impulsionando Brasil, com filtro por serviço, status e período."
        action={
          <Button onClick={() => exportCsv.mutate()} disabled={!totalLeads} variant="outline">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi label="Total leads" value={String(totalLeads)} />
        <Kpi label="Convertidos" value={String(totalConv)} />
        <Kpi label="Conversão" value={`${convRate}%`} />
        <Kpi label="Serviços ativos" value={String(Object.keys(byService).length)} />
      </div>

      <Card className="p-3 mb-4 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={serviceSlug || "all"} onValueChange={(v) => setServiceSlug(v === "all" ? "" : v)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SERVICES.map((s) => <SelectItem key={s.slug || "all"} value={s.slug || "all"}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s.v || "all"} value={s.v || "all"}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => <SelectItem key={p.v} value={String(p.v)}>{p.l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </Card>

      <Card className="p-4 mb-4">
        <div className="text-sm font-semibold mb-2">Distribuição por serviço</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(byService).map(([k, v]) => (
            <div key={k} className="border rounded-md p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
              <div className="mt-1 text-xl font-bold">{v.total}</div>
              <div className="text-xs text-muted-foreground">{v.conv} convertidos</div>
            </div>
          ))}
          {Object.keys(byService).length === 0 && (
            <div className="text-sm text-muted-foreground">Sem leads no período selecionado.</div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.leads ?? []).map((l) => {
              const m = (l.notes ?? "").match(/serviço:\s*([\w-]+)/);
              const svc = m?.[1] ?? "—";
              return (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{l.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{l.company ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{l.email}</div>
                    <div className="text-muted-foreground">{l.phone ?? "—"}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{svc}</Badge></TableCell>
                  <TableCell><Badge>{l.status}</Badge></TableCell>
                </TableRow>
              );
            })}
            {(data?.leads ?? []).length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum lead.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}
