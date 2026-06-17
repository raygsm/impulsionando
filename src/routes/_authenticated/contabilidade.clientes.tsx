import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/clientes")({
  head: () => ({ meta: [{ title: "Clientes Contábeis — Impulsionando" }] }),
  component: ContabClientes,
});

interface ContabClient {
  id: string;
  legal_name: string;
  trade_name: string | null;
  document: string;
  document_type: "CNPJ" | "CPF";
  tax_regime: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  monthly_fee: number | null;
  status: string;
  notes: string | null;
}

const REGIMES = [
  { v: "mei", l: "MEI" },
  { v: "simples", l: "Simples Nacional" },
  { v: "lucro_presumido", l: "Lucro Presumido" },
  { v: "lucro_real", l: "Lucro Real" },
  { v: "imune", l: "Imune" },
  { v: "isento", l: "Isento" },
];

const STATUS = [
  { v: "active", l: "Ativo", c: "bg-green-500/15 text-green-700 dark:text-green-300" },
  { v: "onboarding", l: "Onboarding", c: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { v: "inactive", l: "Inativo", c: "bg-gray-500/15 text-gray-600" },
  { v: "suspended", l: "Suspenso", c: "bg-amber-500/15 text-amber-700" },
  { v: "churned", l: "Cancelado", c: "bg-red-500/15 text-red-700" },
];

const empty = {
  legal_name: "", trade_name: "", document: "", document_type: "CNPJ" as const,
  tax_regime: "simples", contact_name: "", contact_email: "", contact_phone: "",
  monthly_fee: 0, status: "active", notes: "",
};

function ContabClientes() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [editing, setEditing] = useState<ContabClient | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data: items, isLoading } = useQuery({
    queryKey: ["contab-clients", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contab_clients")
        .select("*")
        .eq("company_id", companyId!)
        .order("legal_name");
      if (error) throw error;
      return data as ContabClient[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        legal_name: form.legal_name,
        trade_name: form.trade_name || null,
        document: form.document,
        document_type: form.document_type,
        tax_regime: form.tax_regime || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        monthly_fee: Number(form.monthly_fee) || 0,
        status: form.status,
        notes: form.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("contab_clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contab_clients").insert({ ...payload, company_id: companyId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Cliente atualizado" : "Cliente criado");
      qc.invalidateQueries({ queryKey: ["contab-clients"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      qc.invalidateQueries({ queryKey: ["contab-clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: ContabClient) {
    setEditing(c);
    setForm({
      legal_name: c.legal_name,
      trade_name: c.trade_name ?? "",
      document: c.document,
      document_type: c.document_type,
      tax_regime: c.tax_regime ?? "simples",
      contact_name: c.contact_name ?? "",
      contact_email: c.contact_email ?? "",
      contact_phone: c.contact_phone ?? "",
      monthly_fee: Number(c.monthly_fee ?? 0),
      status: c.status,
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Clientes Contábeis"
        description="Cadastro dos clientes do escritório — CNPJ/CPF, regime tributário e responsável."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" />Novo cliente
            </Button>
          </div>
        }
      />

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}

      {!isLoading && !items?.length && (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre o primeiro cliente contábil do escritório."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items?.map((c) => {
          const st = STATUS.find((s) => s.v === c.status);
          const reg = REGIMES.find((r) => r.v === c.tax_regime);
          return (
            <Card key={c.id} className="shadow-card p-4">
              <div className="flex items-start gap-2">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.trade_name || c.legal_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.legal_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.document_type}: {c.document}</div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {st && <Badge className={st.c} variant="secondary">{st.l}</Badge>}
                    {reg && <Badge variant="outline">{reg.l}</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <div className="text-xs text-muted-foreground">
                  R$ {Number(c.monthly_fee ?? 0).toFixed(2)}/mês
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover cliente?")) remove.mutate(c.id); }}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} cliente contábil</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Razão social *</Label><Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} /></div>
              <div><Label>Nome fantasia</Label><Input value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v as "CNPJ" | "CPF" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CNPJ">CNPJ</SelectItem><SelectItem value="CPF">CPF</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Documento *</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Regime tributário</Label>
                <Select value={form.tax_regime} onValueChange={(v) => setForm({ ...form, tax_regime: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIMES.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Contato</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
            </div>
            <div><Label>Honorário mensal (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) })} />
            </div>
            <div><Label>Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button
              className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.legal_name || !form.document || save.isPending}
              onClick={() => save.mutate()}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
