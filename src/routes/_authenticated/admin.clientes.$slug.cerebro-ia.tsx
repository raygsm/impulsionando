// Fase 3.4 — Cérebro IA por Cliente. Tela funcional do Cliente 360.
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Trash2, Plus, MessageSquare, Clock, Globe2, Radio, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getAiBrain,
  upsertAiBrain,
  setAiBrainStatus,
  addAiBrainKnowledge,
  removeAiBrainKnowledge,
} from "@/lib/ai-brain.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/cerebro-ia")({
  head: () => ({ meta: [{ title: "Cérebro IA por Cliente — Impulsionando" }] }),
  component: TenantCerebroIATab,
});

function csv(arr: string[] | null | undefined) {
  return (arr ?? []).join(", ");
}
function parseCsv(v: string): string[] {
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function TenantCerebroIATab() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const fetchBrain = useServerFn(getAiBrain);
  const saveBrain = useServerFn(upsertAiBrain);
  const changeStatus = useServerFn(setAiBrainStatus);
  const addKb = useServerFn(addAiBrainKnowledge);
  const removeKb = useServerFn(removeAiBrainKnowledge);

  // resolve companyId a partir do slug (subdomain)
  const companyQ = useQuery({
    queryKey: ["company-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,subdomain")
        .eq("subdomain", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const companyId = companyQ.data?.id;

  const brainQ = useQuery({
    queryKey: ["ai-brain", companyId],
    enabled: !!companyId,
    queryFn: () => fetchBrain({ data: { companyId: companyId! } }),
  });

  const brain = brainQ.data?.brain;
  const [form, setForm] = useState<{
    agent_name: string;
    tone: string;
    approach: string;
    languages: string;
    channels: string;
    schedule: string;
    base_prompt: string;
    complementary_prompt: string;
  } | null>(null);

  // hidrata form quando dados chegam
  useMemo(() => {
    if (brainQ.data) {
      setForm({
        agent_name: brain?.agent_name ?? "",
        tone: brain?.tone ?? "",
        approach: brain?.approach ?? "",
        languages: csv(brain?.languages),
        channels: csv(brain?.channels),
        schedule: brain?.schedule ? JSON.stringify(brain.schedule, null, 2) : "",
        base_prompt: brain?.base_prompt ?? "",
        complementary_prompt: brain?.complementary_prompt ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brainQ.data]);

  const status = brain?.status ?? "draft";

  async function onSave() {
    if (!companyId || !form) return;
    let schedule: Record<string, unknown> = {};
    if (form.schedule.trim()) {
      try {
        schedule = JSON.parse(form.schedule);
      } catch {
        toast.error("Horários: JSON inválido.");
        return;
      }
    }
    try {
      await saveBrain({
        data: {
          companyId,
          agent_name: form.agent_name || null,
          tone: form.tone || null,
          approach: form.approach || null,
          languages: parseCsv(form.languages),
          channels: parseCsv(form.channels),
          schedule,
          base_prompt: form.base_prompt || null,
          complementary_prompt: form.complementary_prompt || null,
        },
      });
      toast.success("Cérebro IA salvo.");
      brainQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar.");
    }
  }

  async function onStatus(next: "draft" | "active" | "inactive") {
    if (!companyId) return;
    try {
      await changeStatus({ data: { companyId, status: next } });
      toast.success(`Status alterado para ${next}.`);
      brainQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao alterar status.");
    }
  }

  // KB form
  const [kb, setKb] = useState({ title: "", kind: "note" as const, content: "", source_url: "" });
  async function onAddKb() {
    if (!companyId || !kb.title.trim()) return;
    try {
      await addKb({
        data: {
          companyId,
          title: kb.title.trim(),
          kind: kb.kind,
          content: kb.content || undefined,
          source_url: kb.source_url || undefined,
        },
      });
      setKb({ title: "", kind: "note", content: "", source_url: "" });
      toast.success("Item adicionado à base de conhecimento.");
      brainQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao adicionar.");
    }
  }
  async function onRemoveKb(id: string) {
    if (!companyId) return;
    try {
      await removeKb({ data: { companyId, id } });
      toast.success("Item removido.");
      brainQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao remover.");
    }
  }

  if (companyQ.isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando cliente…</div>;
  if (!companyId) return <div className="p-6 text-sm text-destructive">Cliente <code>{slug}</code> não encontrado.</div>;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5" /> Cérebro IA por Cliente
          </h2>
          <p className="text-sm text-muted-foreground">
            Configuração do agente virtual da empresa <strong>{companyQ.data?.name ?? slug}</strong>.
            Dados isolados por cliente; alterações auditadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === "active" ? "default" : status === "inactive" ? "secondary" : "outline"}>
            Status: {status}
          </Badge>
        </div>
      </header>

      <Card className="p-6 space-y-4">
        {!form || brainQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Carregando cérebro IA…</div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <Field icon={<Sparkles className="h-4 w-4" />} label="Nome do agente">
                <Input value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                  placeholder="Ex.: Impulsinho, Riobot, Garrido IA…" />
              </Field>
              <Field icon={<MessageSquare className="h-4 w-4" />} label="Tom de voz">
                <Input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}
                  placeholder="Formal · Consultivo · Próximo · Bem-humorado" />
              </Field>
              <Field icon={<MessageSquare className="h-4 w-4" />} label="Abordagem">
                <Input value={form.approach} onChange={(e) => setForm({ ...form, approach: e.target.value })}
                  placeholder="Objetivo comercial, atendimento, pós-venda…" />
              </Field>
              <Field icon={<Globe2 className="h-4 w-4" />} label="Idiomas (separe por vírgula)">
                <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="pt-BR, es-BO, en-US" />
              </Field>
              <Field icon={<Radio className="h-4 w-4" />} label="Canais (separe por vírgula)">
                <Input value={form.channels} onChange={(e) => setForm({ ...form, channels: e.target.value })}
                  placeholder="WhatsApp, Web, E-mail, Instagram" />
              </Field>
              <Field icon={<Clock className="h-4 w-4" />} label="Horários (JSON)">
                <Textarea rows={3} value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder='{"seg-sex":"09:00-18:00","tz":"America/Sao_Paulo"}' />
              </Field>
            </div>

            <div className="grid gap-3 border-t pt-4">
              <Field label="Prompt base">
                <Textarea rows={5} value={form.base_prompt}
                  onChange={(e) => setForm({ ...form, base_prompt: e.target.value })}
                  placeholder="Instruções principais do agente…" />
              </Field>
              <Field label="Prompt complementar">
                <Textarea rows={4} value={form.complementary_prompt}
                  onChange={(e) => setForm({ ...form, complementary_prompt: e.target.value })}
                  placeholder="Regras extras, guardrails, exceções…" />
              </Field>
            </div>

            <div className="border-t pt-3 flex flex-wrap gap-2 items-center">
              <Select value={status} onValueChange={(v) => onStatus(v as any)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => router.invalidate()}>Recarregar</Button>
              <Button size="sm" onClick={onSave}>Salvar configuração</Button>
            </div>
          </>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium">Base de conhecimento</h3>
          <Badge variant="outline">{brainQ.data?.knowledge?.length ?? 0} itens</Badge>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Título" value={kb.title} onChange={(e) => setKb({ ...kb, title: e.target.value })} />
          <Select value={kb.kind} onValueChange={(v) => setKb({ ...kb, kind: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Nota</SelectItem>
              <SelectItem value="faq">FAQ</SelectItem>
              <SelectItem value="doc">Documento</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="script">Script</SelectItem>
              <SelectItem value="policy">Política</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="URL de origem (opcional)" value={kb.source_url}
            onChange={(e) => setKb({ ...kb, source_url: e.target.value })} className="md:col-span-2" />
          <Textarea placeholder="Conteúdo (opcional)" rows={3} value={kb.content}
            onChange={(e) => setKb({ ...kb, content: e.target.value })} className="md:col-span-2" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={onAddKb} disabled={!kb.title.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
        <div className="border-t pt-3 space-y-2">
          {(brainQ.data?.knowledge ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum item cadastrado ainda.</p>
          ) : (
            (brainQ.data?.knowledge ?? []).map((it: any) => (
              <div key={it.id} className="flex items-start justify-between gap-3 border rounded-md p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">{it.kind}</Badge>
                    <span className="font-medium text-sm truncate">{it.title}</span>
                  </div>
                  {it.source_url ? (
                    <a href={it.source_url} target="_blank" rel="noreferrer"
                      className="text-xs text-primary underline break-all">{it.source_url}</a>
                  ) : null}
                  {it.content ? (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{it.content}</p>
                  ) : null}
                </div>
                <Button size="icon" variant="ghost" onClick={() => onRemoveKb(it.id)} aria-label="Remover">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 space-y-2">
        <h3 className="font-medium">Histórico de alterações</h3>
        {(brainQ.data?.events ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum evento registrado ainda.</p>
        ) : (
          <ul className="text-xs space-y-1">
            {(brainQ.data?.events ?? []).map((ev: any) => (
              <li key={ev.id} className="flex flex-wrap items-center gap-2 border-b py-1">
                <Badge variant="outline" className="text-[10px]">{ev.event_type}</Badge>
                {ev.previous_status || ev.new_status ? (
                  <span className="text-muted-foreground">
                    {ev.previous_status ?? "—"} → {ev.new_status ?? "—"}
                  </span>
                ) : null}
                {ev.note ? <span className="text-muted-foreground">· {ev.note}</span> : null}
                <span className="ml-auto text-muted-foreground">
                  {new Date(ev.created_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Integrações reais com WhatsApp/N8N e execução do agente entram na Fase 3.5, após credenciais e homologação.
      </p>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        {icon} {label}
      </Label>
      {children}
    </div>
  );
}
