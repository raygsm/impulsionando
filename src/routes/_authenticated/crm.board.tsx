import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatCard } from "@/components/app/PageElements";
import { CompanyPicker } from "@/components/app/CompanyPicker";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trophy, XCircle, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";

export const Route = createFileRoute("/_authenticated/crm/board")({
  head: () => ({ meta: [{ title: "CRM Kanban — Impulsionando" }] }),
  component: BoardPage,
});

interface Stage { id: string; name: string; color: string; sort_order: number; stage_type: "open"|"won"|"lost"; win_probability: number }
interface Pipeline { id: string; name: string; is_default: boolean }
interface Opp {
  id: string; title: string; value: number; stage_id: string; status: "open"|"won"|"lost";
  expected_close_at: string | null; lead_id: string | null; sort_order: number;
  crm_leads: { name: string; phone: string | null } | null;
}

const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

function BoardPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [pipelineId, setPipelineId] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: pipelines } = useQuery({
    queryKey: ["crm-pipelines", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_pipelines")
        .select("id, name, is_default").eq("company_id", companyId).eq("is_active", true)
        .order("is_default", { ascending: false }).order("sort_order");
      if (error) throw error;
      const list = data as Pipeline[];
      if (list.length && !pipelineId) setPipelineId(list[0].id);
      return list;
    },
  });

  const { data: stages } = useQuery({
    queryKey: ["crm-stages", pipelineId],
    enabled: !!pipelineId,
    queryFn: async () => (await supabase.from("crm_stages").select("*").eq("pipeline_id", pipelineId).order("sort_order")).data as Stage[] ?? [],
  });

  const { data: opps, isLoading } = useQuery({
    queryKey: ["crm-opps", pipelineId],
    enabled: !!pipelineId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_opportunities")
        .select("id, title, value, stage_id, status, expected_close_at, lead_id, sort_order, crm_leads:lead_id(name, phone)")
        .eq("pipeline_id", pipelineId).order("sort_order");
      if (error) throw error;
      return data as unknown as Opp[];
    },
  });

  const moveOpp = useMutation({
    mutationFn: async ({ id, stage_id, status }: { id: string; stage_id: string; status: "open"|"won"|"lost" }) => {
      const patch: Record<string, unknown> = { stage_id, status };
      if (status !== "open") patch.closed_at = new Date().toISOString();
      else patch.closed_at = null;
      const { error } = await supabase.from("crm_opportunities").update(patch).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage_id, status }) => {
      await qc.cancelQueries({ queryKey: ["crm-opps", pipelineId] });
      const prev = qc.getQueryData<Opp[]>(["crm-opps", pipelineId]);
      qc.setQueryData<Opp[]>(["crm-opps", pipelineId], (old) =>
        (old ?? []).map((o) => o.id === id ? { ...o, stage_id, status } : o)
      );
      return { prev };
    },
    onError: (e: Error, _v, ctx) => { qc.setQueryData(["crm-opps", pipelineId], ctx?.prev); toast.error(e.message); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["crm-opps", pipelineId] }),
  });

  const grouped = useMemo(() => {
    const m = new Map<string, Opp[]>();
    (stages ?? []).forEach((s) => m.set(s.id, []));
    (opps ?? []).forEach((o) => { if (m.has(o.stage_id)) m.get(o.stage_id)!.push(o); });
    return m;
  }, [stages, opps]);

  const stats = useMemo(() => {
    const open = (opps ?? []).filter((o) => o.status === "open");
    const won = (opps ?? []).filter((o) => o.status === "won");
    const lost = (opps ?? []).filter((o) => o.status === "lost");
    const totalClosed = won.length + lost.length;
    return {
      pipelineValue: open.reduce((s, o) => s + Number(o.value), 0),
      won: won.length, wonValue: won.reduce((s, o) => s + Number(o.value), 0),
      lost: lost.length,
      conversion: totalClosed ? Math.round((won.length / totalClosed) * 100) : 0,
    };
  }, [opps]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const oppId = String(e.active.id);
    const targetStageId = e.over ? String(e.over.id) : null;
    if (!targetStageId) return;
    const opp = (opps ?? []).find((o) => o.id === oppId);
    const stage = (stages ?? []).find((s) => s.id === targetStageId);
    if (!opp || !stage || opp.stage_id === targetStageId) return;
    moveOpp.mutate({ id: oppId, stage_id: targetStageId, status: stage.stage_type });
  }

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa para visualizar o CRM." />;
  const activeOpp = activeId ? (opps ?? []).find((o) => o.id === activeId) : null;

  return (
    <div>
      <PageHeader
        title="CRM — Kanban"
        description="Arraste oportunidades entre etapas. Ganho/Perda fecham automaticamente."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            {pipelines && pipelines.length > 0 && (
              <Select value={pipelineId} onValueChange={setPipelineId}>
                <SelectTrigger className="w-56"><SelectValue placeholder="Funil" /></SelectTrigger>
                <SelectContent>{pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Button className="bg-gradient-primary shadow-elegant" disabled={!pipelineId} onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" />Nova oportunidade
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Pipeline aberto" value={fmtBRL(stats.pipelineValue)} icon={DollarSign} accent />
        <StatCard label="Ganhos" value={`${stats.won}`} hint={fmtBRL(stats.wonValue)} icon={Trophy} />
        <StatCard label="Perdidos" value={`${stats.lost}`} icon={XCircle} />
        <StatCard label="Conversão" value={`${stats.conversion}%`} hint="ganhos / fechados" icon={TrendingUp} />
      </div>

      {!pipelines?.length ? (
        <EmptyState title="Sem funil configurado" description="Crie um funil em CRM › Funis para começar." />
      ) : isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {(stages ?? []).map((s) => (
              <Column key={s.id} stage={s} items={grouped.get(s.id) ?? []} />
            ))}
          </div>
          <DragOverlay>{activeOpp && <OppCard opp={activeOpp} dragging />}</DragOverlay>
        </DndContext>
      )}

      <NewOpportunityDialog
        open={creating} onClose={() => setCreating(false)}
        companyId={companyId} pipelineId={pipelineId}
        stages={stages ?? []}
      />
    </div>
  );
}

function Column({ stage, items }: { stage: Stage; items: Opp[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = items.reduce((s, o) => s + Number(o.value), 0);
  return (
    <div ref={setNodeRef} className={`w-72 shrink-0 rounded-lg bg-muted/40 border ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />
          <span className="font-medium text-sm truncate">{stage.name}</span>
          {stage.stage_type === "won" && <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-600">ganho</Badge>}
          {stage.stage_type === "lost" && <Badge variant="outline" className="text-[9px] border-red-500 text-red-600">perda</Badge>}
        </div>
        <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
      </div>
      <div className="px-3 py-1 text-[10px] text-muted-foreground border-b">{fmtBRL(total)}</div>
      <div className="p-2 space-y-2 min-h-32">
        {items.map((o) => <OppCard key={o.id} opp={o} />)}
        {!items.length && <div className="text-center text-[11px] text-muted-foreground py-6">vazio</div>}
      </div>
    </div>
  );
}

function OppCard({ opp, dragging }: { opp: Opp; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: opp.id });
  return (
    <Card
      ref={setNodeRef} {...attributes} {...listeners}
      className={`p-3 cursor-grab active:cursor-grabbing shadow-sm ${isDragging || dragging ? "opacity-50" : ""}`}
    >
      <div className="font-medium text-sm truncate">{opp.title}</div>
      {opp.crm_leads?.name && <div className="text-xs text-muted-foreground truncate">{opp.crm_leads.name}</div>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-mono">{fmtBRL(Number(opp.value))}</span>
        {opp.expected_close_at && <span className="text-[10px] text-muted-foreground">{new Date(opp.expected_close_at).toLocaleDateString("pt-BR")}</span>}
      </div>
    </Card>
  );
}

function NewOpportunityDialog({ open, onClose, companyId, pipelineId, stages }: {
  open: boolean; onClose: () => void; companyId: string; pipelineId: string; stages: Stage[];
}) {
  const qc = useQueryClient();
  const firstOpen = stages.find((s) => s.stage_type === "open") ?? stages[0];
  const [form, setForm] = useState({ title: "", value: "0", lead_name: "", lead_phone: "", expected_close_at: "" });

  const { data: leads } = useQuery({
    queryKey: ["crm-leads-opt", companyId],
    enabled: open && !!companyId,
    queryFn: async () => (await supabase.from("crm_leads").select("id, name").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const [leadId, setLeadId] = useState<string>("__new__");

  const create = useMutation({
    mutationFn: async () => {
      if (!firstOpen) throw new Error("Funil sem etapas");
      let usedLeadId: string | null = leadId === "__new__" ? null : leadId;
      if (leadId === "__new__" && form.lead_name.trim()) {
        const { data, error } = await supabase.from("crm_leads")
          .insert({ company_id: companyId, name: form.lead_name.trim(), phone: form.lead_phone || null, source: "manual" })
          .select("id").single();
        if (error) throw error;
        usedLeadId = data.id;
      }
      const { error } = await supabase.from("crm_opportunities").insert({
        company_id: companyId, pipeline_id: pipelineId, stage_id: firstOpen.id,
        title: form.title, value: Number(form.value) || 0,
        lead_id: usedLeadId,
        expected_close_at: form.expected_close_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oportunidade criada");
      qc.invalidateQueries({ queryKey: ["crm-opps"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      setForm({ title: "", value: "0", lead_name: "", lead_phone: "", expected_close_at: "" });
      setLeadId("__new__");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <Label>Previsão</Label>
              <Input type="date" value={form.expected_close_at} onChange={(e) => setForm({ ...form, expected_close_at: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__">+ Criar novo</SelectItem>
                {leads?.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {leadId === "__new__" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome do lead</Label><Input value={form.lead_name} onChange={(e) => setForm({ ...form, lead_name: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.lead_phone} onChange={(e) => setForm({ ...form, lead_phone: e.target.value })} /></div>
            </div>
          )}
          <Button className="w-full bg-gradient-primary shadow-elegant" disabled={!form.title || create.isPending} onClick={() => create.mutate()}>
            Criar oportunidade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
