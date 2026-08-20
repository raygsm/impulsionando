import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  HeartPulse,
  KeyRound,
  Loader2,
  MessageCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { requireChrismedManagement } from "@/lib/chrismed-management";

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";

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
  status: string;
  attempts: number;
  created_at: string;
  sent_at: string | null;
};

type MpStatus = {
  configured: boolean;
  environment: "sandbox" | "production" | null;
  public_key: string | null;
  active?: boolean;
  has_access_token: boolean;
  has_webhook_secret: boolean;
  updated_at?: string | null;
};

const operationalGroups = [
  {
    title: "Clínica e prontuário",
    icon: HeartPulse,
    description: "Prontuário eletrônico, documentos, evoluções e pareceres clínicos.",
    links: [
      ["Prontuário Eletrônico", "/ehr"],
      ["Agenda e consultas", "/agenda/appointments"],
      ["Pacientes", "/crm/leads"],
    ],
  },
  {
    title: "Medicina Ocupacional",
    icon: Activity,
    description: "Empresas, trabalhadores, riscos, PGR, PCMSO, ASO, exames, documentos e eSocial SST.",
    links: [
      ["Cockpit ocupacional", "/chrismed/ocupacional-gestao"],
      ["Página institucional", "/chrismed/medicina-ocupacional"],
      ["Agenda ocupacional", "/agenda/appointments"],
    ],
  },
  {
    title: "Agenda",
    icon: CalendarDays,
    description: "Consultas, horários e oportunidades.",
    links: [
      ["Agenda e consultas", "/agenda/appointments"],
      ["Disponibilidade e escalas", "/agenda/schedules"],
      ["Pega-Agenda", "/agenda/profissional"],
      ["Lista de espera", "/agenda/waitlist"],
    ],
  },
  {
    title: "Pessoas",
    icon: Users,
    description: "Pacientes, Time CHRISMED e acessos.",
    links: [
      ["Time CHRISMED", "/chrismed/time"],
      ["Pacientes", "/crm/leads"],
      ["Usuários e acessos", "/users"],
    ],
  },
  {
    title: "Comunicação",
    icon: MessageCircle,
    description: "WhatsApp, jornadas, confirmações e acompanhamento operacional.",
    links: [
      ["WhatsApp", "/chrismed/whatsapp"],
      ["Central de alertas", "/chrismed/alertas"],
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
    description: "Contratos, termos, políticas e documentação operacional.",
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
      ["Central de alertas", "/chrismed/alertas"],
      ["Visão CHRISMED 360", "/admin/clientes/chrismed/painel"],
    ],
  },
] as const;

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function friendlyStatus(status: string) {
  return ({
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Recusado",
    cancelled: "Cancelado",
    queued: "Na fila",
    sending: "Enviando",
    sent: "Enviado",
    failed: "Falha",
  } as Record<string, string>)[status] ?? status;
}

