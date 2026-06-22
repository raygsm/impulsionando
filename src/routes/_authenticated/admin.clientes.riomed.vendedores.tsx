import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listRiomedSellers, upsertRiomedSeller, deleteRiomedSeller,
  getDistributionConfig, saveDistributionConfig,
  listAssignments, updateAssignmentStatus, getSellersOverview,
} from "@/lib/riomed-sellers.functions";
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
import { Users, Target, Trophy, Bell, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/vendedores")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='sellers' title='Vendedores RioMed'><SellersPage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

function SellersPage() {
  const qc = useQueryClient();
  const fns = {
    list: useServerFn(listRiomedSellers),
    save: useServerFn(upsertRiomedSeller),
    del: useServerFn(deleteRiomedSeller),
    cfg: useServerFn(getDistributionConfig),
    cfgSave: useServerFn(saveDistributionConfig),
    asg: useServerFn(listAssignments),
    upd: useServerFn(updateAssignmentStatus),
    ov: useServerFn(getSellersOverview),
  };

  const ov = useQuery({ queryKey: ["riomed-sell-ov"], queryFn: () => fns.ov() });
  const sellers = useQuery({ queryKey: ["riomed-sellers"], queryFn: () => fns.list() });
  const cfg = useQuery({ queryKey: ["riomed-dist"], queryFn: () => fns.cfg() });
  const asg = useQuery({ queryKey: ["riomed-asg"], queryFn: () => fns.asg({ data: {} }) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["riomed-sell-ov"] });
    qc.invalidateQueries({ queryKey: ["riomed-sellers"] });
    qc.invalidateQueries({ queryKey: ["riomed-asg"] });
  };

  const saveMut = useMutation({
    mutationFn: (data: any) => fns.save({ data }),
    onSuccess: () => { toast.success("Vendedor salvo"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => fns.del({ data: { id } }),
    onSuccess: () => { toast.success("Vendedor removido"); invalidate(); },
  });
  const cfgMut = useMutation({
    mutationFn: (data: any) => fns.cfgSave({ data }),
    onSuccess: () => { toast.success("Distribuição salva"); qc.invalidateQueries({ queryKey: ["riomed-dist"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const updMut = useMutation({
    mutationFn: (data: any) => fns.upd({ data }),
    onSuccess: () => { toast.success("Atualizado"); invalidate(); },
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendedores & Distribuição — RioMed</h1>
        <p className="text-muted-foreground">Cadastro de vendedores, distribuição automática e gestão de leads.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Vendedores ativos" value={`${ov.data?.activeSellers ?? 0} / ${ov.data?.totalSellers ?? 0}`} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Leads em aberto" value={ov.data?.open ?? 0} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Ganhos (30d)" value={ov.data?.won ?? 0} />
        <StatCard icon={<Bell className="h-4 w-4" />} label="Notificações" value={ov.data?.unreadNotifications ?? 0} />
      </div>

      <Tabs defaultValue="sellers">
        <TabsList>
          <TabsTrigger value="sellers">Vendedores</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="assignments">Atribuições</TabsTrigger>
        </TabsList>

        <TabsContent value="sellers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendedores</CardTitle>
              <SellerDialog onSave={(d) => saveMut.mutate(d)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sellers.data?.sellers ?? []).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.seller_code}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.commission_rate}%</TableCell>
                      <TableCell>{Number(s.monthly_goal ?? 0).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                      <TableCell className="flex gap-2">
                        <SellerDialog initial={s} onSave={(d) => saveMut.mutate({ ...d, id: s.id })} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                        <Button size="icon" variant="ghost" onClick={() => delMut.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(sellers.data?.sellers ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum vendedor cadastrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader><CardTitle>Configuração da Distribuição</CardTitle></CardHeader>
            <CardContent>
              <DistributionForm
                initial={cfg.data?.config}
                sellers={sellers.data?.sellers ?? []}
                onSave={(d: any) => cfgMut.mutate(d)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader><CardTitle>Atribuições recentes</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Via</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(asg.data?.assignments ?? []).map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.crm_leads?.name ?? "—"}<br /><span className="text-xs text-muted-foreground">{a.crm_leads?.email}</span></TableCell>
                      <TableCell>{a.riomed_sellers?.full_name ?? "—"}</TableCell>
                      <TableCell><Badge>{a.status}</Badge></TableCell>
                      <TableCell>{a.assigned_via}</TableCell>
                      <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select value={a.status} onValueChange={(v) => updMut.mutate({ id: a.id, status: v })}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Contatado</SelectItem>
                            <SelectItem value="won">Ganho</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(asg.data?.assignments ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem atribuições.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function SellerDialog({ initial, onSave, trigger }: { initial?: any; onSave: (d: any) => void; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(initial ?? { status: "active", commission_rate: 5, monthly_goal: 0 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>Novo vendedor</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Editar" : "Novo"} vendedor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Código</Label><Input value={form.seller_code ?? ""} onChange={(e) => setForm({ ...form, seller_code: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Telefone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Território</Label><Input value={form.territory ?? ""} onChange={(e) => setForm({ ...form, territory: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Comissão %</Label><Input type="number" value={form.commission_rate ?? 5} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} /></div>
            <div><Label>Meta mensal</Label><Input type="number" value={form.monthly_goal ?? 0} onChange={(e) => setForm({ ...form, monthly_goal: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>User ID (vínculo de login)</Label><Input value={form.user_id ?? ""} onChange={(e) => setForm({ ...form, user_id: e.target.value || null })} placeholder="UUID do auth.users (opcional)" /></div>
          <div><Label>Observações</Label><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => { onSave(form); setOpen(false); }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DistributionForm({ initial, sellers, onSave }: any) {
  const [form, setForm] = useState<any>(initial ?? { mode: "round_robin", active: true, weekend_enabled: false });
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <Switch checked={!!form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
        <Label>Distribuição ativa</Label>
      </div>
      <div>
        <Label>Modo</Label>
        <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="round_robin">Round-robin</SelectItem>
            <SelectItem value="random">Aleatório</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="territory">Por território</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label>Início (h)</Label><Input type="time" value={form.business_hours_start ?? "08:00"} onChange={(e) => setForm({ ...form, business_hours_start: e.target.value })} /></div>
        <div><Label>Fim (h)</Label><Input type="time" value={form.business_hours_end ?? "18:00"} onChange={(e) => setForm({ ...form, business_hours_end: e.target.value })} /></div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={!!form.weekend_enabled} onCheckedChange={(v) => setForm({ ...form, weekend_enabled: v })} />
        <Label>Distribuir no fim de semana</Label>
      </div>
      <div>
        <Label>Vendedor padrão (fallback)</Label>
        <Select value={form.fallback_seller_id ?? ""} onValueChange={(v) => setForm({ ...form, fallback_seller_id: v || null })}>
          <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
          <SelectContent>
            {sellers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => onSave(form)}>Salvar configuração</Button>
    </div>
  );
}
