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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground mt-1">
            Eventos persistidos em <code className="text-xs">core_incidents</code> — uptime, N8N, runtime e manuais.
          </p>
        </div>
        <NewIncidentDialog />
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
            <SelectItem value="manual">Manual</SelectItem>
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
            <SelectItem value="monitoring">Em monitoramento</SelectItem>
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
            <div key={i.id} className="py-3 border-b last:border-0">
              <div className="flex gap-3 items-start flex-wrap">
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
                <UpdatesDialog incidentId={i.id} title={i.title} />
                {i.status !== "resolved" && (
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
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function NewIncidentDialog() {
  const create = useServerFn(createIncident);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"sev1" | "sev2" | "sev3" | "sev4">("sev3");
  const [scope, setScope] = useState("global");
  const [url, setUrl] = useState("");

  const m = useMutation({
    mutationFn: () => create({ data: {
      title, description: description || undefined, severity, scope, url: url || undefined, source: "manual",
    } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "incidents"] });
      toast.success("Incidente criado");
      setOpen(false); setTitle(""); setDescription(""); setUrl(""); setSeverity("sev3"); setScope("global");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao criar"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>+ Novo incidente</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo incidente manual</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Título *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Severidade</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sev1">SEV1 — Crítico</SelectItem>
                  <SelectItem value="sev2">SEV2 — Alto</SelectItem>
                  <SelectItem value="sev3">SEV3 — Médio</SelectItem>
                  <SelectItem value="sev4">SEV4 — Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Escopo</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="uptime_url">URL específica</SelectItem>
                  <SelectItem value="runtime_scope">Runtime scope</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>URL afetada (opcional)</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !title}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdatesDialog({ incidentId, title }: { incidentId: string; title: string }) {
  const list = useServerFn(listIncidentUpdates);
  const add = useServerFn(addIncidentUpdate);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"investigating" | "identified" | "monitoring" | "resolved" | "update">("update");

  const { data } = useQuery({
    queryKey: ["admin", "incident-updates", incidentId],
    queryFn: () => list({ data: { incident_id: incidentId } }),
    enabled: open,
  });

  const m = useMutation({
    mutationFn: () => add({ data: { incident_id: incidentId, body, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "incident-updates", incidentId] });
      qc.invalidateQueries({ queryKey: ["admin", "incidents"] });
      toast.success("Atualização publicada");
      setBody(""); setStatus("update");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  const updates = (data?.updates ?? []) as any[];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="secondary">Atualizações</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Atualizações — {title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensagem pública (aparece em /status)" rows={3} />
            <div className="flex flex-col gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Investigando</SelectItem>
                  <SelectItem value="identified">Identificado</SelectItem>
                  <SelectItem value="monitoring">Monitorando</SelectItem>
                  <SelectItem value="update">Atualização</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => m.mutate()} disabled={m.isPending || !body.trim()}>Publicar</Button>
            </div>
          </div>
          <div className="border-t pt-3 max-h-80 overflow-y-auto space-y-2">
            {updates.length === 0 && <p className="text-sm text-muted-foreground">Sem atualizações.</p>}
            {updates.map((u) => (
              <div key={u.id} className="text-sm border-l-2 border-primary/40 pl-3 py-1">
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="text-[10px]">{u.status}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap">{u.body}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
