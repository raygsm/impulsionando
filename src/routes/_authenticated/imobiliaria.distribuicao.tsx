import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { PageHeader, EmptyState } from "@/components/app/PageElements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Shuffle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/imobiliaria/distribuicao")({
  head: () => ({ meta: [{ title: "Distribuição de Leads — Imobiliária" }] }),
  component: Page,
});

type Rule = {
  id: string; company_id: string; name: string;
  strategy: "round_robin" | "by_team" | "by_neighborhood";
  config: Record<string, unknown>; is_active: boolean; created_at: string;
};

const STRATEGY_LABEL: Record<Rule["strategy"], string> = {
  round_robin: "Rodízio (round-robin)",
  by_team: "Por equipe",
  by_neighborhood: "Por bairro/região",
};

function Page() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<Rule["strategy"]>("round_robin");

  const { data: rules, isLoading } = useQuery({
    queryKey: ["realestate-dist-rules", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_distribution_rules").select("*")
        .eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Rule[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["realestate-assignments", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_lead_assignments").select("strategy, created_at")
        .eq("company_id", companyId).gte("created_at", new Date(Date.now() - 30*24*3600*1000).toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const createRule = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Selecione uma empresa");
      if (!name.trim()) throw new Error("Nome obrigatório");
      const { error } = await supabase.from("realestate_distribution_rules").insert({
        company_id: companyId, name: name.trim(), strategy, config: {}, is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra criada");
      setName("");
      qc.invalidateQueries({ queryKey: ["realestate-dist-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (r: Rule) => {
      // ensure only one active at a time
      if (!r.is_active) {
        await supabase.from("realestate_distribution_rules")
          .update({ is_active: false }).eq("company_id", companyId!);
      }
      const { error } = await supabase.from("realestate_distribution_rules")
        .update({ is_active: !r.is_active }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["realestate-dist-rules"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("realestate_distribution_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Regra removida"); qc.invalidateQueries({ queryKey: ["realestate-dist-rules"] }); },
  });

  const stats = {
    total: assignments?.length ?? 0,
    rr: assignments?.filter(a => a.strategy === "round_robin").length ?? 0,
    team: assignments?.filter(a => a.strategy === "by_team").length ?? 0,
    manual: assignments?.filter(a => a.strategy === "manual").length ?? 0,
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <PageHeader
        title="Distribuição de Leads"
        description="Defina como leads recém-capturados são atribuídos aos corretores. Apenas uma regra ativa por vez."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Atribuições (30d)" value={stats.total} />
        <Stat label="Round-robin" value={stats.rr} />
        <Stat label="Por equipe" value={stats.team} />
        <Stat label="Manuais" value={stats.manual} />
      </div>

      <div className="rounded-lg border bg-card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label>Nome da regra</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Rodízio padrão" />
        </div>
        <div className="w-56">
          <Label>Estratégia</Label>
          <Select value={strategy} onValueChange={(v) => setStrategy(v as Rule["strategy"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STRATEGY_LABEL).map(([k,v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => createRule.mutate()} disabled={!companyId || createRule.isPending}>
          {createRule.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          <Plus className="h-4 w-4 mr-1" /> Criar regra
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
      ) : !rules?.length ? (
        <EmptyState title="Nenhuma regra" description="Crie a primeira regra acima — comece pelo Rodízio." />
      ) : (
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="rounded-lg border bg-card p-4 flex items-center gap-4 flex-wrap">
              <Shuffle className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{STRATEGY_LABEL[r.strategy]}</div>
              </div>
              {r.is_active && <Badge className="bg-emerald-100 text-emerald-800">Ativa</Badge>}
              <div className="flex items-center gap-2">
                <Switch checked={r.is_active} onCheckedChange={() => toggleActive.mutate(r)} />
                <span className="text-xs text-muted-foreground">Ativar</span>
              </div>
              <Button size="sm" variant="ghost" className="text-rose-600"
                onClick={() => { if (confirm(`Remover "${r.name}"?`)) deleteRule.mutate(r.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-8 rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        <b className="text-foreground">Como funciona:</b> ao capturar um lead novo, o sistema lê a regra
        ativa e registra a atribuição em <code>realestate_lead_assignments</code> para auditoria.
        Atribuições manuais via Kanban continuam funcionando e ficam marcadas como <code>manual</code>.
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
