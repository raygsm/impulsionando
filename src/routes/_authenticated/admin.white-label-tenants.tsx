import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listWhitelabelAdmin,
  upsertWhitelabelPlan,
  deleteWhitelabelPlan,
  upsertWhitelabelSubscription,
  setWhitelabelSubscriptionStatus,
  upsertWhitelabelCompanyLink,
  deleteWhitelabelCompanyLink,
} from "@/lib/whitelabel-admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Power, PowerOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/white-label-tenants")({
  component: WhiteLabelTenantsPage,
});

function WhiteLabelTenantsPage() {
  const fetchAll = useServerFn(listWhitelabelAdmin);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["wl-admin"],
    queryFn: () => fetchAll(),
  });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {(error as Error).message}</div>;
  if (!data) return null;

  const refresh = () => qc.invalidateQueries({ queryKey: ["wl-admin"] });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold">White-Label · Tenants</h1>
        <p className="text-muted-foreground text-sm">
          Gestão funcional de planos, assinaturas e vínculos de empresas. Apenas staff Impulsionando.
        </p>
      </header>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planos ({data.plans.length})</TabsTrigger>
          <TabsTrigger value="subs">Assinaturas ({data.subscriptions.length})</TabsTrigger>
          <TabsTrigger value="links">Vínculos ({data.links.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <PlansSection plans={data.plans} onChange={refresh} />
        </TabsContent>
        <TabsContent value="subs" className="space-y-4">
          <SubsSection subs={data.subscriptions} plans={data.plans} companies={data.companies} onChange={refresh} />
        </TabsContent>
        <TabsContent value="links" className="space-y-4">
          <LinksSection links={data.links} plans={data.plans} companies={data.companies} onChange={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ────────────────── Planos ────────────────── */

function PlansSection({ plans, onChange }: { plans: any[]; onChange: () => void }) {
  const upsert = useServerFn(upsertWhitelabelPlan);
  const del = useServerFn(deleteWhitelabelPlan);
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (p: any) => upsert({ data: p }),
    onSuccess: () => { toast.success("Plano salvo"); setEditing(null); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Plano removido"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Catálogo de Planos WL</CardTitle>
        <Button size="sm" onClick={() => setEditing({ slug: "", nome: "", ordem: 0, mensalidade_sm: 0, pontos_capacidade: 0, pontos_adicionais: 0 })}>
          <Plus className="w-4 h-4 mr-1" /> Novo plano
        </Button>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th>Slug</th><th>Nome</th><th>Ordem</th><th>SM</th><th>Pts. cap.</th><th>Pts. ad.</th><th></th></tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="font-mono">{p.slug}</td>
                <td>{p.nome}</td>
                <td>{p.ordem}</td>
                <td>{p.mensalidade_sm}</td>
                <td>{p.pontos_capacidade}</td>
                <td>{p.pontos_adicionais}</td>
                <td className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove.mutate(p.id)} disabled={remove.isPending}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="mt-6 border rounded p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Slug"><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Nome"><Input value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} /></Field>
              <Field label="Ordem"><Input type="number" value={editing.ordem} onChange={(e) => setEditing({ ...editing, ordem: Number(e.target.value) })} /></Field>
              <Field label="Mensalidade (SM)"><Input type="number" step="0.01" value={editing.mensalidade_sm} onChange={(e) => setEditing({ ...editing, mensalidade_sm: Number(e.target.value) })} /></Field>
              <Field label="Pontos capacidade"><Input type="number" value={editing.pontos_capacidade} onChange={(e) => setEditing({ ...editing, pontos_capacidade: Number(e.target.value) })} /></Field>
              <Field label="Pontos adicionais"><Input type="number" value={editing.pontos_adicionais} onChange={(e) => setEditing({ ...editing, pontos_adicionais: Number(e.target.value) })} /></Field>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────── Assinaturas ────────────────── */

function SubsSection({ subs, plans, companies, onChange }: { subs: any[]; plans: any[]; companies: any[]; onChange: () => void }) {
  const upsert = useServerFn(upsertWhitelabelSubscription);
  const setStatus = useServerFn(setWhitelabelSubscriptionStatus);
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (s: any) => upsert({ data: s }),
    onSuccess: () => { toast.success("Assinatura salva"); setEditing(null); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (p: { id: string; status: "active" | "suspended" }) => setStatus({ data: p }),
    onSuccess: () => { toast.success("Status atualizado"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assinaturas WL (por Owner)</CardTitle>
        <Button size="sm" onClick={() => setEditing({ owner_id: "", plan_slug: plans[0]?.slug ?? "", status: "active", capacidade_pontos: 0, auto_upgrade: false, auto_downgrade: false })}>
          <Plus className="w-4 h-4 mr-1" /> Nova assinatura
        </Button>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th>Owner</th><th>Plano</th><th>Status</th><th>Cap. pts</th><th>Auto</th><th></th></tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t">
                <td>{s.owner_name}</td>
                <td className="font-mono">{s.plan_slug}</td>
                <td><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></td>
                <td>{s.capacidade_pontos}</td>
                <td className="text-xs">{s.auto_upgrade ? "↑" : ""}{s.auto_downgrade ? "↓" : ""}</td>
                <td className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Editar</Button>
                  {s.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: s.id, status: "suspended" })}>
                      <PowerOff className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: s.id, status: "active" })}>
                      <Power className="w-3 h-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="mt-6 border rounded p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner (empresa)">
                <Select value={editing.owner_id} onValueChange={(v) => setEditing({ ...editing, owner_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Plano">
                <Select value={editing.plan_slug} onValueChange={(v) => setEditing({ ...editing, plan_slug: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="trial">trial</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                    <SelectItem value="canceled">canceled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Capacidade pontos"><Input type="number" value={editing.capacidade_pontos} onChange={(e) => setEditing({ ...editing, capacidade_pontos: Number(e.target.value) })} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.auto_upgrade} onChange={(e) => setEditing({ ...editing, auto_upgrade: e.target.checked })} /> auto-upgrade</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.auto_downgrade} onChange={(e) => setEditing({ ...editing, auto_downgrade: e.target.checked })} /> auto-downgrade</label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────── Vínculos ────────────────── */

function LinksSection({ links, plans, companies, onChange }: { links: any[]; plans: any[]; companies: any[]; onChange: () => void }) {
  const upsert = useServerFn(upsertWhitelabelCompanyLink);
  const del = useServerFn(deleteWhitelabelCompanyLink);
  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (l: any) => upsert({ data: l }),
    onSuccess: () => { toast.success("Vínculo salvo"); setEditing(null); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Vínculo removido"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vínculos: Empresa → WL Owner</CardTitle>
        <Button size="sm" onClick={() => setEditing({ wl_owner_id: "", company_id: "", plan_slug: plans[0]?.slug ?? "", status: "active", pontos_consumidos: 0 })}>
          <Plus className="w-4 h-4 mr-1" /> Novo vínculo
        </Button>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th>Owner</th><th>Empresa</th><th>Plano</th><th>Status</th><th>Pts</th><th></th></tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id} className="border-t">
                <td>{l.owner_name}</td>
                <td>{l.company_name}</td>
                <td className="font-mono">{l.plan_slug}</td>
                <td><Badge variant={l.status === "active" || l.status === "ativo" ? "default" : "secondary"}>{l.status}</Badge></td>
                <td>{l.pontos_consumidos}</td>
                <td className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(l)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove.mutate(l.id)} disabled={remove.isPending}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="mt-6 border rounded p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <Field label="WL Owner">
                <Select value={editing.wl_owner_id} onValueChange={(v) => setEditing({ ...editing, wl_owner_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Empresa-cliente">
                <Select value={editing.company_id} onValueChange={(v) => setEditing({ ...editing, company_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Plano">
                <Select value={editing.plan_slug} onValueChange={(v) => setEditing({ ...editing, plan_slug: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{plans.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                    <SelectItem value="canceled">canceled</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pontos consumidos"><Input type="number" value={editing.pontos_consumidos} onChange={(e) => setEditing({ ...editing, pontos_consumidos: Number(e.target.value) })} /></Field>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>Salvar</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
