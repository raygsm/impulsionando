import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Users, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/equipes")({
  head: () => ({ meta: [{ title: "Equipes — Imobiliária" }] }),
  component: Page,
});

type Team = {
  id: string; company_id: string; name: string;
  leader_user_id: string | null; goal_monthly: number | null;
  status: string; created_at: string;
};
type Member = { id: string; team_id: string; user_id: string; role: string };

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [memberDialogTeam, setMemberDialogTeam] = useState<Team | null>(null);
  const [newMemberId, setNewMemberId] = useState("");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["realestate-teams", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_teams").select("*")
        .eq("company_id", companyId).order("name");
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });

  const { data: members } = useQuery({
    queryKey: ["realestate-team-members", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_team_members").select("*");
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Selecione uma empresa");
      if (!newName.trim()) throw new Error("Nome obrigatório");
      const { error } = await supabase.from("realestate_teams").insert({
        company_id: companyId,
        name: newName.trim(),
        goal_monthly: newGoal ? Number(newGoal) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipe criada");
      setNewName(""); setNewGoal("");
      qc.invalidateQueries({ queryKey: ["realestate-teams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Equipe removida"); qc.invalidateQueries({ queryKey: ["realestate-teams"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMember = useMutation({
    mutationFn: async () => {
      if (!memberDialogTeam || !newMemberId.trim()) throw new Error("Informe o user_id");
      const { error } = await supabase.from("realestate_team_members").insert({
        team_id: memberDialogTeam.id,
        user_id: newMemberId.trim(),
        role: "broker",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro adicionado");
      setNewMemberId("");
      qc.invalidateQueries({ queryKey: ["realestate-team-members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["realestate-team-members"] }); },
  });

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <PageHeader title="Equipes" description="Agrupe corretores em times com metas mensais." />

      <div className="rounded-lg border bg-card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label>Nome da equipe</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: Time Centro" />
        </div>
        <div className="w-40">
          <Label>Meta mensal (R$)</Label>
          <Input type="number" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="0" />
        </div>
        <Button onClick={() => createTeam.mutate()} disabled={!companyId || createTeam.isPending}>
          {createTeam.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          <Plus className="h-4 w-4 mr-1" /> Criar
        </Button>
      </div>

      {!companyId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          Selecione uma empresa no topo.
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : !teams?.length ? (
        <EmptyState title="Nenhuma equipe" description="Crie a primeira equipe acima." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => {
            const tm = (members ?? []).filter(m => m.team_id === t.id);
            return (
              <div key={t.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium flex items-center gap-2"><Users className="h-4 w-4" />{t.name}</div>
                    {t.goal_monthly != null && (
                      <div className="text-xs text-muted-foreground">
                        Meta: {new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(t.goal_monthly)}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{t.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{tm.length} membro(s)</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tm.map(m => (
                    <Badge key={m.id} variant="secondary" className="text-[10px] gap-1">
                      {m.user_id.slice(0, 8)}…
                      <button onClick={() => removeMember.mutate(m.id)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Dialog open={memberDialogTeam?.id === t.id} onOpenChange={(o) => setMemberDialogTeam(o ? t : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><UserPlus className="h-3 w-3 mr-1" /> Adicionar membro</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar membro — {t.name}</DialogTitle></DialogHeader>
                      <Label>User ID do corretor</Label>
                      <Input value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} placeholder="uuid do usuário" />
                      <p className="text-xs text-muted-foreground">Obtenha o user_id em Usuários → Permissões.</p>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setMemberDialogTeam(null)}>Cancelar</Button>
                        <Button onClick={() => addMember.mutate()} disabled={addMember.isPending}>
                          {addMember.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="ghost" className="text-rose-600"
                    onClick={() => { if (confirm(`Remover equipe "${t.name}"?`)) deleteTeam.mutate(t.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
