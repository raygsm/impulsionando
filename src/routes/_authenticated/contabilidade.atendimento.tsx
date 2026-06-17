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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MessageCircle, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/atendimento")({
  head: () => ({ meta: [{ title: "Atendimento — Contabilidade" }] }),
  component: ContabAtendimento,
});

interface Dept {
  id: string; name: string; slug: string; description: string | null; color: string;
  whatsapp_phone: string | null; whatsapp_keywords: string[]; is_active: boolean; sort_order: number;
}

const empty = {
  name: "", slug: "", description: "", color: "#10b981",
  whatsapp_phone: "", keywords: "", is_active: true, sort_order: 0,
};

const PRESETS = [
  { name: "Fiscal", slug: "fiscal", keywords: "nota, nf, fiscal, sped, icms, iss, das", color: "#3b82f6" },
  { name: "Contábil", slug: "contabil", keywords: "balanço, balancete, dre, conciliação", color: "#10b981" },
  { name: "Pessoal", slug: "pessoal", keywords: "folha, holerite, fgts, inss, admissão, demissão", color: "#f59e0b" },
  { name: "Societário", slug: "societario", keywords: "contrato social, alteração, abertura, baixa", color: "#8b5cf6" },
  { name: "Comercial", slug: "comercial", keywords: "proposta, honorário, contratação", color: "#ec4899" },
];

function ContabAtendimento() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [form, setForm] = useState(empty);

  const { data: items, isLoading } = useQuery({
    queryKey: ["contab-depts", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_departments")
        .select("*").eq("company_id", companyId!).order("sort_order").order("name");
      if (error) throw error;
      return data as Dept[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: form.description || null,
        color: form.color,
        whatsapp_phone: form.whatsapp_phone || null,
        whatsapp_keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      if (editing) {
        const { error } = await supabase.from("contab_departments").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contab_departments").insert({ ...payload, company_id: companyId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Atualizado" : "Departamento criado");
      qc.invalidateQueries({ queryKey: ["contab-depts"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seed = useMutation({
    mutationFn: async () => {
      const payload = PRESETS.map((p, i) => ({
        company_id: companyId!,
        name: p.name, slug: p.slug, color: p.color,
        whatsapp_keywords: p.keywords.split(",").map((s) => s.trim()),
        is_active: true, sort_order: i,
      }));
      const { error } = await supabase.from("contab_departments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Departamentos padrão criados"); qc.invalidateQueries({ queryKey: ["contab-depts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["contab-depts"] }); },
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(d: Dept) {
    setEditing(d);
    setForm({
      name: d.name, slug: d.slug, description: d.description ?? "", color: d.color,
      whatsapp_phone: d.whatsapp_phone ?? "", keywords: (d.whatsapp_keywords || []).join(", "),
      is_active: d.is_active, sort_order: d.sort_order,
    });
    setOpen(true);
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Atendimento"
        description="Departamentos para triagem de WhatsApp — palavras-chave roteiam mensagens automaticamente."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </div>
        }
      />

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !items?.length && (
        <Card className="p-8 text-center">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-2">Nenhum departamento</p>
          <p className="text-sm text-muted-foreground mb-4">Crie os departamentos padrão (Fiscal, Contábil, Pessoal, Societário, Comercial).</p>
          <Button onClick={() => seed.mutate()} disabled={seed.isPending}>Criar departamentos padrão</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items?.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 self-stretch rounded-sm" style={{ background: d.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{d.name}</div>
                  {!d.is_active && <Badge variant="outline">inativo</Badge>}
                </div>
                <code className="text-[10px] text-muted-foreground">{d.slug}</code>
                {d.whatsapp_phone && (
                  <div className="text-xs mt-1 flex items-center gap-1 text-muted-foreground">
                    <Phone className="w-3 h-3" />{d.whatsapp_phone}
                  </div>
                )}
                <div className="flex gap-1 flex-wrap mt-2">
                  {(d.whatsapp_keywords || []).slice(0, 4).map((k) => (
                    <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>
                  ))}
                  {(d.whatsapp_keywords?.length || 0) > 4 && (
                    <Badge variant="outline" className="text-[10px]">+{d.whatsapp_keywords.length - 4}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-1 mt-3">
              <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(d.id); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} departamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></div>
            </div>
            <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>WhatsApp</Label><Input value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} placeholder="+55 11 90000-0000" /></div>
              <div><Label>Cor</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            </div>
            <div>
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Textarea rows={2} value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="nota, fiscal, sped, icms" />
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Ativo</Label></div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.name || save.isPending}
              onClick={() => save.mutate()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
