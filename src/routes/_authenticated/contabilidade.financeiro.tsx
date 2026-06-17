import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatCard } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Wallet, CheckCircle2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro do Escritório — Contabilidade" }] }),
  component: ContabFinanceiro,
});

interface Item {
  id: string; kind: string; category: string | null; description: string;
  amount: number; due_date: string | null; paid_at: string | null;
  status: string; client_id: string | null;
}
interface Client { id: string; legal_name: string; trade_name: string | null; }

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ContabFinanceiro() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    kind: "receita", category: "", description: "", amount: 0,
    due_date: "", client_id: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["contab-clients-min", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_clients")
        .select("id, legal_name, trade_name").eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["contab-finance", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_office_finance")
        .select("*").eq("company_id", companyId!).order("due_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as Item[];
    },
  });

  const stats = useMemo(() => {
    if (!items) return { receivable: 0, payable: 0, received: 0, paid: 0 };
    return items.reduce((acc, i) => {
      const isRev = i.kind === "receita";
      const isPaid = i.status === "pago";
      if (isRev && isPaid) acc.received += +i.amount;
      else if (isRev) acc.receivable += +i.amount;
      else if (isPaid) acc.paid += +i.amount;
      else acc.payable += +i.amount;
      return acc;
    }, { receivable: 0, payable: 0, received: 0, paid: 0 });
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "receita") return items.filter((i) => i.kind === "receita");
    if (filter === "despesa") return items.filter((i) => i.kind === "despesa");
    if (filter === "pendente") return items.filter((i) => i.status === "pendente");
    return items;
  }, [items, filter]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contab_office_finance").insert({
        company_id: companyId!,
        kind: form.kind,
        category: form.category || null,
        description: form.description,
        amount: form.amount,
        due_date: form.due_date || null,
        client_id: form.client_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento criado");
      qc.invalidateQueries({ queryKey: ["contab-finance"] });
      setOpen(false);
      setForm({ kind: "receita", category: "", description: "", amount: 0, due_date: "", client_id: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async (i: Item) => {
      const paid = i.status !== "pago";
      const { error } = await supabase.from("contab_office_finance").update({
        status: paid ? "pago" : "pendente",
        paid_at: paid ? new Date().toISOString() : null,
      }).eq("id", i.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contab-finance"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_office_finance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["contab-finance"] }); },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Financeiro do Escritório"
        description="Honorários a receber, despesas operacionais e fluxo de caixa do escritório contábil."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo lançamento
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="A receber" value={fmt(stats.receivable)} icon={TrendingUp} accent />
        <StatCard label="Recebido" value={fmt(stats.received)} icon={Wallet} />
        <StatCard label="A pagar" value={fmt(stats.payable)} icon={TrendingDown} />
        <StatCard label="Pago" value={fmt(stats.paid)} icon={CheckCircle2} />
      </div>

      <div className="flex gap-2 mb-4">
        {[["all", "Todos"], ["receita", "Receitas"], ["despesa", "Despesas"], ["pendente", "Pendentes"]].map(([v, l]) => (
          <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>{l}</Button>
        ))}
      </div>

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !filtered.length && <EmptyState title="Nenhum lançamento" description="Comece criando uma receita ou despesa." />}

      <div className="space-y-2">
        {filtered.map((i) => {
          const isRev = i.kind === "receita";
          const client = clients?.find((c) => c.id === i.client_id);
          return (
            <Card key={i.id} className="p-3 flex items-center gap-3">
              {isRev
                ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                : <TrendingDown className="w-5 h-5 text-red-600" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{i.description}</div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                  {i.category && <span>{i.category}</span>}
                  {client && <span>· {client.trade_name || client.legal_name}</span>}
                  {i.due_date && <span>· venc {new Date(i.due_date).toLocaleDateString("pt-BR")}</span>}
                </div>
              </div>
              <span className={`font-semibold ${isRev ? "text-emerald-600" : "text-red-600"}`}>
                {isRev ? "+" : "-"} {fmt(+i.amount)}
              </span>
              <Badge variant={i.status === "pago" ? "default" : "outline"}>{i.status}</Badge>
              <Button size="sm" variant="outline" onClick={() => markPaid.mutate(i)}>
                {i.status === "pago" ? "Reabrir" : "Marcar pago"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(i.id); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: Honorário, Aluguel" />
              </div>
            </div>
            <div><Label>Descrição *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div><Label>Vencimento</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={form.client_id || "none"}
                onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem cliente —</SelectItem>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.description || !form.amount || save.isPending}
              onClick={() => save.mutate()}>
              Criar lançamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
