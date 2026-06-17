/**
 * /admin/clube — Painel administrativo do Clube Impulsionando.
 * KPIs, top parceiros, últimos cadastros, jornada de 21 dias e moderação de enquetes.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getAdminClubeOverview, listJourneySteps, upsertJourneyStep, deleteJourneyStep,
  listAdminPolls, setPollActive, listClubeCronRuns, getJourneyLogAudit,
} from "@/lib/clube.functions";
import { Users, Crown, MapPin, Share2, Bell, DollarSign, Trophy, RefreshCw, CalendarDays, Vote, Trash2, Plus, Save, Activity, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clube")({
  component: AdminClubePage,
});

const BRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function AdminClubePage() {
  const qc = useQueryClient();
  const fetchOverview = useServerFn(getAdminClubeOverview);
  const fetchSteps = useServerFn(listJourneySteps);
  const fetchPolls = useServerFn(listAdminPolls);
  const upsertStep = useServerFn(upsertJourneyStep);
  const delStep = useServerFn(deleteJourneyStep);
  const togglePoll = useServerFn(setPollActive);

  const q = useQuery({ queryKey: ["admin-clube-overview"], queryFn: () => fetchOverview() });
  const steps = useQuery({ queryKey: ["admin-clube-steps"], queryFn: () => fetchSteps() });
  const polls = useQuery({ queryKey: ["admin-clube-polls"], queryFn: () => fetchPolls() });

  if (q.isLoading) return <div className="p-6">Carregando…</div>;
  if (q.error) return <div className="p-6 text-destructive">{(q.error as any).message}</div>;
  const d = q.data!;

  const kpis = [
    { icon: Users,      label: "Membros totais",       value: d.kpis.totalMembers.toLocaleString("pt-BR") },
    { icon: Crown,      label: "Premium ativos",       value: d.kpis.premiumActive.toLocaleString("pt-BR") },
    { icon: DollarSign, label: "MRR estimado",         value: BRL(d.kpis.mrrCents) },
    { icon: MapPin,     label: "Visitas (30d)",        value: d.kpis.visits30d.toLocaleString("pt-BR") },
    { icon: Bell,       label: "Alertas ativos",       value: d.kpis.activeAlerts.toLocaleString("pt-BR") },
    { icon: Share2,     label: "Indicações totais",    value: d.kpis.referrals.toLocaleString("pt-BR") },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Badge className="bg-gradient-primary mb-2"><Crown className="w-3 h-3 mr-1" /> Admin · Clube Impulsionando</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Cockpit do Clube</h1>
          <p className="text-sm text-muted-foreground">Membros, conversão, MRR, jornada e moderação de enquetes.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/consumer/unified">Membros →</Link></Button>
          <Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" /> {label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="jornada"><CalendarDays className="w-3.5 h-3.5 mr-1" /> Jornada 21 dias</TabsTrigger>
          <TabsTrigger value="enquetes"><Vote className="w-3.5 h-3.5 mr-1" /> Enquetes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Trophy className="w-4 h-4" /> Top parceiros (por visitas)</h2>
              {d.topPartners.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda sem visitas registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {d.topPartners.map((p: any, i: number) => (
                    <li key={p.name + i} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                      <span className="truncate"><span className="text-muted-foreground mr-2">#{i + 1}</span>{p.name}</span>
                      <Badge variant="secondary">{p.total} visitas</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Últimos cadastros</h2>
              {d.recentSignups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cadastro recente.</p>
              ) : (
                <ul className="space-y-2">
                  {d.recentSignups.map((u: any) => (
                    <li key={u.user_id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.full_name || "Sem nome"}</div>
                        <div className="text-xs text-muted-foreground">{[u.city, u.state].filter(Boolean).join(" · ") || "—"}</div>
                      </div>
                      <Badge variant="outline">{u.current_level}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jornada" className="mt-6 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h2 className="font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Jornada de conversão (21 dias)</h2>
                <p className="text-xs text-muted-foreground">Disparado diariamente via cron. Variáveis: <code className="text-[10px] bg-muted px-1 rounded">{`{{name}}`} {`{{level}}`} {`{{referral_code}}`} {`{{visits_to_next}}`}</code></p>
              </div>
            </div>
            <JourneyEditor
              steps={steps.data ?? []}
              onSave={async (s) => { try { await upsertStep({ data: s }); toast.success("Passo salvo"); qc.invalidateQueries({ queryKey: ["admin-clube-steps"] }); } catch (e: any) { toast.error(e.message); } }}
              onDelete={async (id) => { if (!confirm("Excluir passo?")) return; try { await delStep({ data: { id } }); toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["admin-clube-steps"] }); } catch (e: any) { toast.error(e.message); } }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="enquetes" className="mt-6">
          <Card className="p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Vote className="w-4 h-4" /> Moderação de enquetes</h2>
            {!polls.data?.length && <p className="text-sm text-muted-foreground">Nenhuma enquete criada ainda.</p>}
            <ul className="divide-y">
              {(polls.data ?? []).map((p: any) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.question}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.companies?.trade_name || p.companies?.name || "—"} · {p.kind} · {(p.options as any[])?.length ?? 0} opções
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Ativa" : "Inativa"}</Badge>
                    <Switch checked={p.active} onCheckedChange={async (v) => {
                      try { await togglePoll({ data: { id: p.id, active: v } }); qc.invalidateQueries({ queryKey: ["admin-clube-polls"] }); } catch (e: any) { toast.error(e.message); }
                    }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function JourneyEditor({ steps, onSave, onDelete }: { steps: any[]; onSave: (s: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [draft, setDraft] = useState({
    day_offset: 0, channel: "email", audience: "free",
    event_code: "clube_custom", subject: "", body: "", active: true,
  });

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {steps.map((s) => <StepRow key={s.id} step={s} onSave={onSave} onDelete={onDelete} />)}
      </ul>
      <Card className="p-3 border-dashed">
        <div className="text-xs font-medium mb-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Novo passo</div>
        <div className="grid gap-2 md:grid-cols-4">
          <div><Label className="text-xs">Dia</Label><Input type="number" value={draft.day_offset} onChange={(e) => setDraft({ ...draft, day_offset: parseInt(e.target.value) || 0 })} /></div>
          <div><Label className="text-xs">Canal</Label>
            <select className="w-full h-9 border rounded px-2 text-sm" value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}>
              <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="in_app">In-app</option>
            </select>
          </div>
          <div><Label className="text-xs">Público</Label>
            <select className="w-full h-9 border rounded px-2 text-sm" value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })}>
              <option value="free">Free</option><option value="premium">Premium</option><option value="all">Todos</option>
            </select>
          </div>
          <div><Label className="text-xs">Código do evento</Label><Input value={draft.event_code} onChange={(e) => setDraft({ ...draft, event_code: e.target.value })} /></div>
        </div>
        <div className="mt-2"><Label className="text-xs">Assunto (email)</Label><Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></div>
        <div className="mt-2"><Label className="text-xs">Mensagem</Label><Textarea rows={2} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></div>
        <Button size="sm" className="mt-2" onClick={async () => {
          await onSave({ ...draft, subject: draft.subject || null });
          setDraft({ ...draft, body: "" });
        }}><Save className="w-3 h-3 mr-1" /> Adicionar passo</Button>
      </Card>
    </div>
  );
}

function StepRow({ step, onSave, onDelete }: { step: any; onSave: (s: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [s, setS] = useState(step);
  const dirty = JSON.stringify(s) !== JSON.stringify(step);
  return (
    <li className="border rounded-lg p-3">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Badge variant="outline">D+{s.day_offset}</Badge>
        <Badge variant="secondary">{s.channel}</Badge>
        <Badge variant="outline">{s.audience}</Badge>
        <code className="text-xs text-muted-foreground">{s.event_code}</code>
        <div className="ml-auto flex items-center gap-2">
          <Switch checked={s.active} onCheckedChange={(v) => setS({ ...s, active: v })} />
          <Button size="sm" variant="ghost" onClick={() => onDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      </div>
      {s.channel === "email" && <Input className="mb-2" placeholder="Assunto" value={s.subject ?? ""} onChange={(e) => setS({ ...s, subject: e.target.value })} />}
      <Textarea rows={2} value={s.body} onChange={(e) => setS({ ...s, body: e.target.value })} />
      {dirty && <Button size="sm" className="mt-2" onClick={() => onSave(s)}><Save className="w-3 h-3 mr-1" /> Salvar alterações</Button>}
    </li>
  );
}
