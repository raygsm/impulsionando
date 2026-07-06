import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listDispatches, getDispatchTimeline, retryDispatch, cancelDispatch,
  listCommEvents, listCommTemplates, upsertCommTemplate,
  listChannelConfigs, upsertChannelConfig,
} from "@/lib/comm.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  RotateCw, Ban, RefreshCw, Bell, Mail, MessageSquare, Sparkles, Smartphone, Workflow,
  Filter, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/comunicacoes")({
  component: CommCenterPage,
  head: () => ({
    meta: [
      { title: "Centro de Comunicação — Impulsionando" },
      { name: "description", content: "Fila, histórico, templates e canais de comunicação do Core Impulsionando." },
    ],
  }),
});

const CHANNELS = ["whatsapp","email","impulsionito","notification","push","n8n"] as const;
type Channel = typeof CHANNELS[number];

const channelIcon: Record<Channel, JSX.Element> = {
  whatsapp: <MessageSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  impulsionito: <Sparkles className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
  push: <Smartphone className="h-4 w-4" />,
  n8n: <Workflow className="h-4 w-4" />,
};

const statusColor: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  sent: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  dead_letter: "bg-rose-200 text-rose-900",
  skipped: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-200 text-slate-500 line-through",
};

function CommCenterPage() {
  return (
    <div className="container mx-auto p-6 max-w-[1400px]">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Centro de Comunicação</h1>
        <p className="text-sm text-muted-foreground">
          Fila, histórico e configuração dos eventos comerciais do Core Impulsionando.
        </p>
      </header>
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Fila &amp; Histórico</TabsTrigger>
          <TabsTrigger value="events">Catálogo</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="channels">Canais por Tenant</TabsTrigger>
          <TabsTrigger value="integrations">Integração n8n</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-4"><QueueTab /></TabsContent>
        <TabsContent value="events" className="mt-4"><EventsTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
        <TabsContent value="channels" className="mt-4"><ChannelsTab /></TabsContent>
        <TabsContent value="integrations" className="mt-4"><IntegrationsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Queue tab
// -----------------------------------------------------------------------------
function QueueTab() {
  const qc = useQueryClient();
  const list = useServerFn(listDispatches);
  const retry = useServerFn(retryDispatch);
  const cancel = useServerFn(cancelDispatch);
  const [filters, setFilters] = useState<{ status: string; channel: string; eventCode: string }>({
    status: "", channel: "", eventCode: "",
  });
  const [selected, setSelected] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["comm-dispatches", filters],
    queryFn: () => list({ data: {
      status: filters.status || undefined,
      channel: filters.channel || undefined,
      eventCode: filters.eventCode || undefined,
      limit: 200,
    } }),
    refetchInterval: 15_000,
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retry({ data: { dispatchId: id } }),
    onSuccess: () => { toast.success("Reenfileirado"); qc.invalidateQueries({ queryKey: ["comm-dispatches"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancel({ data: { dispatchId: id } }),
    onSuccess: () => { toast.success("Cancelado"); qc.invalidateQueries({ queryKey: ["comm-dispatches"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = query.data?.rows ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Status</Label>
            <Select value={filters.status || "__all"} onValueChange={(v) => setFilters(f => ({ ...f, status: v === "__all" ? "" : v }))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos</SelectItem>
                {["queued","processing","sent","delivered","failed","dead_letter","skipped","cancelled"].map(s =>
                  <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Canal</Label>
            <Select value={filters.channel || "__all"} onValueChange={(v) => setFilters(f => ({ ...f, channel: v === "__all" ? "" : v }))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos</SelectItem>
                {CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Evento</Label>
            <Input className="w-56" placeholder="ex: payment_approved"
              value={filters.eventCode} onChange={(e) => setFilters(f => ({ ...f, eventCode: e.target.value }))} />
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["comm-dispatches"] })}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">
          {query.isLoading ? "Carregando…" : `${rows.length} dispatches`}
        </CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Quando</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Canal</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Destino</th>
                  <th className="p-3">Tent.</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(r.id)}>
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 font-mono text-xs">{r.event_code}</td>
                    <td className="p-3"><Badge variant="outline" className="gap-1">
                      {channelIcon[r.channel as Channel]} {r.channel}
                    </Badge></td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${statusColor[r.status] ?? ""}`}>{r.status}</span></td>
                    <td className="p-3 text-xs truncate max-w-[220px]">{r.destination ?? "—"}</td>
                    <td className="p-3 text-xs">{r.attempts}/{r.max_attempts}</td>
                    <td className="p-3 text-xs">{r.origin}{r.origin_ref ? ` · ${r.origin_ref.slice(0,10)}…` : ""}</td>
                    <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {(r.status === "failed" || r.status === "dead_letter" || r.status === "skipped") && (
                        <Button size="sm" variant="ghost" onClick={() => retryMut.mutate(r.id)}>
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {(r.status === "queued" || r.status === "processing") && (
                        <Button size="sm" variant="ghost" onClick={() => cancelMut.mutate(r.id)}>
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!query.isLoading && rows.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhum dispatch encontrado para estes filtros.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TimelineSheet dispatchId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TimelineSheet({ dispatchId, onClose }: { dispatchId: string | null; onClose: () => void }) {
  const get = useServerFn(getDispatchTimeline);
  const query = useQuery({
    queryKey: ["comm-timeline", dispatchId],
    queryFn: () => get({ data: { dispatchId: dispatchId! } }),
    enabled: !!dispatchId,
  });
  return (
    <Sheet open={!!dispatchId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>Timeline do dispatch</SheetTitle></SheetHeader>
        {query.isLoading && <p className="text-sm text-muted-foreground mt-4">Carregando…</p>}
        {query.data && (
          <div className="mt-4 space-y-4">
            <div className="text-xs space-y-1">
              <div><b>ID:</b> <span className="font-mono">{query.data.dispatch.id}</span></div>
              <div><b>Evento:</b> {query.data.dispatch.event_code}</div>
              <div><b>Canal:</b> {query.data.dispatch.channel}</div>
              <div><b>Status:</b> {query.data.dispatch.status}</div>
              <div><b>Destino:</b> {query.data.dispatch.destination ?? "—"}</div>
              {query.data.dispatch.last_error && <div className="text-rose-600"><b>Erro:</b> {query.data.dispatch.last_error}</div>}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Eventos ({query.data.events.length})</h3>
              <ol className="space-y-2 border-l pl-4">
                {query.data.events.map((e: any) => (
                  <li key={e.id} className="text-xs">
                    <div className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</div>
                    <div><b>{e.event_type}</b> {e.channel ? `· ${e.channel}` : ""}</div>
                    {e.error && <div className="text-rose-600">{e.error}</div>}
                    {e.payload && Object.keys(e.payload).length > 0 && (
                      <pre className="mt-1 bg-muted/40 p-2 rounded text-[10px] overflow-x-auto">{JSON.stringify(e.payload, null, 2)}</pre>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Payload</h3>
              <pre className="bg-muted/40 p-3 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(query.data.dispatch.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// -----------------------------------------------------------------------------
// Events catalog
// -----------------------------------------------------------------------------
function EventsTab() {
  const list = useServerFn(listCommEvents);
  const query = useQuery({ queryKey: ["comm-events"], queryFn: () => list() });
  const rows = query.data?.rows ?? [];
  return (
    <Card><CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr>
            <th className="p-3">Código</th><th className="p-3">Categoria</th><th className="p-3">Rótulo</th>
            <th className="p-3">Prioridade</th><th className="p-3">Canais default</th><th className="p-3">Hint Impulsionito</th>
          </tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono text-xs">{r.code}</td>
                <td className="p-3"><Badge variant="secondary">{r.category}</Badge></td>
                <td className="p-3">{r.label_pt}</td>
                <td className="p-3 text-xs">{r.default_priority}</td>
                <td className="p-3"><div className="flex gap-1 flex-wrap">
                  {(r.default_channels ?? []).map((c: string) => (
                    <Badge key={c} variant="outline" className="gap-1 text-[10px]">
                      {channelIcon[c as Channel]} {c}
                    </Badge>
                  ))}
                </div></td>
                <td className="p-3 text-xs text-muted-foreground">{r.impulsionito_hint ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent></Card>
  );
}

// -----------------------------------------------------------------------------
// Templates
// -----------------------------------------------------------------------------
function TemplatesTab() {
  const qc = useQueryClient();
  const listE = useServerFn(listCommEvents);
  const listT = useServerFn(listCommTemplates);
  const upsert = useServerFn(upsertCommTemplate);
  const [eventCode, setEventCode] = useState<string>("");
  const [editing, setEditing] = useState<any | null>(null);

  const events = useQuery({ queryKey: ["comm-events"], queryFn: () => listE() });
  const tpls = useQuery({
    queryKey: ["comm-templates", eventCode],
    queryFn: () => listT({ data: { eventCode: eventCode || undefined } }),
  });

  const save = useMutation({
    mutationFn: (row: any) => upsert({ data: row }),
    onSuccess: () => {
      toast.success("Template salvo");
      qc.invalidateQueries({ queryKey: ["comm-templates"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 flex gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Evento</Label>
          <Select value={eventCode || "__all"} onValueChange={(v) => setEventCode(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Todos os eventos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              {(events.data?.rows ?? []).map((e: any) => (
                <SelectItem key={e.code} value={e.code}>{e.code} · {e.label_pt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="ml-auto" onClick={() => setEditing({ scope: "global", channel: "email", locale: "pt-BR", active: true, eventCode })}>
          Novo template
        </Button>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr>
            <th className="p-3">Evento</th><th className="p-3">Canal</th><th className="p-3">Escopo</th>
            <th className="p-3">Assunto</th><th className="p-3">Ativo</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {(tpls.data?.rows ?? []).map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-mono text-xs">{t.event_code}</td>
                <td className="p-3">{t.channel}</td>
                <td className="p-3"><Badge variant="outline">{t.scope}{t.niche_code ? `:${t.niche_code}` : ""}{t.company_id ? ":tenant" : ""}</Badge></td>
                <td className="p-3 text-xs truncate max-w-[300px]">{t.subject ?? "—"}</td>
                <td className="p-3">{t.active ? "sim" : "não"}</td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => setEditing({
                  id: t.id, eventCode: t.event_code, channel: t.channel, scope: t.scope,
                  nicheCode: t.niche_code, companyId: t.company_id, locale: t.locale,
                  subject: t.subject, bodyMd: t.body_md, bodyHtml: t.body_html, active: t.active,
                })}>Editar</Button></td>
              </tr>
            ))}
            {tpls.data?.rows?.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                Sem templates para este filtro. Clique em "Novo template".
              </td></tr>
            )}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Evento</Label>
                  <Input value={editing.eventCode ?? ""} onChange={(e) => setEditing({ ...editing, eventCode: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Canal</Label>
                  <Select value={editing.channel} onValueChange={(v) => setEditing({ ...editing, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Escopo</Label>
                  <Select value={editing.scope} onValueChange={(v) => setEditing({ ...editing, scope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">global</SelectItem>
                      <SelectItem value="niche">niche</SelectItem>
                      <SelectItem value="tenant">tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nicho (opcional)</Label>
                  <Input value={editing.nicheCode ?? ""} onChange={(e) => setEditing({ ...editing, nicheCode: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Tenant ID (opcional)</Label>
                  <Input value={editing.companyId ?? ""} onChange={(e) => setEditing({ ...editing, companyId: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Assunto (e-mail)</Label>
                <Input value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Corpo (markdown, aceita {"{{variavel}}"})</Label>
                <Textarea rows={8} value={editing.bodyMd ?? ""} onChange={(e) => setEditing({ ...editing, bodyMd: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={() => editing && save.mutate({
              id: editing.id, eventCode: editing.eventCode, channel: editing.channel, scope: editing.scope,
              nicheCode: editing.nicheCode || null, companyId: editing.companyId || null,
              locale: editing.locale ?? "pt-BR", subject: editing.subject || null,
              bodyMd: editing.bodyMd || null, bodyHtml: editing.bodyHtml || null, active: !!editing.active,
            })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Channels por tenant
// -----------------------------------------------------------------------------
function ChannelsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listChannelConfigs);
  const upsert = useServerFn(upsertChannelConfig);
  const query = useQuery({ queryKey: ["comm-channels"], queryFn: () => list({ data: {} }) });
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (row: any) => upsert({ data: row }),
    onSuccess: () => { toast.success("Config salva"); qc.invalidateQueries({ queryKey: ["comm-channels"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 flex items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          Configuração por tenant × canal. Sem registro = canal segue o default global do evento.
        </p>
        <Button onClick={() => setEditing({ enabled: true, rateLimitPerMin: 60, channel: "whatsapp" })}>Nova config</Button>
      </CardContent></Card>
      <Card><CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr>
            <th className="p-3">Tenant</th><th className="p-3">Canal</th><th className="p-3">Provider</th>
            <th className="p-3">Ativo</th><th className="p-3">n8n webhook</th><th className="p-3">Rate/min</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {(query.data?.rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono text-xs">{r.company_id?.slice(0, 8)}…</td>
                <td className="p-3">{r.channel}</td>
                <td className="p-3 text-xs">{r.provider ?? "—"}</td>
                <td className="p-3">{r.enabled ? "sim" : "não"}</td>
                <td className="p-3 text-xs truncate max-w-[240px]">{r.n8n_webhook_url ?? "—"}</td>
                <td className="p-3 text-xs">{r.rate_limit_per_min}</td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => setEditing({
                  companyId: r.company_id, channel: r.channel, enabled: r.enabled, provider: r.provider,
                  n8nWebhookUrl: r.n8n_webhook_url, n8nSecretRef: r.n8n_secret_ref,
                  fallbackChannel: r.fallback_channel, rateLimitPerMin: r.rate_limit_per_min,
                })}>Editar</Button></td>
              </tr>
            ))}
            {query.data?.rows?.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">
                Nenhuma config específica ainda — canais rodam com defaults globais.
              </td></tr>
            )}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Config de canal</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label className="text-xs">Tenant ID (UUID)</Label>
                <Input value={editing.companyId ?? ""} onChange={(e) => setEditing({ ...editing, companyId: e.target.value })} /></div>
              <div><Label className="text-xs">Canal</Label>
                <Select value={editing.channel} onValueChange={(v) => setEditing({ ...editing, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs">Provider (opcional, ex: meta_cloud_api, zapi, resend)</Label>
                <Input value={editing.provider ?? ""} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} /></div>
              <div><Label className="text-xs">n8n webhook URL</Label>
                <Input value={editing.n8nWebhookUrl ?? ""} onChange={(e) => setEditing({ ...editing, n8nWebhookUrl: e.target.value })} /></div>
              <div><Label className="text-xs">Nome da env com o secret HMAC (n8nSecretRef)</Label>
                <Input value={editing.n8nSecretRef ?? ""} onChange={(e) => setEditing({ ...editing, n8nSecretRef: e.target.value })} /></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} />
                  <Label>Habilitado</Label>
                </div>
                <div className="flex-1"><Label className="text-xs">Rate/min</Label>
                  <Input type="number" value={editing.rateLimitPerMin ?? 60}
                    onChange={(e) => setEditing({ ...editing, rateLimitPerMin: parseInt(e.target.value, 10) || 60 })} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={() => editing && save.mutate({
              companyId: editing.companyId, channel: editing.channel, enabled: !!editing.enabled,
              provider: editing.provider || null, n8nWebhookUrl: editing.n8nWebhookUrl || null,
              n8nSecretRef: editing.n8nSecretRef || null,
              fallbackChannel: editing.fallbackChannel || null,
              rateLimitPerMin: editing.rateLimitPerMin ?? 60,
            })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -----------------------------------------------------------------------------
// n8n docs
// -----------------------------------------------------------------------------
function IntegrationsTab() {
  return (
    <Card><CardContent className="p-6 prose prose-sm max-w-none">
      <h2>Integração n8n</h2>
      <p>O Centro de Comunicação fala com o n8n em duas direções:</p>
      <h3>1. Outbound (backend → n8n)</h3>
      <p>Quando um evento é enfileirado no canal <code>n8n</code>, o worker faz um POST assinado para
        a URL configurada em <b>Canais por Tenant → canal n8n</b>. Headers:</p>
      <pre>{`Content-Type: application/json
X-Impulsionando-Signature: <HMAC-SHA256 hex do body cru>
X-Impulsionando-Event: <event_code>`}</pre>
      <p>O secret HMAC é lido da env cujo nome está em <code>n8n_secret_ref</code>. Configure o
        secret via Cloud → Secrets.</p>

      <h3>2. Callback (n8n → backend)</h3>
      <p>Após processar, o n8n deve chamar <code>POST /api/public/comm/n8n-callback</code>
        com o mesmo secret assinando o body:</p>
      <pre>{`{
  "dispatch_id": "<uuid>",
  "status": "sent" | "delivered" | "failed",
  "provider_message_id": "opcional",
  "error": "opcional",
  "meta": { ... }
}`}</pre>

      <h3>3. Tick da fila</h3>
      <p>O worker roda a cada 30s via pg_cron chamando <code>POST /api/public/comm/tick</code>
        com header <code>apikey</code>. Para forçar manualmente durante testes,
        use um cliente HTTP com a publishable key do projeto.</p>
    </CardContent></Card>
  );
}
