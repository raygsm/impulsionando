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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, GitBranch } from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/pipelines")({
  head: () => ({ meta: [{ title: "Funis — CRM" }] }),
  component: PipelinesPage,
});

interface Pipeline { id: string; name: string; description: string | null; is_default: boolean; is_active: boolean }
interface Stage { id: string; pipeline_id: string; name: string; color: string; sort_order: number; stage_type: "open"|"won"|"lost"; win_probability: number }

function PipelinesPage() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [stageDialog, setStageDialog] = useState<Pipeline | null>(null);

  const { data: pipes } = useQuery({
    queryKey: ["crm-pipelines-mgmt", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("crm_pipelines").select("*").eq("company_id", companyId).order("sort_order")).data as Pipeline[] ?? [],
  });

  const createPipe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("crm_pipelines")
        .insert({ company_id: companyId, name: newName, sort_order: (pipes?.length ?? 0) }).select("id").single();
      if (error) throw error;
      // criar 3 etapas iniciais
      await supabase.from("crm_stages").insert([
        { company_id: companyId, pipeline_id: data.id, name: "Novo", color: "#64748b", sort_order: 0, stage_type: "open", win_probability: 10 },
        { company_id: companyId, pipeline_id: data.id, name: "Ganhou", color: "#10b981", sort_order: 1, stage_type: "won", win_probability: 100 },
        { company_id: companyId, pipeline_id: data.id, name: "Perdeu", color: "#ef4444", sort_order: 2, stage_type: "lost", win_probability: 0 },
      ]);
    },
    onSuccess: () => { toast.success("Funil criado"); qc.invalidateQueries({ queryKey: ["crm-pipelines-mgmt"] }); setNewName(""); setCreating(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePipe = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("crm_pipelines").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-pipelines-mgmt"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Funis"
        description="Gerencie funis comerciais e suas etapas."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" />Novo funil
            </Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        {!pipes?.length && <EmptyState title="Nenhum funil" description="Crie o primeiro funil comercial." />}
        {pipes?.map((p) => (
          <Card key={p.id} className="p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  {p.is_default && <Badge className="bg-gradient-primary">padrão</Badge>}
                  {!p.is_active && <Badge variant="outline">inativo</Badge>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => togglePipe.mutate({ id: p.id, is_active: !p.is_active })}>
                {p.is_active ? "Desativar" : "Ativar"}
              </Button>
            </div>
            <Button variant="ghost" className="w-full mt-3" onClick={() => setStageDialog(p)}>Editar etapas</Button>
          </Card>
        ))}
      </div>

      <Dialog open={creating} onOpenChange={(v) => !v && setCreating(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo funil</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do funil</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <Button className="w-full bg-gradient-primary shadow-elegant" disabled={!newName || createPipe.isPending} onClick={() => createPipe.mutate()}>
              Criar (com 3 etapas iniciais)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StagesDialog pipeline={stageDialog} companyId={companyId} onClose={() => setStageDialog(null)} />
    </div>
  );
}

function StagesDialog({ pipeline, companyId, onClose }: { pipeline: Pipeline | null; companyId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const open = !!pipeline;
  const [newStage, setNewStage] = useState({ name: "", color: "#6366f1", stage_type: "open" as "open"|"won"|"lost", win_probability: "50" });

  const { data: stages } = useQuery({
    queryKey: ["crm-stages-mgmt", pipeline?.id],
    enabled: open,
    queryFn: async () => (await supabase.from("crm_stages").select("*").eq("pipeline_id", pipeline!.id).order("sort_order")).data as Stage[] ?? [],
  });

  const addStage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_stages").insert({
        company_id: companyId, pipeline_id: pipeline!.id,
        name: newStage.name, color: newStage.color, stage_type: newStage.stage_type,
        win_probability: Number(newStage.win_probability) || 0,
        sort_order: (stages?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Etapa adicionada"); qc.invalidateQueries({ queryKey: ["crm-stages-mgmt"] }); setNewStage({ name: "", color: "#6366f1", stage_type: "open", win_probability: "50" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removida"); qc.invalidateQueries({ queryKey: ["crm-stages-mgmt"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Etapas — {pipeline?.name}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {stages?.map((s) => (
            <div key={s.id} className="flex items-center gap-2 border rounded-md px-3 py-2">
              <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{s.name}</div>
                <div className="text-[10px] text-muted-foreground">{s.stage_type} · {s.win_probability}%</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Excluir etapa?")) removeStage.mutate(s.id); }}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Nova etapa</div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome" value={newStage.name} onChange={(e) => setNewStage({ ...newStage, name: e.target.value })} />
            <Input type="color" value={newStage.color} onChange={(e) => setNewStage({ ...newStage, color: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={newStage.stage_type} onValueChange={(v: "open"|"won"|"lost") => setNewStage({ ...newStage, stage_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perda</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" min="0" max="100" placeholder="% sucesso" value={newStage.win_probability} onChange={(e) => setNewStage({ ...newStage, win_probability: e.target.value })} />
          </div>
          <Button className="w-full" disabled={!newStage.name || addStage.isPending} onClick={() => addStage.mutate()}>
            <Plus className="w-4 h-4 mr-1" />Adicionar etapa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
