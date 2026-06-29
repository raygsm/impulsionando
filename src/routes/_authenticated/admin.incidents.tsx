import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listIncidents,
  resolveIncident,
  createIncident,
  listIncidentUpdates,
  addIncidentUpdate,
} from "@/lib/incidents-admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents — Admin" },
      { name: "description", content: "Painel de incidentes do core Impulsionando (uptime, N8N, runtime)." },
    ],
  }),
  component: IncidentsPage,
});

const SEV_TONE: Record<string, string> = {
  sev1: "bg-red-600 text-white",
  sev2: "bg-orange-500 text-white",
  sev3: "bg-yellow-500 text-black",
  sev4: "bg-blue-500 text-white",
};

function IncidentsPage() {
  const list = useServerFn(listIncidents);
  const resolve = useServerFn(resolveIncident);
  const qc = useQueryClient();
  const [source, setSource] = useState<string>("all");
  const [status, setStatus] = useState<string>("open");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "incidents", source, status],
    queryFn: () => list({ data: { source: source === "all" ? undefined : source, status: status === "all" ? undefined : status, limit: 200 } }),
  });

  const mResolve = useMutation({
    mutationFn: (id: string) => resolve({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "incidents"] });
      toast.success("Incidente resolvido");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao resolver"),
  });

  const incidents = (data?.incidents ?? []) as any[];
  const summary = data?.summary;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
        <p className="text-muted-foreground mt-1">
          Eventos persistidos em <code className="text-xs">core_incidents</code> — uptime, N8N (status=failed), runtime.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total no filtro" value={summary?.total ?? 0} />
        <Kpi label="Abertos" value={summary?.open ?? 0} tone="alert" />
        <Kpi label="Fontes distintas" value={Object.keys(summary?.bySource ?? {}).length} />
        <Kpi label="N8N" value={summary?.bySource?.n8n ?? 0} />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Fonte" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            <SelectItem value="n8n">N8N</SelectItem>
            <SelectItem value="uptime">Uptime</SelectItem>
            <SelectItem value="runtime">Runtime</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="acknowledged">Reconhecidos</SelectItem>
            <SelectItem value="resolved">Resolvidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <Card>
        <CardHeader><CardTitle>Lista ({incidents.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {incidents.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Nenhum incidente para este filtro.</p>
          )}
          {incidents.map((i) => (
            <div key={i.id} className="flex gap-3 items-start py-3 border-b last:border-0 flex-wrap">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${SEV_TONE[i.severity] ?? "bg-muted"}`}>
                {i.severity.toUpperCase()}
              </span>
              <Badge variant="outline">{i.source}</Badge>
              <Badge variant={i.status === "open" ? "destructive" : "secondary"}>{i.status}</Badge>
              <div className="flex-1 min-w-[260px]">
                <div className="font-medium">{i.title}</div>
                {i.description && <div className="text-xs text-muted-foreground mt-1">{i.description}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(i.detected_at).toLocaleString("pt-BR")}
                  {i.event_count > 1 && <> · <strong>{i.event_count}× ocorrências</strong></>}
                  {i.runtime_scope && <> · <code>{i.runtime_scope}</code></>}
                </div>
              </div>
              {i.status === "open" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mResolve.mutate(i.id)}
                  disabled={mResolve.isPending}
                >
                  Resolver
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div>
        <div className={`text-3xl font-bold mt-1 ${tone === "alert" ? "text-red-600" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
