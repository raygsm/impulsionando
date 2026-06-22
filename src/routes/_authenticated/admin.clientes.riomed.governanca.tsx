import { createFileRoute, ErrorComponent, useRouter } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getAuditLog,
  getOperationalEvents,
  listUserScopes,
  grantUserScope,
  revokeUserScope,
  listGovernancePolicies,
  upsertGovernancePolicy,
  getGovernanceOverview,
} from "@/lib/riomed-governance.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield, FileSearch, Activity, Key, Settings as SettingsIcon, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/governanca")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='governance' title='Governança RioMed'><GovernancePage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

function GovernancePage() {
  const qc = useQueryClient();
  const overviewFn = useServerFn(getGovernanceOverview);
  const auditFn = useServerFn(getAuditLog);
  const eventsFn = useServerFn(getOperationalEvents);
  const scopesFn = useServerFn(listUserScopes);
  const policiesFn = useServerFn(listGovernancePolicies);
  const grantFn = useServerFn(grantUserScope);
  const revokeFn = useServerFn(revokeUserScope);
  const upsertPolFn = useServerFn(upsertGovernancePolicy);

  const overview = useQuery({ queryKey: ["riomed-gov-overview"], queryFn: () => overviewFn() });
  const audit = useQuery({ queryKey: ["riomed-audit"], queryFn: () => auditFn({ data: {} }) });
  const events = useQuery({ queryKey: ["riomed-opevents"], queryFn: () => eventsFn({ data: {} }) });
  const scopes = useQuery({ queryKey: ["riomed-scopes"], queryFn: () => scopesFn() });
  const policies = useQuery({ queryKey: ["riomed-policies"], queryFn: () => policiesFn() });

  const grant = useMutation({
    mutationFn: (v: any) => grantFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["riomed-scopes"] }); toast.success("Escopo concedido"); },
    onError: (e: any) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: (scopeId: string) => revokeFn({ data: { scopeId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["riomed-scopes"] }); toast.success("Escopo revogado"); },
  });
  const savePol = useMutation({
    mutationFn: (v: any) => upsertPolFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["riomed-policies"] }); toast.success("Política salva"); },
    onError: (e: any) => toast.error(e.message),
  });

  const ov = overview.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7" /> Governança RioMed</h1>
          <p className="text-muted-foreground">Auditoria, logs operacionais, RBAC fino e políticas (últimos 7 dias)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <KPI title="Auditoria (7d)" value={ov?.auditCount7d ?? "-"} icon={<FileSearch className="h-4 w-4" />} />
        <KPI title="Eventos (7d)" value={ov?.eventsCount7d ?? "-"} icon={<Activity className="h-4 w-4" />} />
        <KPI title="Erros (7d)" value={ov?.errorCount7d ?? "-"} icon={<AlertCircle className="h-4 w-4" />} tone="danger" />
        <KPI title="Alertas (7d)" value={ov?.warnCount7d ?? "-"} icon={<AlertTriangle className="h-4 w-4" />} tone="warn" />
        <KPI title="Escopos" value={ov?.scopesCount ?? "-"} icon={<Key className="h-4 w-4" />} />
        <KPI title="Políticas ativas" value={ov?.activePoliciesCount ?? "-"} icon={<SettingsIcon className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="events">Eventos operacionais</TabsTrigger>
          <TabsTrigger value="scopes">RBAC fino</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Trilha de auditoria</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Quando</TableHead><TableHead>Ator</TableHead><TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead><TableHead>ID</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {audit.data?.items.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{r.actor_email ?? r.actor_id?.slice(0, 8) ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                      <TableCell className="text-xs">{r.entity_type}</TableCell>
                      <TableCell className="text-xs font-mono">{r.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!audit.data?.items.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem registros</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Eventos operacionais</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Quando</TableHead><TableHead>Nível</TableHead><TableHead>Fonte</TableHead>
                  <TableHead>Código</TableHead><TableHead>Mensagem</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {events.data?.items.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><LevelBadge level={r.level} /></TableCell>
                      <TableCell className="text-xs">{r.source}</TableCell>
                      <TableCell className="text-xs font-mono">{r.event_code}</TableCell>
                      <TableCell className="text-xs max-w-md truncate">{r.message}</TableCell>
                    </TableRow>
                  ))}
                  {!events.data?.items.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem eventos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scopes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Escopos atribuídos</CardTitle>
              <GrantScopeDialog onSubmit={(v) => grant.mutate(v)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Usuário</TableHead><TableHead>Escopo</TableHead><TableHead>Expira</TableHead>
                  <TableHead>Notas</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {scopes.data?.items.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.user_id.slice(0, 8)}…</TableCell>
                      <TableCell><Badge>{s.scope}</Badge></TableCell>
                      <TableCell className="text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-xs">{s.notes ?? "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => revoke.mutate(s.id)}>Revogar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!scopes.data?.items.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum escopo</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Políticas de governança</CardTitle>
              <PolicyDialog onSubmit={(v) => savePol.mutate(v)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Chave</TableHead><TableHead>Nome</TableHead><TableHead>Descrição</TableHead>
                  <TableHead>Ativa</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {policies.data?.items.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.policy_key}</TableCell>
                      <TableCell>{p.policy_name}</TableCell>
                      <TableCell className="text-xs max-w-md truncate">{p.description ?? "—"}</TableCell>
                      <TableCell>{p.is_active ? <Badge>Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {!policies.data?.items.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sem políticas</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ title, value, icon, tone }: { title: string; value: any; icon: React.ReactNode; tone?: "danger" | "warn" }) {
  const color = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className={color}>{icon}</span>
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, { v: any; icon: React.ReactNode }> = {
    error: { v: "destructive", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    warn: { v: "outline", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    info: { v: "secondary", icon: <Info className="h-3 w-3 mr-1" /> },
    debug: { v: "outline", icon: null },
  };
  const m = map[level] ?? map.info;
  return <Badge variant={m.v as any} className="flex items-center w-fit">{m.icon}{level}</Badge>;
}

function GrantScopeDialog({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [scope, setScope] = useState("riomed.read");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Conceder escopo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Conceder escopo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>User ID</Label><Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid" /></div>
          <div><Label>Escopo</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["riomed.read","riomed.write","riomed.finance","riomed.partners","riomed.governance","riomed.exports"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Expira em (opcional)</Label><Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>
          <div><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => { onSubmit({ userId, scope, expiresAt: expiresAt || null, notes }); setOpen(false); setUserId(""); }}>Conceder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PolicyDialog({ onSubmit }: { onSubmit: (v: any) => void }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("data.retention.audit_days");
  const [name, setName] = useState("Retenção de auditoria");
  const [desc, setDesc] = useState("");
  const [cfg, setCfg] = useState('{"days": 365}');
  const [active, setActive] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Nova política</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Política de governança</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Chave</Label><Input value={key} onChange={(e) => setKey(e.target.value)} /></div>
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Descrição</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div><Label>Configuração (JSON)</Label><Textarea value={cfg} onChange={(e) => setCfg(e.target.value)} className="font-mono text-xs" /></div>
          <div className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} /><Label>Ativa</Label></div>
        </div>
        <DialogFooter>
          <Button onClick={() => {
            try {
              const parsed = JSON.parse(cfg);
              onSubmit({ policyKey: key, policyName: name, description: desc, config: parsed, isActive: active });
              setOpen(false);
            } catch { toast.error("JSON inválido"); }
          }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
