import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search, Users, ShieldOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Clientes" }] }),
  component: Page,
});

type CustomerRow = {
  id: string; company_id: string; unit_id: string | null;
  name: string; email: string | null; phone: string | null; document: string | null;
  birthdate: string | null; gender: string | null;
  address_line: string | null; address_city: string | null; address_state: string | null; address_zip: string | null;
  tags: string[]; notes: string | null; lead_id: string | null; is_active: boolean;
  created_at: string;
  anonymized_at: string | null;
  anonymization_reason: string | null;
};

const emptyForm = {
  name: "", email: "", phone: "", document: "", birthdate: "", gender: "",
  unit_id: "", address_line: "", address_city: "", address_state: "", address_zip: "",
  tags: "", notes: "", is_active: true,
};

function Page() {
  const { companyId } = useActiveCompany();
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [anonTarget, setAnonTarget] = useState<CustomerRow | null>(null);
  const [anonReason, setAnonReason] = useState("");

  const { data: units } = useQuery({
    queryKey: ["company-units", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("company_units").select("id,name").eq("company_id", companyId).order("name")).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["customers", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data as CustomerRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((c) =>
      [c.name, c.email, c.phone, c.document].filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
    );
  }, [data, q]);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c: CustomerRow) {
    setEditing(c);
    setForm({
      name: c.name, email: c.email ?? "", phone: c.phone ?? "", document: c.document ?? "",
      birthdate: c.birthdate ?? "", gender: c.gender ?? "", unit_id: c.unit_id ?? "",
      address_line: c.address_line ?? "", address_city: c.address_city ?? "",
      address_state: c.address_state ?? "", address_zip: c.address_zip ?? "",
      tags: (c.tags ?? []).join(", "), notes: c.notes ?? "", is_active: c.is_active,
    });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Nome é obrigatório");
      const payload = {
        company_id: companyId,
        unit_id: form.unit_id || null,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        document: form.document.trim() || null,
        birthdate: form.birthdate || null,
        gender: form.gender || null,
        address_line: form.address_line || null,
        address_city: form.address_city || null,
        address_state: form.address_state || null,
        address_zip: form.address_zip || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        notes: form.notes || null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("customers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert({ ...payload, created_by: me?.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); toast.success(editing ? "Atualizado" : "Criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("customers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const anonymize = useMutation({
    mutationFn: async () => {
      if (!anonTarget) throw new Error("Sem cliente");
      const { error } = await supabase.rpc("customer_anonymize", {
        _customer_id: anonTarget.id,
        _reason: anonReason.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente anonimizado (LGPD)");
      setAnonTarget(null);
      setAnonReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa para gerenciar clientes." />;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro único de clientes integrado a CRM, agenda e vendas."
        action={
          <div className="flex gap-2">
            <CompanyPicker />
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Novo cliente</Button>
          </div>
        }
      />

      <Card className="shadow-card">
        <div className="p-3 border-b flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail, telefone ou documento" value={q} onChange={(e) => setQ(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
          <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{filtered.length}</Badge>
        </div>
        <div className="divide-y">
          {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>}
          {!isLoading && !filtered.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</div>}
          {filtered.map((c) => (
            <div key={c.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  {c.anonymized_at && <Badge variant="destructive" className="text-xs">Anonimizado</Badge>}
                  {!c.is_active && !c.anonymized_at && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                  {c.tags?.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {[c.document, c.phone, c.email].filter(Boolean).join(" · ") || "Sem contato"}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => openEdit(c)} disabled={!!c.anonymized_at}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" title="Anonimizar (LGPD)" onClick={() => setAnonTarget(c)} disabled={!!c.anonymized_at}><ShieldOff className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Excluir ${c.name}?`)) del.mutate(c.id); }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Documento (CPF/CNPJ)</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Nascimento</Label><Input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} /></div>
            <div>
              <Label>Gênero</Label>
              <Select value={form.gender || "none"} onValueChange={(v) => setForm({ ...form, gender: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={form.unit_id || "none"} onValueChange={(v) => setForm({ ...form, unit_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {units?.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Endereço</Label><Input value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={form.address_city} onChange={(e) => setForm({ ...form, address_city: e.target.value })} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={form.address_state} onChange={(e) => setForm({ ...form, address_state: e.target.value.toUpperCase() })} /></div>
            <div><Label>CEP</Label><Input value={form.address_zip} onChange={(e) => setForm({ ...form, address_zip: e.target.value })} /></div>
            <div><Label>Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vip, recorrente" /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim()}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!anonTarget} onOpenChange={(o) => { if (!o) { setAnonTarget(null); setAnonReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anonimizar cliente (LGPD)</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Esta ação atende ao direito ao esquecimento. Dados pessoais (nome, contato, documento, endereço) de <b>{anonTarget?.name}</b> serão removidos permanentemente. O histórico de vendas e agendamentos é preservado para fins fiscais e contábeis. <b>Não é reversível.</b>
            </p>
            <div>
              <Label>Motivo / referência da solicitação</Label>
              <Textarea rows={3} value={anonReason} onChange={(e) => setAnonReason(e.target.value)} placeholder="Ex: solicitação do titular em 03/06/2026, protocolo #123" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnonTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => anonymize.mutate()} disabled={anonymize.isPending}>
              <ShieldOff className="w-4 h-4 mr-1" />Confirmar anonimização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
