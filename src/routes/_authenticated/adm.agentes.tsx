import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { runCommittee } from "@/lib/agents.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/adm/agentes")({
  component: AgentesPage,
});

type Demand = {
  id: string;
  title: string;
  cliente: string | null;
  projeto: string | null;
  tipo_entrega: string | null;
  objetivo: string | null;
  contexto: string | null;
  agentes_selecionados: string[] | null;
  status: "criada" | "em_analise" | "concluida" | "erro";
  created_at: string;
};

type Output = { id: string; content: unknown; created_at: string; is_final: boolean };

const STATUS_LABEL: Record<Demand["status"], string> = {
  criada: "Criada",
  em_analise: "Em análise",
  concluida: "Concluída",
  erro: "Erro",
};

function AgentesPage() {
  const run = useServerFn(runCommittee);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [selected, setSelected] = useState<Demand | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [running, setRunning] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    cliente: "",
    projeto: "",
    tipo_entrega: "",
    objetivo: "",
    contexto: "",
    agentes: "",
  });

  async function loadDemands() {
    const { data } = await supabase
      .from("agent_demands")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setDemands((data ?? []) as Demand[]);
  }

  async function loadOutputs(demandId: string) {
    const { data } = await supabase
      .from("agent_outputs")
      .select("id, content, created_at, is_final")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false });
    setOutputs((data ?? []) as Output[]);
  }

  useEffect(() => {
    loadDemands();
  }, []);

  useEffect(() => {
    if (selected) loadOutputs(selected.id);
    else setOutputs([]);
  }, [selected?.id]);

  async function createDemand() {
    if (!form.title.trim()) {
      toast.error("Informe um título");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (!userId) {
      toast.error("Sessão expirada");
      return;
    }
    const agentes = form.agentes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { data, error } = await supabase
      .from("agent_demands")
      .insert({
        title: form.title,
        cliente: form.cliente || null,
        projeto: form.projeto || null,
        tipo_entrega: form.tipo_entrega || null,
        objetivo: form.objetivo || null,
        contexto: form.contexto || null,
        agentes_selecionados: agentes,
        created_by: userId,
        status: "criada",
      })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm({ title: "", cliente: "", projeto: "", tipo_entrega: "", objetivo: "", contexto: "", agentes: "" });
    await loadDemands();
    setSelected(data as Demand);
    toast.success("Demanda criada");
  }

  async function rodarComite() {
    if (!selected) return;
    setRunning(true);
    setLastResponse("");
    try {
      const result = await run({ data: { demandId: selected.id } });
      setLastResponse(result.responseJson || "");
      if (result.ok) {
        toast.success(`Comitê executado (HTTP ${result.httpStatus}) — status: ${result.finalStatus}`);
      } else {
        toast.error(`Falha: ${result.error}`);
      }
      await loadDemands();
      await loadOutputs(selected.id);
      const { data: refreshed } = await supabase
        .from("agent_demands")
        .select("*")
        .eq("id", selected.id)
        .single();
      if (refreshed) setSelected(refreshed as Demand);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setRunning(false);
    }
  }

  const parsedResponse = useMemo(() => {
    if (!lastResponse) return "";
    try {
      return JSON.stringify(JSON.parse(lastResponse), null, 2);
    } catch {
      return lastResponse;
    }
  }, [lastResponse]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Central de Agentes</h1>
        <p className="text-sm text-muted-foreground">
          Teste de comunicação Lovable → n8n → Lovable (webhook-test).
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova demanda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Cliente" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
            <Input placeholder="Projeto" value={form.projeto} onChange={(e) => setForm({ ...form, projeto: e.target.value })} />
            <Input placeholder="Tipo de entrega" value={form.tipo_entrega} onChange={(e) => setForm({ ...form, tipo_entrega: e.target.value })} />
            <Textarea placeholder="Objetivo" value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
            <Textarea placeholder="Contexto" value={form.contexto} onChange={(e) => setForm({ ...form, contexto: e.target.value })} />
            <Input placeholder="Agentes (separados por vírgula)" value={form.agentes} onChange={(e) => setForm({ ...form, agentes: e.target.value })} />
            <Button onClick={createDemand} className="w-full">Criar demanda</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demandas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-auto">
            {demands.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma demanda ainda.</p>}
            {demands.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={`w-full text-left p-3 rounded border hover:bg-accent ${selected?.id === d.id ? "bg-accent" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{d.title}</span>
                  <Badge variant={d.status === "concluida" ? "default" : d.status === "erro" ? "destructive" : "secondary"}>
                    {STATUS_LABEL[d.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{d.cliente} · {d.projeto}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mesa do Comitê — {selected.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Status: <Badge variant="outline">{STATUS_LABEL[selected.status]}</Badge>
              </p>
            </div>
            <Button onClick={rodarComite} disabled={running}>
              {running && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rodar Comitê
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {running && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Aguardando resposta do n8n…
              </div>
            )}
            {parsedResponse && (
              <div>
                <p className="text-sm font-medium mb-1">Última resposta do webhook</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">{parsedResponse}</pre>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-2">Outputs salvos</p>
              {outputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum output ainda.</p>
              ) : (
                <div className="space-y-2">
                  {outputs.map((o) => (
                    <div key={o.id} className="border rounded p-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{new Date(o.created_at).toLocaleString()}</span>
                        {o.is_final && <Badge>final</Badge>}
                      </div>
                      <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(o.content, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
