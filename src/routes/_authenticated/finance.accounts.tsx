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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/finance/accounts")({
  head: () => ({ meta: [{ title: "Contas — Financeiro" }] }),
  component: AccountsPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const TYPES = [
  { v: "cash", l: "Caixa" }, { v: "bank", l: "Banco" }, { v: "card", l: "Cartão" },
  { v: "wallet", l: "Carteira digital" }, { v: "other", l: "Outro" },
];

function AccountsPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "cash", opening_balance: "0" });

  const { data: accounts } = useQuery({
    queryKey: ["fin-accounts", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("fin_accounts").select("*").eq("company_id", companyId).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const ob = Number(form.opening_balance || 0);
      const { error } = await supabase.from("fin_accounts").insert({
        company_id: companyId, name: form.name, type: form.type, opening_balance: ob, current_balance: ob,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fin-accounts"] }); setOpen(false); setForm({ name: "", type: "cash", opening_balance: "0" }); toast.success("Conta criada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("fin_accounts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-accounts"] }),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Contas financeiras" description="Caixa, bancos, cartões e carteiras."
        action={<div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nova conta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova conta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Saldo inicial</Label><Input type="number" step="0.01" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!accounts?.length && <EmptyState title="Nenhuma conta" description="Crie sua primeira conta." />}
        {accounts?.map((a) => (
          <Card key={a.id} className="p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" />
                  <span className="font-medium">{a.name}</span></div>
                <div className="text-xs text-muted-foreground mt-1">{TYPES.find((t) => t.v === a.type)?.l}</div>
                <div className="text-2xl font-semibold mt-3">{fmt(Number(a.current_balance))}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: a.id, is_active: !a.is_active })}>
                {a.is_active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
