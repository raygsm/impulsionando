import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getRiomedMasterOverview, getRiomedPersonaView, pingRiomedN8n,
  listRiomedRoleTemplates, upsertRiomedRoleTemplate,
} from "@/lib/riomed-master.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Crown, Users, Activity, AlertTriangle, Eye, Plug, Plus,
  TrendingUp, FileText, ShoppingCart, Wallet, Wrench,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/master-dashboard")({
  component: () => (
    <TenantModuleShell tenantSlug="riomed" moduleSlug="master-dashboard" title="Dashboard Master — Rio Med">
      <Page />
    </TenantModuleShell>
  ),
});

const money = (v: number, c: "BRL" | "BOB" = "BOB") =>
  new Intl.NumberFormat(c === "BOB" ? "es-BO" : "pt-BR", { style: "currency", currency: c }).format(v ?? 0);

function Page() {
  const ovFn = useServerFn(getRiomedMasterOverview);
  const { data, isLoading } = useQuery({ queryKey: ["riomed-master-overview"], queryFn: () => ovFn(), refetchInterval: 30_000 });
  if (isLoading) return <div className="p-6">Carregando visão master…</div>;
  if (!data) return <div className="p-6 text-destructive">Sem permissão ou erro ao carregar.</div>;

  const k = data.kpis;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Dashboard MASTER — Rio Med</h1>
            <p className="text-sm text-muted-foreground">
              Visão total da operação. Use as abas para ver "como cada cargo vê" e configurar setores.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-500">Acesso Master</Badge>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={<Users className="h-4 w-4" />} label="Equipe total" value={String(k.sellers + k.team + k.technicians)}
          sub={`${k.sellers} vend · ${k.team} time · ${k.technicians} téc`} />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Receita cotações" value={money(k.quotes_revenue)}
          sub={`${k.quotes_total} cotações`} />
        <KPI icon={<ShoppingCart className="h-4 w-4" />} label="POS" value={money(k.pos_sales_value)}
          sub={`${k.pos_sales_count} vendas balcão`} />
        <KPI icon={<Wallet className="h-4 w-4" />} label="A receber em aberto" value={money(k.ar_open_value)}
          sub={`${k.ar_overdue_count} vencidas · ${money(k.ar_overdue_value)}`}
          tone={k.ar_overdue_count > 0 ? "red" : undefined} />
        <KPI icon={<AlertTriangle className="h-4 w-4" />} label="Alertas operacionais"
          value={String(k.tickets_open + k.stock_low + k.ar_overdue_count)}
          sub={`${k.tickets_open} tickets · ${k.stock_low} estoque baixo`}
          tone="amber" />
      </div>

      <Tabs defaultValue="visao">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visao">Visão global</TabsTrigger>
          <TabsTrigger value="persona">Ver como…</TabsTrigger>
          <TabsTrigger value="setores">Setores & Cargos</TabsTrigger>
          <TabsTrigger value="n8n">Integração N8N</TabsTrigger>
          <TabsTrigger value="alertas">Eventos & Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="visao"><GlobalTab data={data} /></TabsContent>
        <TabsContent value="persona"><PersonaTab data={data} /></TabsContent>
        <TabsContent value="setores"><SectorsTab /></TabsContent>
        <TabsContent value="n8n"><N8nTab data={data} /></TabsContent>
        <TabsContent value="alertas"><EventsTab data={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: "red" | "amber" }) {
  const cls = tone === "red" ? "border-red-500/50" : tone === "amber" ? "border-amber-500/50" : "";
  return (
    <Card className={cls}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// --- Global ---
function GlobalTab({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader><CardTitle>Performance por vendedor</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Vendedor</TableHead><TableHead>Leads</TableHead><TableHead>Cotações</TableHead>
            <TableHead>Ganhas</TableHead><TableHead>Receita</TableHead><TableHead>Meta</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(data.bySeller ?? []).map((s: any) => {
              const pct = s.monthly_goal > 0 ? Math.round((s.revenue / s.monthly_goal) * 100) : 0;
              return (
                <TableRow key={s.id}>
                  <TableCell><div className="font-medium">{s.full_name}</div><div className="text-xs text-muted-foreground">{s.email} · {s.seller_code}</div></TableCell>
                  <TableCell>{s.leads}</TableCell>
                  <TableCell>{s.quotes}</TableCell>
                  <TableCell>{s.quotes_won}</TableCell>
                  <TableCell>{money(s.revenue)}</TableCell>
                  <TableCell>{s.monthly_goal > 0 ? `${money(s.monthly_goal)} · ${pct}%` : "—"}</TableCell>
                  <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                </TableRow>
              );
            })}
            {(data.bySeller ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhum vendedor cadastrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Persona switcher ---
function PersonaTab({ data }: { data: any }) {
  const fn = useServerFn(getRiomedPersonaView);
  const [persona, setPersona] = useState<"vendedor" | "gerente" | "tecnico" | "financeiro">("gerente");
  const [sellerId, setSellerId] = useState<string>(data.sellers?.[0]?.id ?? "");
  const [techId, setTechId] = useState<string>(data.technicians?.[0]?.id ?? "");

  const payload = useMemo(() => {
    const p: any = { persona };
    if (persona === "vendedor") p.sellerId = sellerId;
    if (persona === "tecnico") p.technicianId = techId;
    return p;
  }, [persona, sellerId, techId]);

  const { data: view, isFetching, refetch } = useQuery({
    queryKey: ["riomed-persona", payload],
    queryFn: () => fn({ data: payload }),
    enabled: persona !== "vendedor" || !!sellerId,
  });

  return (
    <div className="space-y-3">
      <Card className="border-amber-500/50">
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <Eye className="h-5 w-5 text-amber-500" />
          <div>
            <Label>Ver como</Label>
            <Select value={persona} onValueChange={(v) => setPersona(v as any)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gerente">Gerente comercial</SelectItem>
                <SelectItem value="vendedor">Vendedor específico</SelectItem>
                <SelectItem value="tecnico">Técnico específico</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {persona === "vendedor" && (
            <div>
              <Label>Vendedor</Label>
              <Select value={sellerId} onValueChange={setSellerId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(data.sellers ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.seller_code ?? "-"})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {persona === "tecnico" && (
            <div>
              <Label>Técnico</Label>
              <Select value={techId} onValueChange={setTechId}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(data.technicians ?? []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>Atualizar</Button>
          {view?.scope_label && <Badge className="ml-auto bg-amber-100 text-amber-800 border-amber-300">{view.scope_label}</Badge>}
        </CardContent>
      </Card>

      {view && (
        <Card>
          <CardHeader><CardTitle>KPIs desta visão</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(view.kpis ?? {}).map(([k, v]: any) => (
              <div key={k} className="border rounded p-3">
                <div className="text-xs text-muted-foreground uppercase">{k.replace(/_/g, " ")}</div>
                <div className="text-xl font-semibold">{typeof v === "number" && k.includes("revenue") ? money(v) : String(v)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {view?.persona === "gerente" && (
        <Card>
          <CardHeader><CardTitle>Ranking de vendedores (visão gerente)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead>Cotações</TableHead><TableHead>Ganhas</TableHead><TableHead>Receita</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.sellers.map((s: any) => (
                  <TableRow key={s.id}><TableCell>{s.full_name}</TableCell><TableCell>{s.quotes}</TableCell><TableCell>{s.won}</TableCell><TableCell>{money(s.revenue)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {view?.persona === "vendedor" && (
        <div className="grid md:grid-cols-2 gap-3">
          <Card><CardHeader><CardTitle><FileText className="h-4 w-4 inline mr-1" />Cotações</CardTitle></CardHeader><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{view.quotes.slice(0, 15).map((q: any) => (
                <TableRow key={q.id}><TableCell>{new Date(q.created_at).toLocaleDateString("pt-BR")}</TableCell><TableCell>{money(Number(q.total))}</TableCell><TableCell><Badge variant="outline">{q.status}</Badge></TableCell></TableRow>
              ))}</TableBody></Table>
          </CardContent></Card>
          <Card><CardHeader><CardTitle><Users className="h-4 w-4 inline mr-1" />Leads</CardTitle></CardHeader><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{view.leads.slice(0, 15).map((l: any) => (
                <TableRow key={l.id}><TableCell>{new Date(l.created_at).toLocaleDateString("pt-BR")}</TableCell><TableCell><Badge variant="outline">{l.status}</Badge></TableCell></TableRow>
              ))}</TableBody></Table>
          </CardContent></Card>
        </div>
      )}

      {view?.persona === "tecnico" && (
        <Card><CardHeader><CardTitle><Wrench className="h-4 w-4 inline mr-1" />Tickets do técnico</CardTitle></CardHeader><CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{view.tickets.map((t: any) => (
              <TableRow key={t.id}><TableCell>{new Date(t.created_at).toLocaleDateString("pt-BR")}</TableCell><TableCell>{t.priority}</TableCell><TableCell><Badge>{t.status}</Badge></TableCell></TableRow>
            ))}</TableBody></Table>
        </CardContent></Card>
      )}
    </div>
  );
}

// --- Setores / cargos ---
function SectorsTab() {
  const list = useServerFn(listRiomedRoleTemplates);
  const up = useServerFn(upsertRiomedRoleTemplate);
  const { data, refetch } = useQuery({ queryKey: ["riomed-roles"], queryFn: () => list() });
  const [form, setForm] = useState({ code: "", label: "", sector: "", description: "" });
  const m = useMutation({
    mutationFn: () => up({ data: { ...form, scopes: [], display_order: 0 } }),
    onSuccess: () => { toast.success("Cargo salvo"); setForm({ code: "", label: "", sector: "", description: "" }); refetch(); },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader><CardTitle>Novo cargo / função</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div><Label>Setor</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="Comercial" /></div>
          <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="gerente_comercial" /></div>
          <div><Label>Rótulo</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Gerente Comercial" /></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button onClick={() => m.mutate()} disabled={!form.code || !form.label || !form.sector || m.isPending}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
        </CardContent>
      </Card>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Código</TableHead><TableHead>Rótulo</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data ?? []).map((r: any) => (
              <TableRow key={r.id}><TableCell><Badge variant="outline">{r.sector}</Badge></TableCell><TableCell className="font-mono text-xs">{r.code}</TableCell><TableCell>{r.label}</TableCell><TableCell className="text-xs text-muted-foreground">{r.description ?? "—"}</TableCell></TableRow>
            ))}
            {(data ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum cargo cadastrado ainda.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

// --- N8N ---
function N8nTab({ data }: { data: any }) {
  const ping = useServerFn(pingRiomedN8n);
  const m = useMutation({
    mutationFn: () => ping({ data: {} }),
    onSuccess: (r: any) => toast[r.integrated ? "success" : "warning"](r.message),
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const wfs = data.n8n.workflows;
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Integração N8N</CardTitle>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>Testar conectividade agora</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Badge variant={data.n8n.configured > 0 ? "default" : "secondary"}>
              {data.n8n.configured > 0 ? `${data.n8n.configured} webhook(s) configurado(s)` : "Nenhum webhook configurado"}
            </Badge>
            <Badge variant="outline">{wfs.length} workflows registrados</Badge>
          </div>
          {m.data && (
            <div className="border rounded p-3 bg-muted/30 text-sm space-y-2">
              <div className="font-semibold">Resultado do teste — {m.data.message}</div>
              {(m.data.results ?? []).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between border-b py-1 last:border-0">
                  <span className="font-mono text-xs">{r.name}</span>
                  <span className="text-xs">{r.ok ? <Badge>OK · {r.status} · {r.ms}ms</Badge> : <Badge variant="destructive">{r.error ?? `HTTP ${r.status}`}</Badge>}</span>
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Para registrar/editar webhooks vá em <b>/admin/clientes/riomed/n8n</b>. Os JSONs prontos para importar estão em <code>docs/n8n/riomed-*.json</code>.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Execuções recentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Duração</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.n8n.recent_executions.map((e: any) => (
                <TableRow key={e.id}><TableCell>{new Date(e.created_at).toLocaleString("pt-BR")}</TableCell><TableCell><Badge variant={e.status === "success" ? "default" : "destructive"}>{e.status}</Badge></TableCell><TableCell>{e.duration_ms ?? "—"} ms</TableCell></TableRow>
              ))}
              {data.n8n.recent_executions.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhuma execução ainda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Eventos ---
function EventsTab({ data }: { data: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Card><CardHeader><CardTitle>Eventos operacionais</CardTitle></CardHeader><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Fonte</TableHead><TableHead>Evento</TableHead><TableHead>Nível</TableHead></TableRow></TableHeader>
          <TableBody>{data.events.map((e: any) => (
            <TableRow key={e.id}><TableCell>{new Date(e.created_at).toLocaleString("pt-BR")}</TableCell><TableCell>{e.source}</TableCell><TableCell className="font-mono text-xs">{e.event_code}</TableCell><TableCell><Badge variant={e.level === "error" ? "destructive" : e.level === "warn" ? "secondary" : "outline"}>{e.level}</Badge></TableCell></TableRow>
          ))}{data.events.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Sem eventos.</TableCell></TableRow>}</TableBody></Table>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Notificações de vendedores</CardTitle></CardHeader><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{data.notifications.map((n: any) => (
            <TableRow key={n.id}><TableCell>{new Date(n.created_at).toLocaleString("pt-BR")}</TableCell><TableCell>{n.kind}</TableCell><TableCell><Badge variant={n.read_at ? "secondary" : "default"}>{n.read_at ? "lida" : "nova"}</Badge></TableCell></TableRow>
          ))}{data.notifications.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Sem notificações.</TableCell></TableRow>}</TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
