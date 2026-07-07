import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, ExternalLink, FileText, ShieldAlert, Webhook, Workflow } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadTenantAutomations } from "@/lib/tenant-automations.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/automacoes")({
  head: () => ({ meta: [{ title: "Automações do Cliente — Impulsionando" }] }),
  component: TenantAutomationsTab,
});

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  const v = s.toLowerCase();
  if (v === "success" || v === "completed" || v === "ok") return "default";
  if (v === "failed" || v === "error") return "destructive";
  if (v === "pending" || v === "running") return "secondary";
  return "outline";
}

function TenantAutomationsTab() {
  const { slug } = Route.useParams();
  const [workflow, setWorkflow] = useState<string>("all");
  const fetchFn = useServerFn(loadTenantAutomations);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["tenant-automations", slug, workflow],
    queryFn: () =>
      fetchFn({ data: { slug, workflow: workflow === "all" ? undefined : workflow } }),
    staleTime: 30_000,
  });

  const scopedSearch = { tenant: slug } as const;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5" /> Automação & N8N
          </h2>
          <p className="text-sm text-muted-foreground">
            Execuções de workflows escopadas ao tenant <code>{slug}</code>. Modo{" "}
            <Badge variant="outline" className="text-[10px] align-middle">demo</Badge> por padrão —
            disparos reais exigem aprovação backend.
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
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-muted-foreground">Filtrar por fluxo:</div>
              <Select value={workflow} onValueChange={setWorkflow}>
                <SelectTrigger className="w-64 h-8 text-xs">
                  <SelectValue placeholder="Todos os fluxos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fluxos</SelectItem>
                  {data.workflows.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFetching ? (
                <span className="text-[11px] text-muted-foreground">Atualizando…</span>
              ) : null}
              <Link
                to="/core/automacao/logs"
                search={scopedSearch}
                className="ml-auto text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Abrir painel completo <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {data.logs.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhuma execução registrada para este tenant
                {workflow !== "all" ? <> no fluxo <code>{workflow}</code></> : null}.
                <div className="mt-2 text-xs">
                  Em modo demo, execuções reais só aparecem quando o webhook{" "}
                  <code>/api/public/hooks/n8n-log</code> for chamado com{" "}
                  <code>tenant_id</code> correspondente.
                </div>
              </div>
            ) : (
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
                        </td>
                        <td className="py-1.5 pr-3">
                          <div className="font-medium">{l.workflow_name}</div>
                          {l.regua ? (
                            <div className="text-[10px] text-muted-foreground">{l.regua}</div>
                          ) : null}
                        </td>
                        <td className="py-1.5 pr-3">
                          <div>{l.event_name ?? "—"}</div>
                          {l.step ? (
                            <div className="text-[10px] text-muted-foreground">{l.step}</div>
                          ) : null}
                        </td>
                        <td className="py-1.5 pr-3">{l.channel ?? "—"}</td>
                        <td className="py-1.5 pr-3">
                          <Badge variant={statusVariant(l.status)} className="text-[10px]">
                            {l.status}
                          </Badge>
                          {l.error ? (
                            <div
                              className="text-[10px] text-destructive mt-0.5 max-w-[240px] truncate"
                              title={l.error}
                            >
                              {l.error}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-1.5 pr-3 font-mono text-[11px]">
                          {l.http_status ?? "—"}
                        </td>
                        <td className="py-1.5 pr-3 font-mono text-[11px]">
                          {l.latency_ms != null ? `${l.latency_ms}ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <p className="text-[11px] text-muted-foreground">
            Ações de ativação/teste de fluxos permanecem bloqueadas no frontend e exigem aprovação
            backend conforme <code>docs/n8n/plano-producao.md</code>.
          </p>
        </>
      )}
    </div>
  );
}
