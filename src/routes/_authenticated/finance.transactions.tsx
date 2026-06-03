import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance/transactions")({
  head: () => ({ meta: [{ title: "Lançamentos — Financeiro" }] }),
  component: TxPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS: Record<string, { l: string; c: string }> = {
  pending: { l: "Pendente", c: "bg-amber-100 text-amber-700" },
  paid: { l: "Pago", c: "bg-emerald-100 text-emerald-700" },
  overdue: { l: "Vencido", c: "bg-red-100 text-red-700" },
  canceled: { l: "Cancelado", c: "bg-gray-100 text-gray-700" },
  refunded: { l: "Estornado", c: "bg-violet-100 text-violet-700" },
};

function TxPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "income" | "expense" | "pending" | "overdue">("all");
  const [open, setOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    kind: "income", description: "", amount: "", due_date: todayStr,
    account_id: "", category_id: "", payment_method_id: "", customer_name: "", notes: "",
  });

  const { data: accounts } = useQuery({
    queryKey: ["fin-accounts-min", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_accounts").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: cats } = useQuery({
    queryKey: ["fin-cats-min", companyId, form.kind], enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_categories").select("id,name").eq("company_id", companyId).eq("kind", form.kind).eq("is_active", true).order("name")).data ?? [],
  });
  const { data: methods } = useQuery({
    queryKey: ["fin-methods-min", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_payment_methods").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name")).data ?? [],
  });

  const { data: txs } = useQuery({
    queryKey: ["fin-txs", companyId, tab],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("fin_transactions")
        .select("id, description, amount, kind, status, due_date, paid_at, account_id, category_id, customer_name")
        .eq("company_id", companyId).order("due_date", { ascending: false }).limit(200);
      if (tab === "income" || tab === "expense") q = q.eq("kind", tab);
      if (tab === "pending") q = q.eq("status", "pending");
      if (tab === "overdue") q = q.eq("status", "pending").lt("due_date", todayStr);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fin_transactions").insert({
        company_id: companyId,
        kind: form.kind, description: form.description, amount: Number(form.amount || 0),
        due_date: form.due_date,
        account_id: form.account_id || null, category_id: form.category_id || null,
        payment_method_id: form.payment_method_id || null,
        customer_name: form.customer_name || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-txs"] });
      qc.invalidateQueries({ queryKey: ["fin-stats"] });
      qc.invalidateQueries({ queryKey: ["fin-recent"] });
      setOpen(false);
      setForm({ kind: "income", description: "", amount: "", due_date: todayStr, account_id: "", category_id: "", payment_method_id: "", customer_name: "", notes: "" });
      toast.success("Lançamento criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pay = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fin_transactions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-txs"] }); qc.invalidateQueries({ queryKey: ["fin-stats"] }); qc.invalidateQueries({ queryKey: ["fin-accounts"] }); toast.success("Quitado"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const refund = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fin_transactions").update({ status: "refunded" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-txs"] }); qc.invalidateQueries({ queryKey: ["fin-stats"] }); qc.invalidateQueries({ queryKey: ["fin-accounts"] }); toast.success("Estornado"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fin_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-txs"] }); toast.success("Excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Lançamentos" description="Contas a pagar e a receber."
        action={<div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Novo lançamento</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Tipo</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v, category_id: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="income">Receita</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent>
                  </Select></div>
                <div className="col-span-2"><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Valor</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><Label>Conta</Label>
                  <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Categoria</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Método</Label>
                  <Select value={form.payment_method_id} onValueChange={(v) => setForm({ ...form, payment_method_id: v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{methods?.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Cliente/Fornecedor</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.description || !form.amount || create.isPending}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-card divide-y">
        {!txs?.length && <div className="p-8 text-center text-sm text-muted-foreground">Sem lançamentos.</div>}
        {txs?.map((t) => {
          const s = STATUS[t.status] ?? STATUS.pending;
          return (
            <div key={t.id} className="p-3 flex items-center gap-3">
              <div className={`w-2 self-stretch rounded-sm ${t.kind === "income" ? "bg-emerald-500" : "bg-red-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{t.description}</div>
                <div className="text-xs text-muted-foreground truncate">
                  Vence {new Date(t.due_date).toLocaleDateString("pt-BR")}
                  {t.customer_name ? ` · ${t.customer_name}` : ""}
                  {t.paid_at ? ` · Pago em ${new Date(t.paid_at).toLocaleDateString("pt-BR")}` : ""}
                </div>
              </div>
              <Badge variant="outline" className={s.c}>{s.l}</Badge>
              <div className={`text-sm font-semibold w-28 text-right ${t.kind === "income" ? "text-emerald-600" : "text-red-600"}`}>
                {t.kind === "income" ? "+" : "-"} {fmt(Number(t.amount))}
              </div>
              <div className="flex gap-1">
                {t.status === "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => pay.mutate(t.id)} title="Quitar"><CheckCircle2 className="w-4 h-4" /></Button>
                )}
                {t.status === "paid" && (
                  <Button size="sm" variant="ghost" onClick={() => refund.mutate(t.id)} title="Estornar"><RotateCcw className="w-4 h-4" /></Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir lançamento?")) del.mutate(t.id); }} title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
