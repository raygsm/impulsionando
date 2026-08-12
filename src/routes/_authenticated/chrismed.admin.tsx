import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  RefreshCw,
  Settings,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { requireChrismedManagement } from "@/lib/chrismed-management";

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";

export const Route = createFileRoute("/_authenticated/chrismed/admin")({
  beforeLoad: requireChrismedManagement,
  component: ChrismedAdmin,
  head: () => ({
    meta: [
      { title: "CHRISMED — Gestão" },
      {
        name: "description",
        content: "Centro operacional da CHRISMED: agenda, pessoas, comunicação, financeiro e configurações.",
      },
    ],
  }),
});

type Payment = {
  id: string;
  status: string;
  amount_cents: number;
  payer_name: string | null;
  payer_email: string | null;
  payment_method: string | null;
  created_at: string;
};

type OutboxRow = {
  id: string;
  event_code: string;
  channel: string;
  recipient: string;
  payload: Record<string, unknown> | null;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusColor(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (["approved", "sent"].includes(s)) return "default";
  if (["pending", "queued", "sending"].includes(s)) return "secondary";
  if (["failed", "rejected", "cancelled"].includes(s)) return "destructive";
  return "outline";
}

const operationalGroups = [
  {
    title: "Agenda",
    icon: CalendarDays,
    description: "Consultas, profissionais, horários e oportunidades.",
    links: [
      ["Agenda e consultas", "/agenda/appointments"],
      ["Profissionais", "/agenda/professionals"],
      ["Disponibilidade e escalas", "/agenda/schedules"],
      ["Pega Agenda", "/agenda/profissional"],
      ["Lista de espera", "/agenda/waitlist"],
    ],
  },
  {
    title: "Pessoas",
    icon: Users,
    description: "Pacientes, profissionais e acessos.",
    links: [
      ["Pacientes", "/crm/leads"],
      ["Profissionais da saúde", "/agenda/professionals"],
      ["Usuários e acessos", "/users"],
    ],
  },
  {
    title: "Comunicação",
    icon: Stethoscope,
    description: "Jornadas, confirmações e acompanhamento operacional.",
    links: [
      ["Central de Alertas", "/chrismed/alertas"],
      ["CRM e jornadas", "/crm/board"],
      ["Eventos", "/eventos"],
    ],
  },
  {
    title: "Financeiro",
    icon: Wallet,
    description: "Pagamentos, transações e cobrança.",
    links: [
      ["Financeiro", "/finance"],
      ["Transações", "/finance/transactions"],
      ["Integrações financeiras", "/finance/integracoes"],
    ],
  },
  {
    title: "Documentos",
    icon: FileText,
    description: "Contratos, termos e políticas da operação.",
    links: [
      ["Contratos e cobranças", "/admin/billing-contracts"],
      ["Termos CHRISMED", "/termos"],
      ["Privacidade", "/privacidade"],
    ],
  },
  {
    title: "Gestão",
    icon: Settings,
    description: "Configurações, integrações e diagnóstico.",
    links: [
      ["Configurações do sistema", "/chrismed/setup"],
      ["Central de Alertas", "/chrismed/alertas"],
      ["Visão CHRISMED 360", "/admin/clientes/chrismed/painel"],
    ],
  },
] as const;

function ChrismedAdmin() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    const [pay, out] = await Promise.all([
      supabase
        .from("mpago_payments")
        .select("id,status,amount_cents,payer_name,payer_email,payment_method,created_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("chrismed_communication_outbox")
        .select("id,event_code,channel,recipient,payload,status,attempts,last_error,created_at,sent_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (pay.error || out.error) {
      setLoadError(pay.error?.message ?? out.error?.message ?? "Falha ao carregar dados operacionais.");
    }
    setPayments((pay.data as Payment[]) ?? []);
    setOutbox((out.data as unknown as OutboxRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const approved = payments.filter((p) => p.status === "approved");
  const gmv = approved.reduce((s, p) => s + Number(p.amount_cents || 0) / 100, 0);
  const pending = payments.filter((p) => p.status === "pending").length;
  const queued = outbox.filter((o) => ["queued", "sending", "pending"].includes(o.status)).length;
  const failed = outbox.filter((o) => o.status === "failed").length;

  return (
    <div className="container mx-auto max-w-7xl space-y-7 px-4 py-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Centro operacional</p>
          <h1 className="text-3xl font-bold tracking-tight">Gestão CHRISMED</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Operação clínica, agenda, comunicação e financeiro organizados por contexto — sem misturar recursos técnicos com tarefas do dia a dia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/chrismed/alertas"><AlertTriangle className="mr-2 h-4 w-4" />Central de Alertas</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/chrismed/setup"><Settings className="mr-2 h-4 w-4" />Configurações</a>
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>
      </header>

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores operacionais">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">GMV aprovado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{brl(gmv)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pagamentos aprovados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{approved.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">PIX pendentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Comunicação</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{queued}</div><div className="text-xs text-muted-foreground">na fila · {failed} falhas</div></CardContent></Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Áreas da gestão CHRISMED">
        {operationalGroups.map(({ title, icon: Icon, description, links }) => (
          <Card key={title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
                <div><CardTitle className="text-lg">{title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              {links.map(([label, href]) => (
                <Button key={`${title}-${href}-${label}`} asChild variant="ghost" className="h-10 justify-start px-3 font-normal">
                  <a href={href}>{label}</a>
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Pagamentos recentes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left text-muted-foreground"><tr><th className="py-2 pr-3">Quando</th><th className="py-2 pr-3">Pagador</th><th className="py-2 pr-3">Valor</th><th className="py-2 pr-3">Status</th></tr></thead>
              <tbody>
                {payments.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum pagamento encontrado.</td></tr>}
                {payments.map((p) => <tr key={p.id} className="border-b last:border-0"><td className="py-2 pr-3 whitespace-nowrap">{new Date(p.created_at).toLocaleString("pt-BR")}</td><td className="py-2 pr-3"><div className="font-medium">{p.payer_name ?? "—"}</div><div className="text-xs text-muted-foreground">{p.payer_email ?? ""}</div></td><td className="py-2 pr-3 font-medium">{brl(Number(p.amount_cents || 0) / 100)}</td><td className="py-2 pr-3"><Badge variant={statusColor(p.status)}>{p.status}</Badge></td></tr>)}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Comunicações recentes</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left text-muted-foreground"><tr><th className="py-2 pr-3">Quando</th><th className="py-2 pr-3">Evento</th><th className="py-2 pr-3">Destinatário</th><th className="py-2 pr-3">Status</th></tr></thead>
              <tbody>
                {outbox.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhuma comunicação registrada.</td></tr>}
                {outbox.map((o) => <tr key={o.id} className="border-b last:border-0"><td className="py-2 pr-3 whitespace-nowrap">{new Date(o.created_at).toLocaleString("pt-BR")}</td><td className="py-2 pr-3"><div className="font-medium">{o.event_code}</div><div className="text-xs uppercase text-muted-foreground">{o.channel}</div></td><td className="py-2 pr-3 text-xs">{o.recipient}</td><td className="py-2 pr-3"><Badge variant={statusColor(o.status)}>{o.status}</Badge>{o.last_error && <div className="mt-1 max-w-xs truncate text-xs text-destructive" title={o.last_error}>{o.last_error}</div>}</td></tr>)}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
