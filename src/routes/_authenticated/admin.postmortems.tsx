import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listPostmortems,
  savePostmortem,
  type PostmortemRow,
  type ActionItem,
} from "@/lib/postmortems.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, CheckCircle2, AlertOctagon, ListTodo, Plus, Trash2, Send, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/postmortems")({
  head: () => ({ meta: [{ title: "Postmortems — Impulsionando" }] }),
  component: Page,
});

function fmtMin(m: number | null) {
  if (m === null) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function statusBadge(r: PostmortemRow) {
  if (r.postmortem_published_at)
    return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Publicado</Badge>;
  if (r.postmortem_summary)
    return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30">Rascunho</Badge>;
  return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Pendente</Badge>;
}

function Page() {
  const listFn = useServerFn(listPostmortems);
  const { data, isLoading } = useQuery({ queryKey: ["postmortems"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<PostmortemRow | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Postmortems"
        description="Documente causa raiz, impacto, mitigação e ações pós-incidente. Postmortems publicados ficam disponíveis para auditoria."
      />

      <div className="grid sm:grid-cols-4 gap-3">
        <Kpi icon={<FileText className="h-4 w-4" />} label="Incidentes resolvidos (180d)" value={data?.kpis.total ?? "—"} />
        <Kpi icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Publicados" value={data?.kpis.published ?? "—"} />
        <Kpi icon={<AlertOctagon className="h-4 w-4 text-destructive" />} label="Sem postmortem" value={data?.kpis.missing ?? "—"} />
        <Kpi icon={<ListTodo className="h-4 w-4" />} label="Ações abertas" value={data?.kpis.open_actions ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incidentes resolvidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
          ) : !data?.rows.length ? (
            <div className="p-6 text-sm text-muted-foreground">Nenhum incidente resolvido nos últimos 180 dias.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2">Incidente</th>
                    <th>Escopo</th>
                    <th>Severidade</th>
                    <th className="text-right">MTTR</th>
                    <th>Resolvido</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-2 max-w-[320px] truncate">{r.title}</td>
                      <td className="text-xs">{r.scope}</td>
                      <td className="text-xs uppercase">{r.severity}</td>
                      <td className="text-right tabular-nums">{fmtMin(r.mttr_minutes)}</td>
                      <td className="text-xs">
                        {r.resolved_at ? new Date(r.resolved_at).toLocaleString("pt-BR") : "—"}
                      </td>
                      <td>{statusBadge(r)}</td>
                      <td className="text-right tabular-nums">
                        {r.postmortem_action_items.filter((a) => !a.done).length} /{" "}
                        {r.postmortem_action_items.length}
                      </td>
                      <td className="text-right pr-4">
                        <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                          {r.postmortem_summary ? "Editar" : "Escrever"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editing && <Editor row={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function Editor({ row, onClose }: { row: PostmortemRow; onClose: () => void }) {
  const qc = useQueryClient();
  const saveFn = useServerFn(savePostmortem);
  const [summary, setSummary] = useState(row.postmortem_summary ?? "");
  const [rootCause, setRootCause] = useState(row.postmortem_root_cause ?? "");
  const [impact, setImpact] = useState(row.postmortem_impact ?? "");
  const [mitigation, setMitigation] = useState(row.postmortem_mitigation ?? "");
  const [lessons, setLessons] = useState(row.postmortem_lessons ?? "");
  const [actions, setActions] = useState<ActionItem[]>(row.postmortem_action_items ?? []);

  const template = useMemo(
    () =>
      `Em ${row.detected_at ? new Date(row.detected_at).toLocaleString("pt-BR") : "—"}, o sistema ${row.scope} apresentou "${row.title}" (severidade ${row.severity}). MTTR: ${fmtMin(row.mttr_minutes)}.`,
    [row],
  );

  const save = useMutation({
    mutationFn: (publish: boolean) =>
      saveFn({
        data: {
          id: row.id,
          summary: summary || template,
          root_cause: rootCause || null,
          impact: impact || null,
          mitigation: mitigation || null,
          lessons: lessons || null,
          action_items: actions.map((a) => ({ ...a, title: a.title.trim() })).filter((a) => a.title.length),
          publish,
        },
      }),
    onSuccess: (_d, publish) => {
      toast.success(publish ? "Postmortem publicado." : "Rascunho salvo.");
      qc.invalidateQueries({ queryKey: ["postmortems"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  function addAction() {
    setActions((xs) => [...xs, { title: "", owner: "", done: false }]);
  }
  function updateAction(i: number, patch: Partial<ActionItem>) {
    setActions((xs) => xs.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeAction(i: number) {
    setActions((xs) => xs.filter((_, idx) => idx !== i));
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Postmortem — {row.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong>Sugestão de abertura:</strong> {template}
          </div>

          <Field label="Resumo executivo (1-2 parágrafos)">
            <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={template} />
          </Field>
          <Field label="Causa raiz (5 porquês / análise técnica)">
            <Textarea rows={4} value={rootCause} onChange={(e) => setRootCause(e.target.value)} />
          </Field>
          <Field label="Impacto (usuários, tenants, dados, receita)">
            <Textarea rows={3} value={impact} onChange={(e) => setImpact(e.target.value)} />
          </Field>
          <Field label="Mitigação e contenção (o que foi feito)">
            <Textarea rows={3} value={mitigation} onChange={(e) => setMitigation(e.target.value)} />
          </Field>
          <Field label="Lições aprendidas">
            <Textarea rows={3} value={lessons} onChange={(e) => setLessons(e.target.value)} />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ações (action items)</Label>
              <Button size="sm" variant="outline" onClick={addAction}>
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {actions.length === 0 && (
                <div className="text-xs text-muted-foreground">Nenhuma ação definida.</div>
              )}
              {actions.map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-6"
                    placeholder="Ação"
                    value={a.title}
                    onChange={(e) => updateAction(i, { title: e.target.value })}
                  />
                  <Input
                    className="col-span-3"
                    placeholder="Responsável"
                    value={a.owner ?? ""}
                    onChange={(e) => updateAction(i, { owner: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="date"
                    value={a.due_at ?? ""}
                    onChange={(e) => updateAction(i, { due_at: e.target.value || null })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="col-span-1"
                    onClick={() => removeAction(i)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate(false)}>
            <Save className="h-4 w-4 mr-1" /> Salvar rascunho
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate(true)}>
            <Send className="h-4 w-4 mr-1" /> Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
