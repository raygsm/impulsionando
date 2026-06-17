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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CalendarClock, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/calendario")({
  head: () => ({ meta: [{ title: "Calendário Fiscal — Impulsionando" }] }),
  component: ContabCalendario,
});

interface CalEvt {
  id: string; title: string; obligation_type: string; scope: string;
  state_code: string | null; recurrence: string; day_of_month: number | null;
  description: string | null; is_active: boolean;
}

const SCOPE = [
  { v: "federal", l: "Federal" },
  { v: "state", l: "Estadual" },
  { v: "municipal", l: "Municipal" },
  { v: "labor", l: "Trabalhista" },
  { v: "custom", l: "Personalizada" },
];
const RECUR = [
  { v: "monthly", l: "Mensal" },
  { v: "quarterly", l: "Trimestral" },
  { v: "yearly", l: "Anual" },
  { v: "one_off", l: "Uma vez" },
];

const empty = {
  title: "", obligation_type: "das", scope: "federal", state_code: "",
  recurrence: "monthly", day_of_month: 20, description: "", is_active: true,
};

function ContabCalendario() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalEvt | null>(null);
  const [form, setForm] = useState(empty);

  const { data: items, isLoading } = useQuery({
    queryKey: ["contab-calendar", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contab_fiscal_calendar").select("*")
        .eq("company_id", companyId!).order("day_of_month", { ascending: true });
      if (error) throw error;
      return data as CalEvt[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        obligation_type: form.obligation_type,
        scope: form.scope,
        state_code: form.state_code || null,
        recurrence: form.recurrence,
        day_of_month: form.day_of_month,
        description: form.description || null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("contab_fiscal_calendar").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contab_fiscal_calendar").insert({ ...payload, company_id: companyId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Evento atualizado" : "Evento criado");
      qc.invalidateQueries({ queryKey: ["contab-calendar"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_fiscal_calendar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["contab-calendar"] }); },
  });

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(e: CalEvt) {
    setEditing(e);
    setForm({
      title: e.title, obligation_type: e.obligation_type, scope: e.scope,
      state_code: e.state_code ?? "", recurrence: e.recurrence,
      day_of_month: e.day_of_month ?? 20, description: e.description ?? "", is_active: e.is_active,
    });
    setOpen(true);
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Calendário Fiscal"
        description="Mestre de eventos recorrentes — base para gerar obrigações dos clientes."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Novo evento
            </Button>
          </div>
        }
      />

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !items?.length && (
        <EmptyState title="Nenhum evento" description="Cadastre os eventos fiscais recorrentes do escritório." />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items?.map((e) => {
          const sc = SCOPE.find((s) => s.v === e.scope);
          const rc = RECUR.find((r) => r.v === e.recurrence);
          return (
            <Card key={e.id} className="p-4">
              <div className="flex items-start gap-2">
                <div className="rounded-md bg-primary/10 p-2"><CalendarClock className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{e.obligation_type.toUpperCase()}</div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {sc && <Badge variant="outline">{sc.l}{e.state_code ? ` · ${e.state_code}` : ""}</Badge>}
                    {rc && <Badge variant="secondary">{rc.l}</Badge>}
                    {e.day_of_month && <Badge variant="outline">Dia {e.day_of_month}</Badge>}
                    {!e.is_active && <Badge variant="outline">inativo</Badge>}
                  </div>
                </div>
              </div>
              {e.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{e.description}</p>}
              <div className="flex justify-end gap-1 mt-3">
                <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(e.id); }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} evento fiscal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.title} onChange={(ev) => setForm({ ...form, title: ev.target.value })} placeholder="Ex.: DAS Simples Nacional" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label><Input value={form.obligation_type} onChange={(ev) => setForm({ ...form, obligation_type: ev.target.value })} placeholder="das, darf, etc." /></div>
              <div>
                <Label>Esfera</Label>
                <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SCOPE.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Recorrência</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm({ ...form, recurrence: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECUR.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Dia do mês</Label>
                <Input type="number" min={1} max={31} value={form.day_of_month}
                  onChange={(ev) => setForm({ ...form, day_of_month: Number(ev.target.value) })} />
              </div>
              <div><Label>UF</Label>
                <Input maxLength={2} value={form.state_code}
                  onChange={(ev) => setForm({ ...form, state_code: ev.target.value.toUpperCase() })} />
              </div>
            </div>
            <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(ev) => setForm({ ...form, description: ev.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Ativo</Label></div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.title || save.isPending}
              onClick={() => save.mutate()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
