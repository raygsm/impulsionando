import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Activity, AlertTriangle, CheckCircle2, Clock, FileSpreadsheet, FileText, RefreshCcw, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listWebhookRuns, webhookRunSummary, reprocessWebhookRun } from "@/lib/webhook-monitor.functions";
import { downloadCsv, downloadTablePdf } from "@/lib/exports";

export const Route = createFileRoute("/_authenticated/automacoes")({
  head: () => ({ meta: [{ title: "Automações & Webhooks — Impulsionando" }] }),
  component: AutomacoesPage,
});

const STATUS_COLOR: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  error: "bg-red-100 text-red-800 border-red-200",
  retry: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  running: "bg-sky-100 text-sky-800 border-sky-200",
};

function AutomacoesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const listFn = useServerFn(listWebhookRuns);
  const summFn = useServerFn(webhookRunSummary);
  const retryFn = useServerFn(reprocessWebhookRun);

  const summary = useQuery({ queryKey: ["wh-summary"], queryFn: () => summFn(), refetchInterval: 30_000 });
  const list = useQuery({
    queryKey: ["wh-list", status, search],
    queryFn: () => listFn({ data: { status: status === "all" ? undefined : status, workflow: search || undefined, limit: 500 } }),
    refetchInterval: 15_000,
  });

  const reprocess = useMutation({
    mutationFn: (id: string) => retryFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Reprocessamento enfileirado");
      qc.invalidateQueries({ queryKey: ["wh-list"] });
      qc.invalidateQueries({ queryKey: ["wh-summary"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao reprocessar"),
  });

  const rows = list.data ?? [];
  const exportRows = useMemo(
    () =>
      rows.map((r: any) => ({
        data: new Date(r.created_at).toLocaleString("pt-BR"),
        workflow: r.workflow,
        evento: r.event,
        status: r.status,
        tentativas: r.attempts,
        http: r.response_status ?? "",
        erro: r.last_error ?? "",
      })),
    [rows],
  );

  const Kpi = ({ icon: Icon, label, value, tone }: any) => (
    <Card className="p-4 flex items-center gap-3 shadow-card">
      <div className={`p-2 rounded-md ${tone}`}><Icon className="w-4 h-4" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value ?? 0}</div>
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Automações & Webhooks"
        description="Status, última execução, erros e reprocessamento manual de cada workflow."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Kpi icon={CheckCircle2} label="Sucesso (7d)"   value={summary.data?.success} tone="bg-emerald-100 text-emerald-700" />
        <Kpi icon={AlertTriangle} label="Erro (7d)"     value={summary.data?.error}   tone="bg-red-100 text-red-700" />
        <Kpi icon={RefreshCcw}    label="Retry (7d)"    value={summary.data?.retry}   tone="bg-amber-100 text-amber-700" />
        <Kpi icon={Clock}         label="Pendentes"     value={summary.data?.pending} tone="bg-slate-100 text-slate-700" />
        <Kpi icon={Activity}      label="Total (7d)"    value={summary.data?.total}   tone="bg-sky-100 text-sky-700" />
      </div>

      <Card className="p-4 mb-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <div className="text-xs text-muted-foreground mb-1">Workflow</div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input className="pl-7" placeholder="filtrar por nome…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="w-44">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="retry">Retry</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="running">Executando</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadCsv(
              `automacoes-${new Date().toISOString().slice(0,10)}.csv`,
              ["data","workflow","evento","status","tentativas","http","erro"], exportRows
            )}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" onClick={() => downloadTablePdf({
              filename: `automacoes-${new Date().toISOString().slice(0,10)}.pdf`,
              title: "Automações & Webhooks",
              subtitle: `${rows.length} execução(ões) · gerado em ${new Date().toLocaleString("pt-BR")}`,
              columns: [
                { key: "data", label: "Data", width: 110 },
                { key: "workflow", label: "Workflow" },
                { key: "evento", label: "Evento" },
                { key: "status", label: "Status", width: 70 },
                { key: "tentativas", label: "Tent.", width: 50, align: "right" },
                { key: "http", label: "HTTP", width: 60, align: "right" },
              ],
              rows: exportRows,
              footer: "Dados respeitam isolamento por empresa e perfil.",
            })}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Workflow / Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tent.</TableHead>
                <TableHead className="text-right">HTTP</TableHead>
                <TableHead>Erro</TableHead>
                <TableHead className="w-44 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!list.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sem execuções para o filtro.</TableCell></TableRow>}
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{r.workflow}</div>
                    <div className="text-xs text-muted-foreground">{r.event}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLOR[r.status] ?? ""}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{r.attempts}</TableCell>
                  <TableCell className="text-right text-xs">{r.response_status ?? "—"}</TableCell>
                  <TableCell className="text-xs text-red-600 max-w-[280px] truncate">{r.last_error ?? ""}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Sheet open={selected?.id === r.id} onOpenChange={(o) => setSelected(o ? r : null)}>
                      <SheetTrigger asChild><Button size="sm" variant="ghost">Logs</Button></SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl overflow-auto">
                        <SheetHeader><SheetTitle>{r.workflow} · {r.event}</SheetTitle></SheetHeader>
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-muted-foreground">Início:</span> {r.started_at ? new Date(r.started_at).toLocaleString("pt-BR") : "—"}</div>
                            <div><span className="text-muted-foreground">Fim:</span> {r.finished_at ? new Date(r.finished_at).toLocaleString("pt-BR") : "—"}</div>
                            <div><span className="text-muted-foreground">Tentativas:</span> {r.attempts}</div>
                            <div><span className="text-muted-foreground">Próxima:</span> {r.next_retry_at ? new Date(r.next_retry_at).toLocaleString("pt-BR") : "—"}</div>
                            <div className="col-span-2"><span className="text-muted-foreground">Destino:</span> {r.target_url ?? "—"}</div>
                          </div>
                          {r.last_error && (
                            <div>
                              <div className="font-medium mb-1 text-red-700">Erro</div>
                              <pre className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs overflow-auto max-h-48">{r.last_error}</pre>
                            </div>
                          )}
                          <div>
                            <div className="font-medium mb-1">Payload</div>
                            <pre className="bg-muted/40 p-3 rounded text-xs overflow-auto max-h-72">{JSON.stringify(r.request_payload ?? {}, null, 2)}</pre>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button size="sm" variant="outline" onClick={() => reprocess.mutate(r.id)} disabled={reprocess.isPending}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Reprocessar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
