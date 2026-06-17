import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contabilidade/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — Contabilidade" }] }),
  component: ContabTarefas,
});

interface Task {
  id: string; client_id: string | null; title: string; description: string | null;
  priority: string; status: string; due_date: string | null; done_at: string | null;
}
interface Client { id: string; legal_name: string; trade_name: string | null; }

const PRIORITY = [
  { v: "low", l: "Baixa", c: "bg-gray-500/15 text-gray-700" },
  { v: "medium", l: "Média", c: "bg-blue-500/15 text-blue-700" },
  { v: "high", l: "Alta", c: "bg-amber-500/15 text-amber-700" },
  { v: "urgent", l: "Urgente", c: "bg-red-500/15 text-red-700" },
];
const STATUS = ["todo", "in_progress", "review", "done", "cancelled"];
const STATUS_LBL: Record<string, string> = {
  todo: "A fazer", in_progress: "Em andamento", review: "Revisão", done: "Concluída", cancelled: "Cancelada",
};

const today = new Date().toISOString().slice(0, 10);

function ContabTarefas() {
  const qc = useQueryClient();
  const { companyId } = useActiveCompany();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("open");
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium",
    client_id: "", due_date: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["contab-clients-min", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_clients")
        .select("id, legal_name, trade_name").eq("company_id", companyId!).order("legal_name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["contab-tasks", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("contab_tasks")
        .select("*").eq("company_id", companyId!).order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    if (filter === "open") return items.filter((t) => t.status !== "done" && t.status !== "cancelled");
    if (filter === "overdue") return items.filter((t) => t.status !== "done" && t.due_date && t.due_date < today);
    if (filter === "done") return items.filter((t) => t.status === "done");
    return items;
  }, [items, filter]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contab_tasks").insert({
        company_id: companyId!,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        client_id: form.client_id || null,
        due_date: form.due_date || null,
        status: "todo",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa criada");
      qc.invalidateQueries({ queryKey: ["contab-tasks"] });
      setOpen(false);
      setForm({ title: "", description: "", priority: "medium", client_id: "", due_date: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const done = t.status !== "done";
      const { error } = await supabase.from("contab_tasks").update({
        status: done ? "done" : "todo",
        done_at: done ? new Date().toISOString() : null,
      }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contab-tasks"] }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("contab_tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contab-tasks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contab_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removida"); qc.invalidateQueries({ queryKey: ["contab-tasks"] }); },
  });

  if (!companyId) return <EmptyState title="Sem empresa ativa" description="Selecione uma empresa." />;

  return (
    <div>
      <PageHeader
        title="Tarefas"
        description="Tarefas internas do escritório — vinculadas (ou não) a clientes."
        action={
          <div className="flex gap-2 items-center">
            <CompanyPicker />
            <Button className="bg-gradient-primary shadow-elegant" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova
            </Button>
          </div>
        }
      />

      <div className="flex gap-2 mb-4">
        {[["open", "Abertas"], ["overdue", "Atrasadas"], ["done", "Concluídas"], ["all", "Todas"]].map(([v, l]) => (
          <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>{l}</Button>
        ))}
      </div>

      {isLoading && <div className="text-sm text-muted-foreground p-8 text-center">Carregando…</div>}
      {!isLoading && !filtered.length && <EmptyState title="Nenhuma tarefa" description="Crie a primeira tarefa." />}

      <div className="space-y-2">
        {filtered.map((t) => {
          const pr = PRIORITY.find((p) => p.v === t.priority);
          const client = clients?.find((c) => c.id === t.client_id);
          const overdue = t.due_date && t.due_date < today && t.status !== "done";
          return (
            <Card key={t.id} className="p-3 flex items-center gap-3">
              <Checkbox checked={t.status === "done"} onCheckedChange={() => toggle.mutate(t)} />
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
                <div className="text-xs text-muted-foreground flex gap-2 flex-wrap mt-0.5">
                  {client && <span>{client.trade_name || client.legal_name}</span>}
                  {t.due_date && (
                    <span className={overdue ? "text-red-600 font-medium" : ""}>
                      {overdue ? "Atrasada · " : ""}{new Date(t.due_date).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
              {pr && <Badge className={pr.c} variant="secondary">{pr.l}</Badge>}
              <Select value={t.status} onValueChange={(v) => setStatus.mutate({ id: t.id, status: v })}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LBL[s]}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(t.id); }}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITY.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Prazo</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem cliente —</SelectItem>
                  {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.trade_name || c.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-gradient-primary shadow-elegant"
              disabled={!form.title || save.isPending}
              onClick={() => save.mutate()}>
              Criar tarefa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