function statusClasses(status: string) {
  if (["approved", "sent"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (["pending", "queued", "sending"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-950";
  if (["failed", "rejected", "cancelled"].includes(status)) return "border-red-200 bg-red-50 text-red-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export const Route = createFileRoute("/_authenticated/chrismed/admin")({
  beforeLoad: requireChrismedManagement,
  component: ChrismedAdmin,
  head: () => ({
    meta: [
      { title: "Gestão CHRISMED" },
      {
        name: "description",
        content: "Centro operacional CHRISMED para clínica, prontuário, medicina ocupacional, agenda, comunicação, financeiro e integrações.",
      },
    ],
  }),
});

function ChrismedAdmin() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outbox, setOutbox] = useState<OutboxRow[]>([]);
  const [mpStatus, setMpStatus] = useState<MpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mpSaving, setMpSaving] = useState(false);
  const [mpEnvironment, setMpEnvironment] = useState<"sandbox" | "production">("production");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpWebhookSecret, setMpWebhookSecret] = useState("");

  async function load() {
    setLoading(true);
    setLoadFailed(false);
    const [pay, out, mp] = await Promise.all([
      supabase
        .from("mpago_payments")
        .select("id,status,amount_cents,payer_name,payer_email,payment_method,created_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("chrismed_communication_outbox")
        .select("id,event_code,channel,recipient,status,attempts,created_at,sent_at")
        .eq("company_id", CHRISMED_COMPANY_ID)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.rpc("chrismed_get_mercado_pago_status"),
    ]);

    if (pay.error || out.error || mp.error) setLoadFailed(true);
    setPayments((pay.data as Payment[]) ?? []);
    setOutbox((out.data as unknown as OutboxRow[]) ?? []);
    if (!mp.error && mp.data) {
      const status = mp.data as unknown as MpStatus;
      setMpStatus(status);
      if (status.environment) setMpEnvironment(status.environment);
      if (status.public_key) setMpPublicKey(status.public_key);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function saveMercadoPago() {
    if (mpPublicKey.trim().length < 10) return toast.error("Informe a Public Key do Mercado Pago.");
    if (mpAccessToken.trim().length < 20) return toast.error("Informe um Access Token válido.");
    if (mpWebhookSecret.trim().length < 16) return toast.error("Informe o segredo de assinatura do webhook.");

    setMpSaving(true);
    const { error } = await supabase.rpc("chrismed_configure_mercado_pago", {
      p_environment: mpEnvironment,
      p_public_key: mpPublicKey.trim(),
      p_access_token: mpAccessToken.trim(),
      p_webhook_secret: mpWebhookSecret.trim(),
    });
    setMpSaving(false);

    if (error) return toast.error("Não foi possível salvar a integração agora. Verifique as credenciais e tente novamente.");
    setMpAccessToken("");
    setMpWebhookSecret("");
    toast.success("Configuração salva no cofre seguro.");
    await load();
  }

  const approved = useMemo(() => payments.filter((item) => item.status === "approved"), [payments]);
  const gmv = useMemo(() => approved.reduce((sum, item) => sum + Number(item.amount_cents || 0) / 100, 0), [approved]);
  const pending = payments.filter((item) => item.status === "pending").length;
  const queued = outbox.filter((item) => ["queued", "sending", "pending"].includes(item.status)).length;
  const failed = outbox.filter((item) => item.status === "failed").length;
  const mpReady = Boolean(mpStatus?.configured && mpStatus.has_access_token && mpStatus.has_webhook_secret);

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#596660]">Centro operacional</p>
            <h1 className="mt-2 text-3xl font-bold">Gestão CHRISMED</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#3F4A47]">Clínica, prontuário eletrônico, medicina ocupacional, agenda, comunicação, financeiro, pessoas e integrações em um único painel.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 lg:mt-0">
            <Button asChild variant="outline"><a href="/ehr"><Stethoscope className="mr-2 h-4 w-4" />Prontuário</a></Button>
            <Button asChild variant="outline"><a href="/chrismed/ocupacional-gestao"><HeartPulse className="mr-2 h-4 w-4" />Ocupacional</a></Button>
            <Button asChild variant="outline"><a href="/chrismed/whatsapp"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</a></Button>
            <Button asChild variant="outline"><a href="/chrismed/alertas"><AlertTriangle className="mr-2 h-4 w-4" />Alertas</a></Button>
            <Button asChild variant="outline"><a href="/chrismed/setup"><Settings className="mr-2 h-4 w-4" />Configurações</a></Button>
            <Button onClick={() => void load()} disabled={loading} className="bg-[#071C18] text-white"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
          </div>
        </header>

        {loading && payments.length === 0 && outbox.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border bg-white text-sm"><Loader2 className="h-5 w-5 animate-spin" />Carregando dados operacionais…</div>
        ) : null}

        {loadFailed ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Alguns dados não puderam ser atualizados agora.</strong> Use “Atualizar” para tentar novamente.</div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["GMV aprovado", brl(gmv)],
            ["Pagamentos aprovados", String(approved.length)],
            ["PIX pendentes", String(pending)],
            ["Comunicação na fila", String(queued)],
          ].map(([label, value]) => (
            <Card key={label} className="border-[#D9D3CB] bg-white">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-[#596660]">{label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{value}</div>{label === "Comunicação na fila" ? <div className="mt-1 text-xs text-[#596660]">{failed} com falha</div> : null}</CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {operationalGroups.map(({ title, icon: Icon, description, links }) => (
            <Card key={title} className="border-[#D9D3CB] bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" />{title}</CardTitle><p className="text-sm text-[#596660]">{description}</p></CardHeader>
              <CardContent className="space-y-2">
                {links.map(([label, href]) => <Button key={href + label} asChild variant="outline" className="w-full justify-start"><a href={href}>{label}</a></Button>)}
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className={`bg-white ${mpReady ? "border-emerald-300" : "border-amber-300"}`}>
          <CardHeader>
            <div className="flex justify-between gap-3">
              <div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Mercado Pago</CardTitle><p className="mt-1 text-sm text-[#3F4A47]">Segredos permanecem protegidos no cofre.</p></div>
              <Badge>{mpReady ? "CONFIGURADO" : "PENDENTE"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [ShieldCheck, "Public Key", mpStatus?.public_key ? "Configurada" : "Não configurada"],
                [KeyRound, "Access Token", mpStatus?.has_access_token ? "Protegido no cofre" : "Não configurado"],
                [CheckCircle2, "Webhook Secret", mpStatus?.has_webhook_secret ? "Protegido no cofre" : "Não configurado"],
              ].map(([Icon, title, status]) => {
                const C = Icon as typeof ShieldCheck;
                return <div key={String(title)} className="rounded-xl border p-3"><C className="mb-2 h-4 w-4" /><strong className="text-sm">{String(title)}</strong><p className="mt-1 text-xs text-[#596660]">{String(status)}</p></div>;
              })}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div><Label>Ambiente</Label><select value={mpEnvironment} onChange={(event) => setMpEnvironment(event.target.value as "sandbox" | "production")} className="h-10 w-full rounded-md border px-3"><option value="production">Produção</option><option value="sandbox">Homologação</option></select></div>
              <div><Label>Public Key</Label><Input value={mpPublicKey} onChange={(event) => setMpPublicKey(event.target.value)} /></div>
              <div><Label>Access Token</Label><Input type="password" value={mpAccessToken} onChange={(event) => setMpAccessToken(event.target.value)} /></div>
              <div><Label>Webhook Secret</Label><Input type="password" value={mpWebhookSecret} onChange={(event) => setMpWebhookSecret(event.target.value)} /></div>
            </div>
            <Button onClick={() => void saveMercadoPago()} disabled={mpSaving}>{mpSaving ? "Salvando…" : "Salvar integração"}</Button>
          </CardContent>
        </Card>

        <Card className="border-[#D9D3CB] bg-white">
          <CardHeader><CardTitle>Comunicações recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {outbox.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <div className="min-w-0"><strong>{item.event_code}</strong><p className="truncate text-xs text-[#596660]">{item.recipient}</p></div>
                <Badge className={statusClasses(item.status)}>{friendlyStatus(item.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
