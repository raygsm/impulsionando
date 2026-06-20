import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Banknote, Calculator } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/financiamento")({
  head: () => ({ meta: [{ title: "Financiamento — Imobiliária" }] }),
  component: Page,
});

type Fin = {
  id: string; company_id: string;
  property_id: string | null; contract_id: string | null;
  client_name: string; client_document: string | null; bank: string | null;
  property_value: number | null; down_payment: number | null; financed_value: number | null;
  term_months: number | null; interest_rate: number | null; monthly_installment: number | null;
  status: "simulation" | "submitted" | "approved" | "denied" | "signed";
  submitted_at: string | null; approved_at: string | null; denied_reason: string | null; notes: string | null;
};
type Form = Partial<Fin>;

const STATUS_LABEL: Record<Fin["status"], string> = {
  simulation: "Simulação", submitted: "Submetido", approved: "Aprovado", denied: "Negado", signed: "Assinado",
};
const STATUS_COLOR: Record<Fin["status"], string> = {
  simulation: "bg-zinc-200 text-zinc-700",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  denied: "bg-rose-100 text-rose-800",
  signed: "bg-violet-100 text-violet-800",
};

const EMPTY: Form = { client_name: "", status: "simulation" };

const fmtBRL = (v: number | null | undefined) => v == null ? "—" :
  new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v);

