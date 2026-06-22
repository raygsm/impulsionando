import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Task {
  id: string;
  code: string;
  title: string;
  description: string | null;
  group_name: string | null;
  status: "pending" | "in_progress" | "done" | "blocked" | "na";
  notes: string | null;
  sort_order: number;
  resolved_at: string | null;
}

const STATUS_LABEL: Record<Task["status"], string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluído",
  blocked: "Bloqueado",
  na: "Não se aplica",
};

const STATUS_BADGE: Record<Task["status"], "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary",
  in_progress: "default",
  done: "default",
  blocked: "destructive",
  na: "outline",
};

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/implantacao")({
  head: () => ({ meta: [{ title: "Rio Med · Implantação" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='onboarding' title='Implantação RioMed'><Page /></TenantModuleShell>),
});

function Page() {
  const qc = useQueryClient();
  const { data: tenant } = useQuery({
    queryKey: ["tenant", "riomed-company"],
    queryFn: async () => {
      const { data } = await supabase
        .from("core_tenant_identity")
        .select("company_id")
        .eq("subdomain", "riomed")
        .maybeSingle();
      return data;
    },
  });
  const companyId = tenant?.company_id ?? null;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["implantation-tasks", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("core_implantation_tasks")
        .select("*")
        .eq("company_id", companyId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const g = t.group_name ?? "Geral";
      const arr = m.get(g) ?? [];
      arr.push(t);
      m.set(g, arr);
    });
    return [...m.entries()];
  }, [tasks]);

  const done = tasks.filter((t) => t.status === "done" || t.status === "na").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const updates: Partial<Task> = { ...patch };
      if (patch.status === "done" && !updates.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      } else if (patch.status && patch.status !== "done") {
        updates.resolved_at = null;
      }
      const { error } = await supabase.from("core_implantation_tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["implantation-tasks", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Painel de Implantação — Rio Med</h1>
        <p className="text-sm text-muted-foreground">
          Todas as pendências do lançamento, marcadas como pendente, em andamento ou concluídas. Quando tudo fechar, o lançamento está pronto.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={pct} className="flex-1" />
          <span className="text-sm font-medium">{done}/{total} · {pct}%</span>
        </div>
      </header>

      {isLoading && <p className="text-muted-foreground">Carregando…</p>}

      {groups.map(([group, items]) => (
        <Card key={group}>
          <CardHeader><CardTitle className="text-lg">{group}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map((t) => (
              <div key={t.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t.title}</span>
                      <Badge variant={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                      {t.resolved_at && (
                        <span className="text-xs text-muted-foreground">
                          em {new Date(t.resolved_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                  </div>
                  <Select value={t.status} onValueChange={(v) => update.mutate({ id: t.id, patch: { status: v as Task["status"] } })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, lbl]) => <SelectItem key={k} value={k}>{lbl}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <NotesEditor task={t} onSave={(notes) => update.mutate({ id: t.id, patch: { notes } })} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NotesEditor({ task, onSave }: { task: Task; onSave: (notes: string) => void }) {
  const [val, setVal] = useState(task.notes ?? "");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {task.notes && <span className="text-muted-foreground italic">“{task.notes}”</span>}
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setOpen(true)}>
          {task.notes ? "editar nota" : "+ adicionar nota"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2} placeholder="Observação (responsável, data, link…)" />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { onSave(val); setOpen(false); }}>Salvar</Button>
        <Button size="sm" variant="ghost" onClick={() => { setVal(task.notes ?? ""); setOpen(false); }}>Cancelar</Button>
      </div>
    </div>
  );
}
