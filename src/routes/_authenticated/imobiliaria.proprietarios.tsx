import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Mail, Phone, Search, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/proprietarios")({
  head: () => ({ meta: [{ title: "Proprietários — Imobiliária" }] }),
  component: Page,
});

type Owner = {
  id: string;
  company_id: string;
  full_name: string;
  document: string | null;
  document_type: "cpf" | "cnpj" | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  preferred_contact: "whatsapp" | "email" | "phone" | null;
  status: "active" | "inactive";
  portal_invited_at: string | null;
  portal_last_login_at: string | null;
  created_at: string;
};

type FormState = Partial<Owner>;

const EMPTY: FormState = {
  full_name: "",
  document: "",
  document_type: "cpf",
  email: "",
  phone: "",
  whatsapp: "",
  notes: "",
  preferred_contact: "whatsapp",
  status: "active",
};

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-owners", companyId, search, statusFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase
        .from("realestate_owners")
        .select("*")
        .eq("company_id", companyId)
        .order("full_name", { ascending: true });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`full_name.ilike.${s},email.ilike.${s},document.ilike.${s},phone.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Owner[];
    },
  });

  const upsertMut = useMutation({
    mutationFn: async (payload: FormState) => {
      if (!companyId) throw new Error("Selecione uma empresa");
      const row = {
        company_id: companyId,
        full_name: payload.full_name?.trim() ?? "",
        document: payload.document?.trim() || null,
        document_type: payload.document_type ?? null,
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        whatsapp: payload.whatsapp?.trim() || null,
        notes: payload.notes?.trim() || null,
        preferred_contact: payload.preferred_contact ?? null,
        status: payload.status ?? "active",
      };
      if (!row.full_name) throw new Error("Nome é obrigatório");
      if (payload.id) {
        const { error } = await supabase.from("realestate_owners").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("realestate_owners").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Proprietário salvo");
      qc.invalidateQueries({ queryKey: ["realestate-owners"] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proprietário removido");
      qc.invalidateQueries({ queryKey: ["realestate-owners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing({ ...EMPTY });
    setOpen(true);
  }
  function openEdit(o: Owner) {
    setEditing(o);
    setOpen(true);
  }

  const owners = data ?? [];

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <PageHeader
        title="Proprietários"
        description="Cadastro de proprietários dos imóveis sob gestão da imobiliária."
        action={
          <Button onClick={openNew} disabled={!companyId}>
            <Plus className="h-4 w-4 mr-1" /> Novo proprietário
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, documento, telefone"
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!companyId && (
        <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          Selecione uma empresa no topo para gerenciar proprietários.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : owners.length === 0 && companyId ? (
        <div className="text-center py-12">
          <EmptyState
            title="Nenhum proprietário cadastrado"
            description="Comece adicionando o primeiro proprietário desta imobiliária."
          />
          <Button onClick={openNew} className="mt-4"><Plus className="h-4 w-4 mr-1" /> Adicionar proprietário</Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-left px-4 py-2">Documento</th>
                <th className="text-left px-4 py-2">Contato</th>
                <th className="text-left px-4 py-2">Canal</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o) => (
                <tr key={o.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2 font-medium">{o.full_name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {o.document ? `${o.document_type?.toUpperCase() ?? ""} ${o.document}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      {o.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{o.email}</span>}
                      {(o.whatsapp || o.phone) && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.whatsapp ?? o.phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline" className="text-xs capitalize">{o.preferred_contact ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-2">
                    <Badge className={o.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}>
                      {o.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(o)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => {
                        if (confirm(`Remover "${o.full_name}"?`)) deleteMut.mutate(o.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar proprietário" : "Novo proprietário"}</DialogTitle>
            <DialogDescription>Dados cadastrais e canais de contato preferidos.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nome completo *</Label>
                <Input value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={editing.document_type ?? "cpf"} onValueChange={(v) => setEditing({ ...editing, document_type: v as "cpf" | "cnpj" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Documento</Label>
                <Input value={editing.document ?? ""} onChange={(e) => setEditing({ ...editing, document: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={editing.whatsapp ?? ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} />
              </div>
              <div>
                <Label>Canal preferido</Label>
                <Select value={editing.preferred_contact ?? "whatsapp"} onValueChange={(v) => setEditing({ ...editing, preferred_contact: v as Owner["preferred_contact"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status ?? "active"} onValueChange={(v) => setEditing({ ...editing, status: v as "active" | "inactive" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Observações</Label>
                <Textarea rows={3} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => editing && upsertMut.mutate(editing)} disabled={upsertMut.isPending}>
              {upsertMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
