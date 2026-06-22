import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFinanceOverview, createApInvoice, markInvoicePaid,
  upsertCommissionRule, updateCommissionStatus,
} from "@/lib/riomed-finance.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { Banknote, TrendingDown, TrendingUp, AlertCircle, Plus, Percent } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/financeiro")({
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='finance' title='Financeiro RioMed'><Page /></TenantModuleShell>),
});

function Page() {
  const fn = useServerFn(getFinanceOverview);
  const pay = useServerFn(markInvoicePaid);
  const addAp = useServerFn(createApInvoice);
  const upRule = useServerFn(upsertCommissionRule);
  const upComm = useServerFn(updateCommissionStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["riomed-finance"], queryFn: () => fn() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["riomed-finance"] });
  const mPay = useMutation({ mutationFn: (a: any) => pay({ data: a }), onSuccess: () => { invalidate(); toast.success("Quitado"); }, onError: (e: any) => toast.error(e?.message) });
  const mApNew = useMutation({ mutationFn: (a: any) => addAp({ data: a }), onSuccess: () => { invalidate(); toast.success("Conta criada"); }, onError: (e: any) => toast.error(e?.message) });
  const mRule = useMutation({ mutationFn: (a: any) => upRule({ data: a }), onSuccess: () => { invalidate(); toast.success("Regra salva"); }, onError: (e: any) => toast.error(e?.message) });
  const mComm = useMutation({ mutationFn: (a: any) => upComm({ data: a }), onSuccess: () => { invalidate(); toast.success("Atualizado"); }, onError: (e: any) => toast.error(e?.message) });

  if (isLoading) return <div className="p-6">Carregando…</div>;
  const d = data ?? { ar: [], ap: [], commissions: [], rules: [], kpis: { arOpen:0, apOpen:0, arOverdue:0, apOverdue:0, commissionsAccrued:0, commissionsPaid:0 }, cashflow: [] };
  const money = (v: number) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BOB" }).format(v ?? 0);

  return (
    <div className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Financeiro — Rio Med</h1>
        <p className="text-sm text-muted-foreground">Contas a receber, pagar, fluxo de caixa e comissões.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label="A Receber" value={money(d.kpis.arOpen)} />
        <Kpi icon={<TrendingDown className="h-4 w-4 text-red-600" />} label="A Pagar" value={money(d.kpis.apOpen)} />
        <Kpi icon={<AlertCircle className="h-4 w-4 text-amber-600" />} label="AR Atrasado" value={money(d.kpis.arOverdue)} />
        <Kpi icon={<AlertCircle className="h-4 w-4 text-amber-600" />} label="AP Atrasado" value={money(d.kpis.apOverdue)} />
        <Kpi icon={<Percent className="h-4 w-4" />} label="Comissões a pagar" value={money(d.kpis.commissionsAccrued)} />
        <Kpi icon={<Banknote className="h-4 w-4" />} label="Comissões pagas" value={money(d.kpis.commissionsPaid)} />
      </div>

      <Tabs defaultValue="cashflow">
        <TabsList>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="ar">A Receber ({d.ar.length})</TabsTrigger>
          <TabsTrigger value="ap">A Pagar ({d.ap.length})</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="rules">Regras de comissão</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow">
          <Card><CardHeader><CardTitle className="text-base">Projeção 30 dias</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer><BarChart data={d.cashflow}>
                <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Legend />
                <Bar dataKey="in" name="Entradas" fill="hsl(var(--primary))" />
                <Bar dataKey="out" name="Saídas" fill="hsl(var(--destructive))" />
              </BarChart></ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ar">
          <InvoiceTable rows={d.ar} onPay={(id) => mPay.mutate({ table: "riomed_ar_invoices", id })} disabled={mPay.isPending} money={money} />
        </TabsContent>

        <TabsContent value="ap">
          <div className="flex justify-end mb-2">
            <ApDialog onSubmit={(p) => mApNew.mutate(p)} disabled={mApNew.isPending} />
          </div>
          <InvoiceTable rows={d.ap} onPay={(id) => mPay.mutate({ table: "riomed_ap_invoices", id })} disabled={mPay.isPending} money={money} />
        </TabsContent>

        <TabsContent value="commissions">
          <Card><CardContent className="p-0">
            {d.commissions.length === 0 ? <div className="p-6 text-sm text-muted-foreground text-center">Sem comissões apuradas.</div> :
            <Table>
              <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Pedido</TableHead><TableHead>Base</TableHead><TableHead>%</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>{d.commissions.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>{c.period}</TableCell>
                  <TableCell className="font-mono text-xs">{c.order_id?.slice(0, 8)}</TableCell>
                  <TableCell>{money(Number(c.base_amount))}</TableCell>
                  <TableCell>{c.rate_pct}%</TableCell>
                  <TableCell className="font-semibold">{money(Number(c.amount))}</TableCell>
                  <TableCell><Badge variant={c.status === "paid" ? "default" : c.status === "approved" ? "secondary" : "outline"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {c.status === "accrued" && <Button size="sm" variant="outline" disabled={mComm.isPending} onClick={() => mComm.mutate({ id: c.id, status: "approved" })}>Aprovar</Button>}
                    {c.status !== "paid" && <Button size="sm" disabled={mComm.isPending} onClick={() => mComm.mutate({ id: c.id, status: "paid" })}>Pagar</Button>}
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="rules">
          <div className="flex justify-end mb-2">
            <RuleDialog onSubmit={(p) => mRule.mutate(p)} disabled={mRule.isPending} />
          </div>
          <Card><CardContent className="p-0">
            {d.rules.length === 0 ? <div className="p-6 text-sm text-muted-foreground text-center">Sem regras. Sem regra explícita, o padrão é 3%.</div> :
            <Table>
              <TableHeader><TableRow><TableHead>Escopo</TableHead><TableHead>Categoria</TableHead><TableHead>Usuário</TableHead><TableHead>%</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>{d.rules.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.scope}</TableCell>
                  <TableCell>{r.category ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.user_id?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell>{r.rate_pct}%</TableCell>
                  <TableCell><Badge variant={r.active ? "default" : "outline"}>{r.active ? "ativa" : "inativa"}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <Card><CardContent className="p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
    <div className="text-lg font-bold mt-1">{value}</div>
  </CardContent></Card>;
}

function InvoiceTable({ rows, onPay, disabled, money }: { rows: any[]; onPay: (id: string) => void; disabled: boolean; money: (v: number) => string }) {
  if (!rows.length) return <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">Nenhuma conta.</CardContent></Card>;
  return <Card><CardContent className="p-0">
    <Table>
      <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Descrição</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((r) => (
        <TableRow key={r.id}>
          <TableCell className="font-mono text-xs">{r.number ?? r.id.slice(0, 8)}</TableCell>
          <TableCell>{r.description ?? "—"}</TableCell>
          <TableCell>{new Date(r.due_date).toLocaleDateString()}</TableCell>
          <TableCell className="font-semibold">{money(Number(r.amount))}</TableCell>
          <TableCell><Badge variant={r.status === "paid" ? "default" : r.status === "overdue" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
          <TableCell className="text-right">
            {r.status !== "paid" && <Button size="sm" disabled={disabled} onClick={() => onPay(r.id)}>Quitar</Button>}
          </TableCell>
        </TableRow>
      ))}</TableBody>
    </Table>
  </CardContent></Card>;
}

function ApDialog({ onSubmit, disabled }: { onSubmit: (p: any) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ description: "", amount: "", dueDate: "", category: "", notes: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova conta a pagar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Conta a Pagar</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Descrição*</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor (BOB)*</Label><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
            <div><Label>Vencimento*</Label><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></div>
          </div>
          <div><Label>Categoria</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="aluguel, fornecedor, imposto..." /></div>
          <Button disabled={disabled || !f.description || !f.amount || !f.dueDate}
            onClick={() => { onSubmit({ description: f.description, amount: Number(f.amount), dueDate: f.dueDate, category: f.category || undefined, notes: f.notes || undefined }); setOpen(false); setF({ description: "", amount: "", dueDate: "", category: "", notes: "" }); }}
            className="w-full">Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RuleDialog({ onSubmit, disabled }: { onSubmit: (p: any) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ scope: "default" as "default"|"user"|"category", category: "", userId: "", ratePct: "3" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Nova regra</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Regra de Comissão</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Escopo</Label>
            <select className="w-full border rounded-md h-9 px-2" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value as any })}>
              <option value="default">Padrão (toda a empresa)</option>
              <option value="user">Por vendedor</option>
              <option value="category">Por categoria</option>
            </select>
          </div>
          {f.scope === "user" && <div><Label>User ID</Label><Input value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })} /></div>}
          {f.scope === "category" && <div><Label>Categoria</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>}
          <div><Label>% Comissão</Label><Input type="number" step="0.1" value={f.ratePct} onChange={(e) => setF({ ...f, ratePct: e.target.value })} /></div>
          <Button disabled={disabled}
            onClick={() => { onSubmit({ scope: f.scope, ratePct: Number(f.ratePct), userId: f.userId || undefined, category: f.category || undefined }); setOpen(false); }}
            className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
