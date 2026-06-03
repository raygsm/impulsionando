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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory/suppliers")({
  head: () => ({ meta: [{ title: "Fornecedores — Estoque" }] }),
  component: Page,
});

const empty = { name: "", legal_name: "", document: "", email: "", phone: "", notes: "" };

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data } = useQuery({
    queryKey: ["inv-sups", companyId], enabled: !!companyId,
    queryFn: async () => (await supabase.from("inv_suppliers").select("*").eq("company_id", companyId).order("name")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inv_suppliers").insert({
        company_id: companyId, name: form.name,
        legal_name: form.legal_name || null, document: form.document || null,
        email: form.email || null, phone: form.phone || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-sups"] }); setOpen(false); setForm(empty); toast.success("Criado"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("inv_suppliers").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-sups"] }); toast.success("Excluído"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Fornecedores" description="Gerencie sua rede de fornecedores." action={
        <div className="flex gap-2"><CompanyPicker />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo fornecedor</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nome fantasia *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="col-span-2"><Label>Razão social</Label><Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} /></div>
                <div><Label>CNPJ/CPF</Label><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="col-span-2"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="col-span-2"><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog></div>
      } />
      <Card className="shadow-card divide-y">
        {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</div>}
        {data?.map((s) => (
          <div key={s.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{s.name}</div>
              <div className="text-xs text-muted-foreground truncate">{[s.document, s.phone, s.email].filter(Boolean).join(" · ") || "—"}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir?")) del.mutate(s.id); }}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