// PMT (Price/SAC simples = Price)
function calcInstallment(financed: number, rateMonthly: number, months: number) {
  if (!financed || !months) return null;
  if (!rateMonthly) return financed / months;
  const i = rateMonthly / 100;
  return (financed * i) / (1 - Math.pow(1 + i, -months));
}

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | Fin["status"]>("all");
  const [editing, setEditing] = useState<Form | null>(null);
  const [open, setOpen] = useState(false);

  const { data: properties } = useQuery({
    queryKey: ["realestate-properties-short", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("realestate_properties").select("id, title").eq("company_id", companyId).limit(500);
      if (error) throw error; return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-financings", companyId, statusFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("realestate_financings").select("*")
        .eq("company_id", companyId).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Fin[];
    },
  });

  const simulated = useMemo(() => {
    if (!editing) return null;
    const fin = (editing.property_value ?? 0) - (editing.down_payment ?? 0);
    const inst = calcInstallment(fin, editing.interest_rate ?? 0, editing.term_months ?? 0);
    return { fin, inst };
  }, [editing]);

  const upsert = useMutation({
    mutationFn: async (p: Form) => {
      if (!companyId) throw new Error("Selecione uma empresa");
      if (!p.client_name?.trim()) throw new Error("Cliente obrigatório");
      const financed = (p.property_value ?? 0) - (p.down_payment ?? 0);
      const installment = calcInstallment(financed, p.interest_rate ?? 0, p.term_months ?? 0);
      const row = {
        company_id: companyId,
        property_id: p.property_id || null,
        contract_id: p.contract_id || null,
        client_name: p.client_name.trim(),
        client_document: p.client_document?.trim() || null,
        bank: p.bank?.trim() || null,
        property_value: p.property_value ?? null,
        down_payment: p.down_payment ?? null,
        financed_value: financed || null,
        term_months: p.term_months ?? null,
        interest_rate: p.interest_rate ?? null,
        monthly_installment: installment,
        status: p.status ?? "simulation",
        submitted_at: p.submitted_at || null,
        approved_at: p.approved_at || null,
        denied_reason: p.denied_reason?.trim() || null,
        notes: p.notes?.trim() || null,
      };
      if (p.id) {
        const { error } = await supabase.from("realestate_financings").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("realestate_financings").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Financiamento salvo"); qc.invalidateQueries({ queryKey: ["realestate-financings"] }); setOpen(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_financings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["realestate-financings"] }); },
  });

  const fins = data ?? [];
  const propMap = new Map((properties ?? []).map(p => [p.id, p.title]));
  const totalFinanced = fins.reduce((s, f) => s + (f.financed_value ?? 0), 0);
  const approved = fins.filter(f => f.status === "approved" || f.status === "signed").length;

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <PageHeader title="Financiamento" description="Pipeline de financiamento bancário com simulador integrado."
        action={<Button onClick={() => { setEditing({ ...EMPTY }); setOpen(true); }} disabled={!companyId}>
          <Plus className="h-4 w-4 mr-1" /> Novo financiamento
        </Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={fins.length} />
        <Stat label="Aprovados/Assinados" value={approved} />
        <Stat label="Volume financiado" value={fmtBRL(totalFinanced)} />
        <Stat label="Em análise" value={fins.filter(f => f.status === "submitted").length} />
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!companyId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">Selecione uma empresa.</div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : fins.length === 0 ? (
        <EmptyState title="Nenhum financiamento" description="Cadastre a primeira simulação." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Banco</th>
                <th className="text-left px-4 py-2">Imóvel</th>
                <th className="text-right px-4 py-2">Financiado</th>
                <th className="text-right px-4 py-2">Parcela</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fins.map(f => (
                <tr key={f.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2 font-medium">{f.client_name}<div className="text-xs text-muted-foreground">{f.client_document ?? ""}</div></td>
                  <td className="px-4 py-2 text-muted-foreground flex items-center gap-1"><Banknote className="h-3 w-3" />{f.bank ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{f.property_id ? propMap.get(f.property_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-2 text-right">{fmtBRL(f.financed_value)}</td>
                  <td className="px-4 py-2 text-right">{fmtBRL(f.monthly_installment)} <span className="text-xs text-muted-foreground">/{f.term_months ?? "?"}m</span></td>
                  <td className="px-4 py-2"><Badge className={STATUS_COLOR[f.status]}>{STATUS_LABEL[f.status]}</Badge></td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-rose-600"
                      onClick={() => { if (confirm("Remover?")) del.mutate(f.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calculator className="h-4 w-4" />{editing?.id ? "Editar financiamento" : "Novo financiamento"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div><Label>Cliente *</Label><Input value={editing.client_name ?? ""} onChange={(e) => setEditing({ ...editing, client_name: e.target.value })} /></div>
              <div><Label>CPF/CNPJ</Label><Input value={editing.client_document ?? ""} onChange={(e) => setEditing({ ...editing, client_document: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <Label>Imóvel</Label>
                <Select value={editing.property_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, property_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhum —</SelectItem>
                    {(properties ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Banco</Label><Input value={editing.bank ?? ""} onChange={(e) => setEditing({ ...editing, bank: e.target.value })} placeholder="Ex.: Caixa, BB, Itaú" /></div>
              <div><Label>Status</Label>
                <Select value={editing.status ?? "simulation"} onValueChange={(v) => setEditing({ ...editing, status: v as Fin["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor do imóvel</Label><Input type="number" value={editing.property_value ?? ""} onChange={(e) => setEditing({ ...editing, property_value: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Entrada</Label><Input type="number" value={editing.down_payment ?? ""} onChange={(e) => setEditing({ ...editing, down_payment: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Prazo (meses)</Label><Input type="number" value={editing.term_months ?? ""} onChange={(e) => setEditing({ ...editing, term_months: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Juros (% a.m.)</Label><Input type="number" step="0.01" value={editing.interest_rate ?? ""} onChange={(e) => setEditing({ ...editing, interest_rate: e.target.value ? Number(e.target.value) : null })} /></div>
              {simulated && (
                <div className="sm:col-span-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <b>Simulação:</b> Financiado <b>{fmtBRL(simulated.fin)}</b> →
                  Parcela mensal <b>{fmtBRL(simulated.inst)}</b>
                </div>
              )}
              <div><Label>Submetido em</Label><Input type="date" value={editing.submitted_at?.slice(0,10) ?? ""} onChange={(e) => setEditing({ ...editing, submitted_at: e.target.value || null })} /></div>
              <div><Label>Aprovado em</Label><Input type="date" value={editing.approved_at?.slice(0,10) ?? ""} onChange={(e) => setEditing({ ...editing, approved_at: e.target.value || null })} /></div>
              <div className="sm:col-span-2"><Label>Motivo da negativa</Label><Textarea rows={2} value={editing.denied_reason ?? ""} onChange={(e) => setEditing({ ...editing, denied_reason: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={2} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => editing && upsert.mutate(editing)} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
