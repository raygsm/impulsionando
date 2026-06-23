import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getRiomedCommercialOverview,
  listRiomedQuotes,
  confirmRiomedQuote,
  updateRiomedQuoteStatus,
} from "@/lib/riomed-commercial.functions";
import {
  listRiomedSellerLeads,
  listRiomedTickets,
  updateRiomedLeadStatus,
  updateRiomedTicketStatus,
  getRiomedTeamPerformance,
} from "@/lib/riomed-public.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, Loader2, CheckCircle2, XCircle, Send, Users, LifeBuoy, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/crm")({
  head: () => ({ meta: [{ title: "Rio Med · CRM Comercial" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='crm' title='CRM RioMed'><Page /></TenantModuleShell>),
});

const STAGES = [
  { key: "draft", label: "Rascunho" },
  { key: "sent", label: "Enviada" },
  { key: "negotiating", label: "Negociando" },
  { key: "won", label: "Ganha" },
  { key: "lost", label: "Perdida" },
];

function fmt(v: number, c = "BOB") {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: c }).format(v || 0);
}

function Page() {
  const overviewFn = useServerFn(getRiomedCommercialOverview);
  const listFn = useServerFn(listRiomedQuotes);
  const confirmFn = useServerFn(confirmRiomedQuote);
  const updateFn = useServerFn(updateRiomedQuoteStatus);

  const overview = useQuery({ queryKey: ["riomed-crm-overview"], queryFn: () => overviewFn() });
  const quotes = useQuery({ queryKey: ["riomed-quotes"], queryFn: () => listFn({ data: { limit: 100 } }) });
  const [busy, setBusy] = useState<string | null>(null);

  async function act(quoteId: string, action: "confirm" | "send" | "lost" | "cancelled") {
    setBusy(quoteId);
    try {
      if (action === "confirm") {
        const r = await confirmFn({ data: { quoteId } });
        toast.success(`Ordem criada: ${r.orderId.slice(0, 8)}…`);
      } else {
        const map: any = { send: "sent", lost: "lost", cancelled: "cancelled" };
        await updateFn({ data: { quoteId, status: map[action] } });
        toast.success("Status atualizado");
      }
      overview.refetch(); quotes.refetch();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }

  const o = overview.data;
  const all = quotes.data ?? [];
  const byStage = (k: string) => all.filter((q: any) => q.status === k);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> CRM Comercial — Rio Med
        </h1>
        <p className="text-sm text-muted-foreground">
          Cotações, pipeline, leads de vendedores, tickets técnicos e desempenho da equipe.
        </p>
      </header>

      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quotes"><TrendingUp className="h-4 w-4 mr-1" />Cotações</TabsTrigger>
          <TabsTrigger value="leads"><Users className="h-4 w-4 mr-1" />Leads</TabsTrigger>
          <TabsTrigger value="tickets"><LifeBuoy className="h-4 w-4 mr-1" />Tickets</TabsTrigger>
          <TabsTrigger value="team"><Award className="h-4 w-4 mr-1" />Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardHeader><CardTitle className="text-sm">Abertas</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{o?.openCount ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{o ? fmt(o.openValue) : ""}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Ganhas (30d)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-emerald-600">{o?.wonCount ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{o ? fmt(o.wonValue) : ""}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Perdidas (30d)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-destructive">{o?.lostCount ?? "—"}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Win rate</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{o ? `${(o.winRate * 100).toFixed(0)}%` : "—"}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Minhas vendas (30d)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{o ? fmt(o.myWonValue) : "—"}</div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {STAGES.map(s => {
              const col = byStage(s.key);
              const total = col.reduce((acc: number, q: any) => acc + Number(q.total || 0), 0);
              return (
                <Card key={s.key} className="min-h-[300px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {s.label} <Badge variant="secondary">{col.length}</Badge>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">{fmt(total)}</div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {col.map((q: any) => (
                      <div key={q.id} className="border rounded p-2 text-xs space-y-1">
                        <div className="font-mono font-semibold">{q.code}</div>
                        <div className="text-muted-foreground">{fmt(Number(q.total), q.currency)}</div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">{q.channel}</Badge>
                        </div>
                        {q.status === "draft" && (
                          <Button size="sm" variant="outline" className="w-full h-7 text-xs"
                            disabled={busy === q.id} onClick={() => act(q.id, "send")}>
                            {busy === q.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" />Enviar</>}
                          </Button>
                        )}
                        {["sent", "negotiating"].includes(q.status) && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" className="flex-1 h-7 text-xs"
                              disabled={busy === q.id} onClick={() => act(q.id, "confirm")}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />Ganhar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs"
                              disabled={busy === q.id} onClick={() => act(q.id, "lost")}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {col.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">vazio</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="pt-4"><LeadsPanel /></TabsContent>
        <TabsContent value="tickets" className="pt-4"><TicketsPanel /></TabsContent>
        <TabsContent value="team" className="pt-4"><TeamPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

const LEAD_STATUSES = ["novo","em_contato","qualificado","ganho","perdido"] as const;
const TICKET_STATUSES = ["aberto","triagem","em_atendimento","aguardando_peca","resolvido","cancelado"] as const;

function LeadsPanel() {
  const listFn = useServerFn(listRiomedSellerLeads);
  const updFn = useServerFn(updateRiomedLeadStatus);
  const q = useQuery({ queryKey: ["riomed-seller-leads"], queryFn: () => listFn({ data: { limit: 200 } }) });
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(leadId: string, status: typeof LEAD_STATUSES[number]) {
    setBusy(leadId);
    try { await updFn({ data: { leadId, status } }); toast.success("Lead atualizado"); q.refetch(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }
  const leads = q.data?.leads ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {LEAD_STATUSES.map(st => {
        const col = leads.filter((l: any) => (l.status ?? "novo") === st);
        return (
          <Card key={st} className="min-h-[300px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between capitalize">
                {st.replace("_"," ")} <Badge variant="secondary">{col.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {col.map((l: any) => (
                <div key={l.id} className="border rounded p-2 text-xs space-y-1">
                  <div className="font-semibold">{l.customer_name}</div>
                  <div className="text-muted-foreground">{l.customer_phone}</div>
                  {l.profile && <Badge variant="outline" className="text-[10px]">{l.profile}</Badge>}
                  {l.seller && <div className="text-[10px] text-muted-foreground">→ {l.seller.full_name}</div>}
                  {l.interest && <div className="text-[10px] line-clamp-2">{l.interest}</div>}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {LEAD_STATUSES.filter(s => s !== st).map(s => (
                      <Button key={s} size="sm" variant="ghost" className="h-6 text-[10px] px-1"
                        disabled={busy === l.id} onClick={() => setStatus(l.id, s)}>→ {s}</Button>
                    ))}
                  </div>
                </div>
              ))}
              {col.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">vazio</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function TicketsPanel() {
  const listFn = useServerFn(listRiomedTickets);
  const updFn = useServerFn(updateRiomedTicketStatus);
  const q = useQuery({ queryKey: ["riomed-tickets"], queryFn: () => listFn({ data: { limit: 200 } }) });
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(ticketId: string, status: typeof TICKET_STATUSES[number]) {
    setBusy(ticketId);
    try { await updFn({ data: { ticketId, status } }); toast.success("Ticket atualizado"); q.refetch(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  }
  const tickets = q.data?.tickets ?? [];
  const urgencyColor: Record<string, string> = { critico: "destructive", alto: "default", normal: "secondary", baixo: "outline" };
  return (
    <div className="space-y-2">
      {tickets.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">Nenhum ticket aberto.</div>}
      {tickets.map((t: any) => (
        <Card key={t.id}>
          <CardContent className="p-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold">{t.protocol}</span>
                <Badge variant={(urgencyColor[t.urgency] ?? "outline") as any} className="text-[10px]">{t.urgency}</Badge>
                <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                {t.issue_category && <Badge variant="secondary" className="text-[10px]">{t.issue_category}</Badge>}
              </div>
              <div className="text-sm font-medium">{t.customer_name} — {t.customer_phone}</div>
              <div className="text-xs text-muted-foreground">
                {t.equipment_type ?? "—"} {t.equipment_brand ? `· ${t.equipment_brand}` : ""} {t.location_city ? `· ${t.location_city}` : ""}
              </div>
              {t.description && <div className="text-xs text-muted-foreground line-clamp-2">{t.description}</div>}
            </div>
            <div className="flex flex-wrap gap-1">
              {TICKET_STATUSES.filter(s => s !== t.status).map(s => (
                <Button key={s} size="sm" variant="outline" className="h-7 text-[10px]"
                  disabled={busy === t.id} onClick={() => setStatus(t.id, s)}>{s}</Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TeamPanel() {
  const fn = useServerFn(getRiomedTeamPerformance);
  const q = useQuery({ queryKey: ["riomed-team-perf"], queryFn: () => fn() });
  const team = q.data?.team ?? [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {team.map((m: any) => {
        const s = m.stats;
        const winRate = s.total > 0 ? Math.round((s.ganho / s.total) * 100) : 0;
        return (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{m.full_name}</span>
                <Badge variant={m.member_role === "gerente" ? "default" : "secondary"} className="text-[10px]">{m.member_role}</Badge>
              </CardTitle>
              <div className="text-xs text-muted-foreground">{m.specialty ?? "—"} · {m.phone ?? ""}</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xl font-bold">{s.total}</div><div className="text-[10px] text-muted-foreground">Leads</div></div>
                <div><div className="text-xl font-bold text-emerald-600">{s.ganho}</div><div className="text-[10px] text-muted-foreground">Ganhos</div></div>
                <div><div className="text-xl font-bold">{winRate}%</div><div className="text-[10px] text-muted-foreground">Win rate</div></div>
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <Badge variant="outline">novo {s.novo}</Badge>
                <Badge variant="outline">contato {s.em_contato}</Badge>
                <Badge variant="outline">qualif {s.qualificado}</Badge>
                <Badge variant="outline">perdido {s.perdido}</Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {team.length === 0 && <div className="text-sm text-muted-foreground text-center py-8 col-span-full">Sem equipe cadastrada.</div>}
    </div>
  );
}
