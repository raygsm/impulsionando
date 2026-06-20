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
import { Loader2, Plus, Pencil, Trash2, FileText, ExternalLink, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/documentos")({
  head: () => ({ meta: [{ title: "Documentação — Imobiliária" }] }),
  component: Page,
});

type Doc = {
  id: string; company_id: string;
  property_id: string | null; owner_id: string | null; contract_id: string | null;
  title: string; doc_type: string; file_url: string | null;
  expires_at: string | null; status: string; notes: string | null;
};
type Form = Partial<Doc>;

const TYPE_LABEL: Record<string, string> = {
  matricula: "Matrícula", escritura: "Escritura", iptu: "IPTU",
  comprovante: "Comprovante", contrato: "Contrato", rg_cpf: "RG/CPF",
  procuracao: "Procuração", laudo: "Laudo", outro: "Outro",
};

const EMPTY: Form = { title: "", doc_type: "outro", status: "valid" };

function isExpired(d: string | null) { return !!d && d < new Date().toISOString().slice(0,10); }
function isExpiringSoon(d: string | null) {
  if (!d) return false;
  const days = (new Date(d).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= 30;
}

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
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
  const { data: owners } = useQuery({
    queryKey: ["realestate-owners-short", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("realestate_owners").select("id, full_name").eq("company_id", companyId).limit(500);
      if (error) throw error; return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-documents", companyId, typeFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("realestate_documents").select("*")
        .eq("company_id", companyId).order("created_at", { ascending: false });
      if (typeFilter !== "all") q = q.eq("doc_type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (p: Form) => {
      if (!companyId) throw new Error("Selecione uma empresa");
      if (!p.title?.trim()) throw new Error("Título obrigatório");
      const row = {
        company_id: companyId,
        property_id: p.property_id || null,
        owner_id: p.owner_id || null,
        contract_id: p.contract_id || null,
        title: p.title.trim(),
        doc_type: p.doc_type ?? "outro",
        file_url: p.file_url?.trim() || null,
        expires_at: p.expires_at || null,
        status: p.status ?? "valid",
        notes: p.notes?.trim() || null,
      };
      if (p.id) {
        const { error } = await supabase.from("realestate_documents").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("realestate_documents").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Documento salvo"); qc.invalidateQueries({ queryKey: ["realestate-documents"] }); setOpen(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Documento removido"); qc.invalidateQueries({ queryKey: ["realestate-documents"] }); },
  });

  const docs = data ?? [];
  const propMap = new Map((properties ?? []).map(p => [p.id, p.title]));
  const ownerMap = new Map((owners ?? []).map(o => [o.id, o.full_name]));
  const expired = docs.filter(d => isExpired(d.expires_at)).length;
  const expiring = docs.filter(d => isExpiringSoon(d.expires_at)).length;

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <PageHeader title="Documentação" description="Biblioteca de documentos vinculados a imóveis, proprietários e contratos."
        action={<Button onClick={() => { setEditing({ ...EMPTY }); setOpen(true); }} disabled={!companyId}>
          <Plus className="h-4 w-4 mr-1" /> Novo documento
        </Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Total" value={docs.length} />
        <Stat label="Vencendo em 30d" value={expiring} tone="amber" />
        <Stat label="Vencidos" value={expired} tone="rose" />
        <Stat label="Tipos" value={Object.keys(TYPE_LABEL).length} />
      </div>

      <div className="flex gap-3 mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TYPE_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!companyId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">Selecione uma empresa.</div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : docs.length === 0 ? (
        <EmptyState title="Nenhum documento" description="Cadastre o primeiro documento." />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Título</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Vínculo</th>
                <th className="text-left px-4 py-2">Validade</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => {
                const exp = isExpired(d.expires_at);
                const soon = isExpiringSoon(d.expires_at);
                return (
                  <tr key={d.id} className="border-t hover:bg-accent/30">
                    <td className="px-4 py-2 font-medium flex items-center gap-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />{d.title}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{TYPE_LABEL[d.doc_type] ?? d.doc_type}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {d.property_id && <div>🏠 {propMap.get(d.property_id) ?? "—"}</div>}
                      {d.owner_id && <div>👤 {ownerMap.get(d.owner_id) ?? "—"}</div>}
                    </td>
                    <td className="px-4 py-2">
                      {d.expires_at ? (
                        <Badge className={exp ? "bg-rose-100 text-rose-800" : soon ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
                          {exp && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                          {new Date(d.expires_at).toLocaleDateString("pt-BR")}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {d.file_url && (
                        <a href={d.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary hover:underline mr-2">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-rose-600"
                        onClick={() => { if (confirm("Remover documento?")) del.mutate(d.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar documento" : "Novo documento"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Título *</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Tipo</Label>
                <Select value={editing.doc_type ?? "outro"} onValueChange={(v) => setEditing({ ...editing, doc_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_LABEL).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Validade</Label><Input type="date" value={editing.expires_at ?? ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value || null })} /></div>
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
              <div className="sm:col-span-2"><Label>URL do arquivo</Label><Input value={editing.file_url ?? ""} onChange={(e) => setEditing({ ...editing, file_url: e.target.value })} placeholder="https://..." /></div>
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

function Stat({ label, value, tone }: { label: string; value: number; tone?: "amber" | "rose" }) {
  const bg = tone === "amber" ? "bg-amber-50 border-amber-200" : tone === "rose" ? "bg-rose-50 border-rose-200" : "bg-card";
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
