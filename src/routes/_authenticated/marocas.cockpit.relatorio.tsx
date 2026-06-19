import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listMarocasServices,
  listMarocasAuditByPeriod,
  MAROCAS_SLA_MINUTES,
} from "@/lib/marocas.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Printer, ArrowLeft, FileText, Calendar, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/marocas/cockpit/relatorio")({
  head: () => ({ meta: [{ title: "Marocas — Relatório Operacional" }] }),
  component: MarocasReportPage,
});

const dtFmt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
const dFmt = (d: Date) => d.toLocaleDateString("pt-BR");
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function slaFor(svc: { service_type: string; status: string; started_at?: string | null; completed_at?: string | null; scheduled_for: string }) {
  const sla = MAROCAS_SLA_MINUTES[svc.service_type] ?? 60;
  const now = Date.now();
  if (svc.status === "concluido" && svc.started_at && svc.completed_at) {
    const e = (new Date(svc.completed_at).getTime() - new Date(svc.started_at).getTime()) / 60000;
    return { sla, elapsed: Math.round(e), late: e > sla };
  }
  if (svc.status === "em_andamento" && svc.started_at) {
    const e = (now - new Date(svc.started_at).getTime()) / 60000;
    return { sla, elapsed: Math.round(e), late: e > sla };
  }
  if (svc.status === "agendado") {
    return { sla, elapsed: 0, late: now > new Date(svc.scheduled_for).getTime() };
  }
  return { sla, elapsed: 0, late: false };
}

function MarocasReportPage() {
  const services = useServerFn(listMarocasServices);
  const svcQ = useQuery({ queryKey: ["marocas", "services", "report"], queryFn: () => services({ data: {} }) });

  const today = new Date();
  const firstOfWeek = new Date(today); firstOfWeek.setDate(today.getDate() - today.getDay());
  const [mode, setMode] = useState<"dia" | "semana" | "custom">("dia");
  const [from, setFrom] = useState<string>(isoDay(today));
  const [to, setTo] = useState<string>(isoDay(today));

  // Calcula intervalo conforme o modo
  const range = useMemo(() => {
    if (mode === "dia") {
      const start = new Date(from + "T00:00:00");
      const end = new Date(from + "T23:59:59");
      return { start, end };
    }
    if (mode === "semana") {
      const start = new Date(from + "T00:00:00");
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59);
      return { start, end };
    }
    return {
      start: new Date(from + "T00:00:00"),
      end: new Date(to + "T23:59:59"),
    };
  }, [mode, from, to]);

  const filtered = useMemo(() => {
    return (svcQ.data ?? []).filter((s) => {
      const t = new Date(s.scheduled_for).getTime();
      return t >= range.start.getTime() && t <= range.end.getTime();
    }).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());
  }, [svcQ.data, range]);

  const stats = useMemo(() => {
    let totalSla = 0, lateCount = 0, doneCount = 0;
    filtered.forEach((s) => {
      const i = slaFor(s as any);
      totalSla += 1;
      if (i.late && s.status !== "concluido") lateCount++;
      if (s.status === "concluido") doneCount++;
    });
    return { total: totalSla, lateCount, doneCount, slaPct: totalSla ? Math.round((1 - lateCount / totalSla) * 100) : 100 };
  }, [filtered]);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden border-b bg-card">
        <div className="max-w-5xl mx-auto p-4 flex items-center gap-3 flex-wrap">
          <Link to="/marocas/cockpit" className="inline-flex items-center gap-1 text-sm hover:underline">
            <ArrowLeft className="h-4 w-4" /> Voltar ao cockpit
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Relatório operacional Marocas
          </h1>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => exportAudit("csv")}>
              <Download className="h-4 w-4 mr-1" /> Auditoria CSV
            </Button>
            <Button variant="outline" onClick={() => exportAudit("json")}>
              <Download className="h-4 w-4 mr-1" /> Auditoria JSON
            </Button>
            <Button onClick={handlePrint} className="bg-gradient-to-r from-primary to-fuchsia-500">
              <Printer className="h-4 w-4 mr-1" /> Exportar PDF
            </Button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto p-4 pt-0">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList>
              <TabsTrigger value="dia"><Calendar className="h-3 w-3 mr-1" /> Diário</TabsTrigger>
              <TabsTrigger value="semana">Semanal</TabsTrigger>
              <TabsTrigger value="custom">Personalizado</TabsTrigger>
            </TabsList>
            <TabsContent value="dia" className="flex items-center gap-2 mt-3">
              <label className="text-sm">Data</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            </TabsContent>
            <TabsContent value="semana" className="flex items-center gap-2 mt-3">
              <label className="text-sm">Início (domingo recomendado)</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
            </TabsContent>
            <TabsContent value="custom" className="flex items-center gap-2 mt-3 flex-wrap">
              <label className="text-sm">De</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
              <label className="text-sm">Até</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6 print:p-4 print:max-w-none">
        <header className="border-b pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black">Marocas — Operação de Temporada</h2>
              <p className="text-sm text-muted-foreground">
                Período: <strong>{dFmt(range.start)}</strong> até <strong>{dFmt(range.end)}</strong> · Emitido em {dtFmt(new Date().toISOString())}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold uppercase tracking-wider">Impulsionando Tecnologia</p>
              <p className="text-muted-foreground">CORE Impulsionando · cliente Marocas</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4"><div className="text-xs text-muted-foreground">Total de serviços</div><div className="text-3xl font-bold">{stats.total}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Concluídos</div><div className="text-3xl font-bold text-emerald-600">{stats.doneCount}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">Atrasados</div><div className="text-3xl font-bold text-rose-600">{stats.lateCount}</div></Card>
          <Card className="p-4"><div className="text-xs text-muted-foreground">SLA cumprido</div><div className="text-3xl font-bold">{stats.slaPct}%</div></Card>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2">Detalhamento dos serviços</h3>
          {svcQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhum serviço no período.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Horário</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Apartamento</th>
                  <th className="p-2">Prestador</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">SLA</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const i = slaFor(s as any);
                  return (
                    <tr key={s.id} className="border-b">
                      <td className="p-2 tabular-nums">{dtFmt(s.scheduled_for)}</td>
                      <td className="p-2">{s.service_type}</td>
                      <td className="p-2">{(s as any).marocas_apartments?.code ?? "—"}</td>
                      <td className="p-2">{(s as any).marocas_professionals?.full_name ?? "—"}</td>
                      <td className="p-2"><Badge variant="outline">{s.status}</Badge></td>
                      <td className="p-2">
                        {i.late ? <span className="text-rose-600 font-bold">Atrasado ({i.elapsed}/{i.sla}min)</span> : <span>{i.elapsed}/{i.sla}min</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <footer className="border-t pt-3 text-xs text-muted-foreground print:fixed print:bottom-2 print:left-0 print:right-0 print:text-center">
          Relatório gerado automaticamente pelo cockpit Marocas — CORE Impulsionando.
        </footer>
      </div>
    </div>
  );
}
