import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listCommissions, markCommissionPaid,
  listCommissionRules, upsertCommissionRule, deleteCommissionRule,
} from "@/lib/riomed-sales.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/comissoes")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='commissions' title='Comissões RioMed'><ComissoesPage /></TenantModuleShell>),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div>Não encontrado</div>,
});

function ComissoesPage() {
  const qc = useQueryClient();
  const fns = {
    list: useServerFn(listCommissions),
    pay: useServerFn(markCommissionPaid),
    rules: useServerFn(listCommissionRules),
    save: useServerFn(upsertCommissionRule),
    del: useServerFn(deleteCommissionRule),
  };
  const list = useQuery({ queryKey: ["rm-comm"], queryFn: () => fns.list({ data: {} }) });
  const rules = useQuery({ queryKey: ["rm-rules"], queryFn: () => fns.rules() });
  const payMut = useMutation({ mutationFn: (id: string) => fns.pay({ data: { id } }), onSuccess: () => { toast.success("Marcada como paga"); qc.invalidateQueries({ queryKey: ["rm-comm"] }); } });
  const saveMut = useMutation({ mutationFn: (d: any) => fns.save({ data: d }), onSuccess: () => { toast.success("Regra salva"); qc.invalidateQueries({ queryKey: ["rm-rules"] }); }, onError: (e: any) => toast.error(e.message) });
  const delMut = useMutation({ mutationFn: (id: string) => fns.del({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["rm-rules"] }) });

  const totals = list.data?.totals ?? { gross: 0, commission: 0, byStatus: {} };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comissões — RioMed</h1>
        <p className="text-muted-foreground">Cálculo hierárquico (produto → categoria → vendedor) e pagamento.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Base bruta" value={totals.gross.toLocaleString()} />
        <StatCard label="Comissão total" value={totals.commission.toLocaleString()} />
        <StatCard label="Pendente" value={Number(totals.byStatus?.pending ?? 0).toLocaleString()} />
      </div>

      <Tabs defaultValue="commissions">
        <TabsList>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions">
          <Card>
            <CardHeader><CardTitle>Comissões geradas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list.data?.commissions ?? []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.user_id?.slice(0, 8)}</TableCell>
                      <TableCell>{c.period}</TableCell>
                      <TableCell>{Number(c.base_amount).toLocaleString()}</TableCell>
                      <TableCell>{c.rate_pct}%</TableCell>
                      <TableCell className="font-medium">{Number(c.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={c.status === "paid" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                      <TableCell>
                        {c.status !== "paid" && <Button size="sm" onClick={() => payMut.mutate(c.id)}><DollarSign className="h-3 w-3 mr-1" />Pagar</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(list.data?.commissions ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem comissões geradas.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Regras de comissão</CardTitle>
              <RuleDialog onSave={(d: any) => saveMut.mutate(d)} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Ativa</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rules.data?.rules ?? []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge>{r.scope}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{r.product_id ?? r.category ?? r.user_id ?? "—"}</TableCell>
                      <TableCell>{r.rate_pct}%</TableCell>
                      <TableCell>{r.active ? "Sim" : "Não"}</TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => delMut.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {(rules.data?.rules ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem regras (usa padrão do vendedor).</TableCell></TableRow>
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

function StatCard({ label, value }: any) {
  return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>;
}

function RuleDialog({ onSave }: { onSave: (d: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ scope: "category", rate_pct: 5, active: true });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nova regra</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova regra de comissão</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Escopo</Label>
            <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Produto específico</SelectItem>
                <SelectItem value="category">Categoria</SelectItem>
                <SelectItem value="seller">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.scope === "product" && <div><Label>Product ID (UUID)</Label><Input value={form.product_id ?? ""} onChange={(e) => setForm({ ...form, product_id: e.target.value })} /></div>}
          {form.scope === "category" && <div><Label>Categoria</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>}
          {form.scope === "seller" && <div><Label>User ID (UUID)</Label><Input value={form.user_id ?? ""} onChange={(e) => setForm({ ...form, user_id: e.target.value })} /></div>}
          <div><Label>% comissão</Label><Input type="number" value={form.rate_pct} onChange={(e) => setForm({ ...form, rate_pct: e.target.value })} /></div>
        </div>
        <DialogFooter><Button onClick={() => { onSave(form); setOpen(false); }}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
