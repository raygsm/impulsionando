import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getLead360, addLead360Activity } from "@/lib/lead-360.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, Tag, TrendingUp, Ticket, Calendar, MessageSquare,
  FileText, User, Plus, CheckCircle2, Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/crm/leads/$id")({
  head: () => ({ meta: [{ title: "Lead 360 — CRM" }] }),
  component: Lead360Page,
});

const ACT_ICON: Record<string, string> = {
  note: "📝", call: "📞", email: "✉️", meeting: "🤝", task: "✅", whatsapp: "💬",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-500", working: "bg-amber-500", qualified: "bg-emerald-500",
  disqualified: "bg-gray-400", converted: "bg-violet-500",
};

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Lead360Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchLead = useServerFn(getLead360);
  const addActivity = useServerFn(addLead360Activity);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "note", subject: "", notes: "" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["lead-360", id],
    queryFn: () => fetchLead({ data: { leadId: id } }),
  });

  const createAct = useMutation({
    mutationFn: () =>
      addActivity({
        data: { leadId: id, type: form.type, subject: form.subject, notes: form.notes },
      }),
    onSuccess: () => {
      toast.success("Atividade registrada");
      qc.invalidateQueries({ queryKey: ["lead-360", id] });
      setForm({ type: "note", subject: "", notes: "" });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="space-y-4 p-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }
  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">{(error as Error)?.message ?? "Lead não encontrado."}</p>
        <Button variant="outline" onClick={() => navigate({ to: "/crm/leads" })}>
          <ArrowLeft className="w-4 h-4 mr-1" />Voltar
        </Button>
      </div>
    );
  }

  const { lead, summary, opportunities, activities, tickets, customer, quotes, messages, appointments } = data;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Link to="/crm/leads" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Badge className={STATUS_COLOR[lead.status] + " text-white"}>{lead.status}</Badge>
        {summary.isCustomer && <Badge variant="outline" className="border-violet-500 text-violet-700">Cliente</Badge>}
      </div>
      <PageHeader
        title={lead.name}
        description="Visão 360° unificada do lead — pipeline, atendimentos, agenda e comunicações."
        action={
          <Button onClick={() => setOpen(true)} className="bg-gradient-primary shadow-elegant">
            <Plus className="w-4 h-4 mr-1" />Atividade
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <Card className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Pipeline</span><TrendingUp className="w-4 h-4 text-emerald-500" /></div><div className="text-lg font-semibold mt-1">{BRL(summary.pipelineValue)}</div><div className="text-[10px] text-muted-foreground">{summary.openOpportunities} abertas</div></Card>
        <Card className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Ganho</span><CheckCircle2 className="w-4 h-4 text-violet-500" /></div><div className="text-lg font-semibold mt-1">{BRL(summary.wonValue)}</div><div className="text-[10px] text-muted-foreground">{summary.wonOpportunities} fechadas</div></Card>
        <Card className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Tickets</span><Ticket className="w-4 h-4 text-amber-500" /></div><div className="text-lg font-semibold mt-1">{summary.tickets}</div><div className="text-[10px] text-muted-foreground">{summary.openTickets} abertos</div></Card>
        <Card className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Agenda</span><Calendar className="w-4 h-4 text-sky-500" /></div><div className="text-lg font-semibold mt-1">{summary.appointments}</div><div className="text-[10px] text-muted-foreground">compromissos</div></Card>
        <Card className="p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Comunicações</span><MessageSquare className="w-4 h-4 text-fuchsia-500" /></div><div className="text-lg font-semibold mt-1">{summary.messagesSent}</div><div className="text-[10px] text-muted-foreground">WhatsApp/Email</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Contato */}
        <Card className="p-4 h-fit">
          <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4" /><h3 className="font-semibold text-sm">Contato</h3></div>
          <div className="space-y-2 text-sm">
            {lead.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-muted-foreground" /><a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a></div>}
            {lead.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" /><a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lead.phone}</a></div>}
            {lead.source && <div><span className="text-xs text-muted-foreground">Origem:</span> <span className="font-medium">{lead.source}</span></div>}
            <div><span className="text-xs text-muted-foreground">Score:</span> <span className="font-medium">{lead.score}</span></div>
            <div><span className="text-xs text-muted-foreground">Desde:</span> {new Date(lead.created_at).toLocaleDateString("pt-BR")}</div>
            {!!lead.tags?.length && (
              <div className="flex flex-wrap gap-1 pt-2 border-t">
                {lead.tags.map((t: string) => <Badge key={t} variant="outline" className="text-[9px]"><Tag className="w-2 h-2 mr-1" />{t}</Badge>)}
              </div>
            )}
            {lead.notes && (
              <div className="pt-2 border-t text-xs text-muted-foreground italic">{lead.notes}</div>
            )}
          </div>
        </Card>

        {/* Abas */}
        <Card className="p-4">
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">Timeline ({summary.activities})</TabsTrigger>
              <TabsTrigger value="opps">Oportunidades ({summary.opportunities})</TabsTrigger>
              <TabsTrigger value="tickets">Suporte ({summary.tickets})</TabsTrigger>
              <TabsTrigger value="agenda">Agenda ({summary.appointments})</TabsTrigger>
              <TabsTrigger value="comm">Mensagens ({summary.messagesSent})</TabsTrigger>
              <TabsTrigger value="docs">Orçamentos ({quotes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-3 space-y-2">
              {!activities.length && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma atividade registrada.</p>}
              {activities.map((a: any) => (
                <div key={a.id} className="flex gap-3 p-2 rounded border bg-card/50">
                  <div className="text-xl">{ACT_ICON[a.activity_type] ?? "•"}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{a.subject}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.done_at ?? a.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    {a.content && <p className="text-xs text-muted-foreground mt-1">{a.content}</p>}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="opps" className="mt-3 space-y-2">
              {!opportunities.length && <p className="text-sm text-muted-foreground py-4 text-center">Sem oportunidades.</p>}
              {opportunities.map((o: any) => (
                <div key={o.id} className="flex justify-between items-center p-2 rounded border">
                  <div>
                    <div className="font-medium text-sm">{o.title}</div>
                    <div className="text-[10px] text-muted-foreground">{o.expected_close_at ? `Fecha em ${new Date(o.expected_close_at).toLocaleDateString("pt-BR")}` : "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{BRL(Number(o.value))}</div>
                    <Badge variant={o.status === "won" ? "default" : o.status === "lost" ? "destructive" : "outline"} className="text-[9px]">{o.status}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="tickets" className="mt-3 space-y-2">
              {!tickets.length && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum ticket vinculado.</p>}
              {tickets.map((t: any) => (
                <Link key={t.id} to="/admin/suporte-pro" className="block p-2 rounded border hover:bg-accent/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{t.subject}</div>
                      <div className="text-[10px] text-muted-foreground">{t.protocol} · {new Date(t.created_at).toLocaleDateString("pt-BR")}</div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[9px]">{t.priority}</Badge>
                      <Badge className="text-[9px]">{t.status}</Badge>
                    </div>
                  </div>
                  {(t.first_response_at || t.resolved_at) && (
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      {t.first_response_at && <span><Clock className="w-2 h-2 inline mr-1" />1ª resp: {new Date(t.first_response_at).toLocaleString("pt-BR")}</span>}
                      {t.resolved_at && <span><CheckCircle2 className="w-2 h-2 inline mr-1" />Resolvido: {new Date(t.resolved_at).toLocaleString("pt-BR")}</span>}
                    </div>
                  )}
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="agenda" className="mt-3 space-y-2">
              {!appointments.length && <p className="text-sm text-muted-foreground py-4 text-center">Sem compromissos.</p>}
              {appointments.map((a: any) => (
                <div key={a.id} className="flex justify-between items-center p-2 rounded border">
                  <div>
                    <div className="font-medium text-sm">{new Date(a.starts_at).toLocaleString("pt-BR")}</div>
                    <div className="text-[10px] text-muted-foreground">até {new Date(a.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <Badge className="text-[9px]">{a.status}</Badge>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="comm" className="mt-3 space-y-2">
              {!messages.length && <p className="text-sm text-muted-foreground py-4 text-center">Sem mensagens enviadas.</p>}
              {messages.map((m: any) => (
                <div key={m.id} className="flex justify-between items-center p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">{m.channel}</Badge>
                    <span className="text-sm">{m.subject ?? "(sem assunto)"}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant={m.status === "sent" ? "default" : "outline"} className="text-[9px]">{m.status}</Badge>
                    <div className="text-[10px] text-muted-foreground">{new Date(m.sent_at ?? m.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="docs" className="mt-3 space-y-2">
              {!quotes.length && <p className="text-sm text-muted-foreground py-4 text-center">Sem orçamentos.</p>}
              {quotes.map((q: any) => (
                <div key={q.id} className="flex justify-between items-center p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="font-medium text-sm">{q.code ?? q.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(q.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{BRL(Number(q.total ?? 0))}</div>
                    <Badge variant="outline" className="text-[9px]">{q.status}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {customer && (
        <Card className="p-3 mt-4 border-violet-500/40 bg-violet-50/40 dark:bg-violet-950/20">
          <div className="text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-violet-600" />
            Lead convertido em cliente em <strong>{new Date(customer.created_at).toLocaleDateString("pt-BR")}</strong>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar atividade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">📝 Nota</SelectItem>
                  <SelectItem value="call">📞 Ligação</SelectItem>
                  <SelectItem value="email">✉️ E-mail</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="meeting">🤝 Reunião</SelectItem>
                  <SelectItem value="task">✅ Tarefa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Assunto*</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Detalhes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button disabled={!form.subject || createAct.isPending} onClick={() => createAct.mutate()} className="w-full bg-gradient-primary shadow-elegant">
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
