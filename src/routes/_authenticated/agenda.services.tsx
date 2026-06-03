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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/services")({
  head: () => ({ meta: [{ title: "Serviços — Agenda" }] }),
  component: ServicesPage,
});

interface Service {
  id: string; name: string; description: string | null; duration_min: number;
  price: number; color: string; is_active: boolean;
}

const empty = { name: "", description: "", duration_min: 30, price: 0, color: "#10b981", is_active: true };

function ServicesPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data: items } = useQuery({
    queryKey: ["agenda-services", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_services").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data as Service[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, description: form.description || null, duration_min: form.duration_min,
        price: form.price, color: form.color, is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("agenda_services").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agenda_services").insert({ ...payload, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Atualizado" : "Criado");
      qc.invalidateQueries({ queryKey: ["agenda-services"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["agenda-services"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, description: s.description ?? "", duration_min: s.duration_min,
              price: s.price, color: s.color, is_active: s.is_active });
    setOpen(true);
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Serviços" description="Catálogo de serviços oferecidos."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" />Novo
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {!items?.length && <div className="col-span-full text-center text-sm text-muted-foreground p-8">Nenhum serviço cadastrado.</div>}
        {items?.map((s) => (
          <Card key={s.id} className="shadow-card p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 self-stretch rounded-sm" style={{ background: s.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{s.name}</div>
                  {!s.is_active && <Badge variant="outline">inativo</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{s.duration_min} min · R$ {Number(s.price).toFixed(2)}</div>
                {s.description && <div className="text-xs mt-2 text-muted-foreground line-clamp-2">{s.description}</div>}
              </div>
            </div>
            <div className="flex justify-end gap-1 mt-3">
              <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(s.id); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} serviço</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Duração (min)</Label>
                <Input type="number" min={5} max={1440} step={5} value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} />
              </div>
              <div><Label>Preço (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            </div>
            {editing && (
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Ativo</Label></div>
            )}
            <Button className="w-full bg-gradient-primary shadow-elegant" disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
