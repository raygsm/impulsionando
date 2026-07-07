import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, FileText,
  Filter, PlayCircle, Rocket, ShieldAlert, Webhook, Workflow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { loadTenantAutomations } from "@/lib/tenant-automations.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/automacoes")({
  head: () => ({ meta: [{ title: "Automações do Cliente — Impulsionando" }] }),
  component: TenantAutomationsTab,
});

type Mode = "demo" | "producao";

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  const v = s.toLowerCase();
  if (v === "success" || v === "completed" || v === "ok") return "default";
  if (v === "failed" || v === "error") return "destructive";
  if (v === "pending" || v === "running") return "secondary";
  return "outline";
}

function TenantAutomationsTab() {
  const { slug } = Route.useParams();
  const fetchFn = useServerFn(loadTenantAutomations);

  const [mode, setMode] = useState<Mode>("demo");
  const [workflow, setWorkflow] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const queryKey = ["tenant-automations", slug, mode, workflow, channel, status, q, from, to, page];
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchFn({
        data: {
          slug, mode, page, pageSize,
          workflow: workflow === "all" ? undefined : workflow,
          channel: channel === "all" ? undefined : channel,
          status: status === "all" ? undefined : status,
          q: q.trim() || undefined,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
        },
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const scopedSearch = useMemo(() => ({ tenant: slug, mode }), [slug, mode]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const resetPage = (fn: () => void) => { fn(); setPage(1); };
  const clearFilters = () => resetPage(() => {
    setWorkflow("all"); setChannel("all"); setStatus("all"); setQ(""); setFrom(""); setTo("");
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5" /> Automação & N8N
          </h2>
          <p className="text-sm text-muted-foreground">
            Execuções escopadas ao tenant <code>{slug}</code>. Modo atual:{" "}
            <Badge variant={mode === "demo" ? "secondary" : "default"} className="text-[10px] align-middle">
              {mode === "demo" ? "demonstração" : "produção"}
            </Badge>{" "}
            — disparos reais exigem aprovação backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/core/automacao/fluxos" search={scopedSearch}>
              <Workflow className="h-3.5 w-3.5 mr-1" /> Fluxos
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/core/automacao/templates" search={scopedSearch}>
              <FileText className="h-3.5 w-3.5 mr-1" /> Templates
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/core/automacao/webhooks" search={scopedSearch}>
              <Webhook className="h-3.5 w-3.5 mr-1" /> Webhooks
            </Link>
          </Button>
        </div>
      </header>

      {/* Toggle de modo */}
      <div className="inline-flex rounded-md border p-0.5 text-xs">
        <button
          type="button"
          onClick={() => resetPage(() => setMode("demo"))}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded ${mode === "demo" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          <PlayCircle className="h-3.5 w-3.5" /> Demonstração
        </button>
        <button
          type="button"
          onClick={() => resetPage(() => setMode("producao"))}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded ${mode === "producao" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          <Rocket className="h-3.5 w-3.5" /> Produção
        </button>
      </div>

      {isLoading ? (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-32 w-full" />
        </Card>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falha ao carregar</AlertTitle>
          <AlertDescription>
            Não foi possível carregar as execuções deste tenant.{" "}
            <button onClick={() => refetch()} className="underline">Tentar novamente</button>
          </AlertDescription>
        </Alert>
      ) : !data?.authorized ? (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Não autorizado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para visualizar automações deste tenant. Requer staff Impulsionando
            ou papel <code>admin</code>.
          </AlertDescription>
        </Alert>
      ) : !data.company ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Tenant não encontrado</AlertTitle>
          <AlertDescription>
            O cliente <code>{slug}</code> não foi localizado. Verifique o subdomínio no cadastro.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {mode === "demo" ? (
            <Alert>
              <PlayCircle className="h-4 w-4" />
              <AlertTitle>Eventos simulados</AlertTitle>
              <AlertDescription className="text-xs">
                As execuções abaixo são simuladas e determinísticas por tenant. Nenhum canal (WhatsApp,
                e-mail, Impulsionito) é acionado. Para dados reais, alterne para{" "}
                <strong>Produção</strong> — a ativação de disparos permanece condicionada à aprovação
                backend.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card className="p-4 space-y-3">
            {/* Linha 1: busca + fluxo + canal + status */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_140px_140px] gap-2">
              <Input
                placeholder="Buscar por fluxo, evento, step ou erro…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="h-9 text-sm"
              />
              <Select value={workflow} onValueChange={(v) => resetPage(() => setWorkflow(v))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Fluxo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fluxos</SelectItem>
                  {data.workflows.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={channel} onValueChange={(v) => resetPage(() => setChannel(v))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  {data.channels.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => resetPage(() => setStatus(v))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {data.statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Linha 2: intervalo de datas */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Período:</span>
              <Input
                type="datetime-local"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                className="h-8 text-xs w-56"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="datetime-local"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                className="h-8 text-xs w-56"
              />
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 ml-auto">
                Limpar filtros
              </Button>
              <Link
                to="/core/automacao/logs"
                search={scopedSearch}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Painel completo <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {data.logs.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhuma execução encontrada para os filtros atuais.
                {mode === "producao" ? (
                  <div className="mt-2 text-xs">
                    Em produção, execuções só aparecem quando o webhook{" "}
                    <code>/api/public/hooks/n8n-log</code> for chamado com{" "}
                    <code>tenant_id</code> correspondente.
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground border-b">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Início</th>
                        <th className="py-2 pr-3 font-medium">Fluxo</th>
                        <th className="py-2 pr-3 font-medium">Evento</th>
                        <th className="py-2 pr-3 font-medium">Canal</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                        <th className="py-2 pr-3 font-medium">HTTP</th>
                        <th className="py-2 pr-3 font-medium">Latência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((l) => (
                        <tr key={l.id} className="border-b last:border-0 align-top">
                          <td className="py-1.5 pr-3 whitespace-nowrap font-mono text-[11px]">
                            {new Date(l.started_at).toLocaleString("pt-BR")}
                            {l.simulated ? (
                              <div className="text-[10px] text-muted-foreground">simulado</div>
                            ) : null}
                          </td>
                          <td className="py-1.5 pr-3">
                            <div className="font-medium">{l.workflow_name}</div>
                            {l.regua ? <div className="text-[10px] text-muted-foreground">{l.regua}</div> : null}
                          </td>
                          <td className="py-1.5 pr-3">
                            <div>{l.event_name ?? "—"}</div>
                            {l.step ? <div className="text-[10px] text-muted-foreground">{l.step}</div> : null}
                          </td>
                          <td className="py-1.5 pr-3">{l.channel ?? "—"}</td>
                          <td className="py-1.5 pr-3">
                            <Badge variant={statusVariant(l.status)} className="text-[10px]">{l.status}</Badge>
                            {l.error ? (
                              <div className="text-[10px] text-destructive mt-0.5 max-w-[240px] truncate" title={l.error}>
                                {l.error}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-1.5 pr-3 font-mono text-[11px]">{l.http_status ?? "—"}</td>
                          <td className="py-1.5 pr-3 font-mono text-[11px]">{l.latency_ms != null ? `${l.latency_ms}ms` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Paginação */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
                  <div className="text-muted-foreground">
                    {total} evento{total === 1 ? "" : "s"} · página {page} de {totalPages}
                    {isFetching ? <span className="ml-2">atualizando…</span> : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                    </Button>
                    <Button variant="outline" size="sm" className="h-7"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Próxima <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          <p className="text-[11px] text-muted-foreground">
            Ações de ativação e teste continuam bloqueadas no frontend — envio real só após aprovação
            backend (ver <code>docs/n8n/plano-producao.md</code>).
          </p>
        </>
      )}
    </div>
  );
}
