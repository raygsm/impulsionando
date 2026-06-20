import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Loader2, Plus, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/contratos")({
  head: () => ({ meta: [{ title: "Contratos — Imobiliária" }] }),
  component: Page,
});

type Contract = {
  id: string; company_id: string;
  property_id: string | null; owner_id: string | null;
  client_name: string; client_document: string | null;
  contract_type: "sale" | "rent"; value: number | null;
  status: "draft" | "signing" | "active" | "finished" | "canceled";
  start_date: string | null; end_date: string | null; signed_at: string | null;
  document_url: string | null; notes: string | null;
};
type Form = Partial<Contract>;

const STATUS_LABEL: Record<Contract["status"], string> = {
  draft: "Rascunho", signing: "Em assinatura", active: "Ativo", finished: "Finalizado", canceled: "Cancelado",
};
const STATUS_COLOR: Record<Contract["status"], string> = {
  draft: "bg-zinc-200 text-zinc-700",
  signing: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  finished: "bg-violet-100 text-violet-800",
  canceled: "bg-rose-100 text-rose-800",
};

const EMPTY: Form = { client_name: "", contract_type: "sale", status: "draft" };

const fmtBRL = (v: number | null) => v == null ? "—" :
  new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v);

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | Contract["status"]>("all");
  const [editing, setEditing] = useState<Form | null>(null);
  const [open, setOpen] = useState(false);

  const { data: properties } = useQuery({
    queryKey: ["realestate-properties-short", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_properties").select("id, title").eq("company_id", companyId).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: owners } = useQuery({
    queryKey: ["realestate-owners-short", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_owners").select("id, full_name").eq("company_id", companyId).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-contracts", companyId, statusFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("realestate_contracts").select("*")
        .eq("company_id", companyId).order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Contract[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Form) => {
      if (!companyId) throw new Error("Selecione uma empresa");
      if (!p.client_name?.trim()) throw new Error("Cliente obrigatório");
      const row = {
        company_id: companyId,
        property_id: p.property_id || null,
        owner_id: p.owner_id || null,
        client_name: p.client_name.trim(),
        client_document: p.client_document?.trim() || null,
        contract_type: p.contract_type ?? "sale",
        value: p.value ?? null,
        status: p.status ?? "draft",
        start_date: p.start_date || null,
        end_date: p.end_date || null,
        signed_at: p.signed_at || null,
        document_url: p.document_url?.trim() || null,
        notes: p.notes?.trim() || null,
      };
      if (p.id) {
        const { error } = await supabase.from("realestate_contracts").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("realestate_contracts").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Contrato salvo");
      qc.invalidateQueries({ queryKey: ["realestate-contracts"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contrato removido"); qc.invalidateQueries({ queryKey: ["realestate-contracts"] }); },
  });

  const contracts = data ?? [];
  const propMap = new Map((properties ?? []).map(p => [p.id, p.title]));
  const ownerMap = new Map((owners ?? []).map(o => [o.id, o.full_name]));

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <PageHeader
        title="Contratos"
        description="Gestão de contratos de venda e locação."
        action={<Button onClick={() => { setEditing({ ...EMPTY }); setOpen(true); }} disabled={!companyId}>
          <Plus className="h-4 w-4 mr-1" /> Novo contrato
        </Button>}
      />

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
      ) : contracts.length === 0 ? (
        <EmptyState title="Nenhum contrato" description="Cadastre o primeiro contrato." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Imóvel</th>
                <th className="text-left px-4 py-2">Proprietário</th>
                <th className="text-right px-4 py-2">Valor</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2"><Badge variant="outline" className="capitalize">{c.contract_type === "sale" ? "Venda" : "Locação"}</Badge></td>
                  <td className="px-4 py-2 font-medium">{c.client_name}<div className="text-xs text-muted-foreground">{c.client_document ?? ""}</div></td>
                  <td className="px-4 py-2 text-muted-foreground">{c.property_id ? propMap.get(c.property_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{c.owner_id ? ownerMap.get(c.owner_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-2 text-right font-medium">{fmtBRL(c.value)}</td>
                  <td className="px-4 py-2"><Badge className={STATUS_COLOR[c.status]}>{STATUS_LABEL[c.status]}</Badge></td>
                  <td className="px-4 py-2 text-right">
                    {c.document_url && (
                      <a href={c.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary hover:underline mr-2">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-rose-600"
                      onClick={() => { if (confirm("Remover contrato?")) del.mutate(c.id); }}>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />{editing?.id ? "Editar contrato" : "Novo contrato"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div><Label>Tipo *</Label>
                <Select value={editing.contract_type ?? "sale"} onValueChange={(v) => setEditing({ ...editing, contract_type: v as Contract["contract_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="sale">Venda</SelectItem><SelectItem value="rent">Locação</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v as Contract["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
              <div className="sm:col-span-2">
                <Label>Proprietário</Label>
                <Select value={editing.owner_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, owner_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhum —</SelectItem>
                    {(owners ?? []).map(o => <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$)</Label><Input type="number" value={editing.value ?? ""} onChange={(e) => setEditing({ ...editing, value: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Assinado em</Label><Input type="date" value={editing.signed_at?.slice(0,10) ?? ""} onChange={(e) => setEditing({ ...editing, signed_at: e.target.value || null })} /></div>
              <div><Label>Início</Label><Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value || null })} /></div>
              <div><Label>Fim</Label><Input type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value || null })} /></div>
              <div className="sm:col-span-2"><Label>URL do documento</Label><Input value={editing.document_url ?? ""} onChange={(e) => setEditing({ ...editing, document_url: e.target.value })} placeholder="https://..." /></div>
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
