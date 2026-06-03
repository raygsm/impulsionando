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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda/professionals")({
  head: () => ({ meta: [{ title: "Profissionais — Agenda" }] }),
  component: ProfessionalsPage,
});

interface Pro {
  id: string; name: string; email: string | null; phone: string | null;
  color: string; commission_pct: number; is_active: boolean; bio: string | null;
}

const empty = { name: "", email: "", phone: "", color: "#6366f1", commission_pct: 0, bio: "", is_active: true };

function ProfessionalsPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [editing, setEditing] = useState<Pro | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data: pros } = useQuery({
    queryKey: ["agenda-pros", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("agenda_professionals")
        .select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data as Pro[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("agenda_professionals").update({
          name: form.name, email: form.email || null, phone: form.phone || null,
          color: form.color, commission_pct: form.commission_pct, bio: form.bio || null, is_active: form.is_active,
        }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agenda_professionals").insert({
          company_id: companyId, name: form.name, email: form.email || null, phone: form.phone || null,
          color: form.color, commission_pct: form.commission_pct, bio: form.bio || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Atualizado" : "Criado");
      qc.invalidateQueries({ queryKey: ["agenda-pros"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["agenda-pros"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(p: Pro) {
    setEditing(p);
    setForm({ name: p.name, email: p.email ?? "", phone: p.phone ?? "", color: p.color,
              commission_pct: p.commission_pct, bio: p.bio ?? "", is_active: p.is_active });
    setOpen(true);
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader title="Profissionais" description="Pessoas que prestam atendimento nesta empresa."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" />Novo
            </Button>
          </div>
        }
      />

      <Card className="shadow-card divide-y">
        {!pros?.length && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum profissional cadastrado.</div>}
        {pros?.map((p) => (
          <div key={p.id} className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: p.color }}>
              {p.name.slice(0,1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm truncate">{p.name}</div>
                {!p.is_active && <Badge variant="outline">inativo</Badge>}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {p.email ?? "—"} {p.phone && `· ${p.phone}`} · comissão {p.commission_pct}%
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(p.id); }}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} profissional</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              <div><Label>Comissão (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={form.commission_pct}
                  onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })} />
              </div>
            </div>
            <div><Label>Bio</Label><Input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
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
