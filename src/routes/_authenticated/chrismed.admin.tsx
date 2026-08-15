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
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  Loader2,
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
  { title: "Agenda", icon: CalendarDays, description: "Consultas, profissionais, horários e oportunidades.", links: [["Agenda e consultas", "/agenda/appointments"], ["Profissionais", "/agenda/professionals"], ["Disponibilidade e escalas", "/agenda/schedules"], ["Pega-Agenda", "/agenda/profissional"], ["Lista de espera", "/agenda/waitlist"]] },
  { title: "Pessoas", icon: Users, description: "Pacientes, profissionais e acessos.", links: [["Pacientes", "/crm/leads"], ["Profissionais da saúde", "/agenda/professionals"], ["Usuários e acessos", "/users"]] },
  { title: "Comunicação", icon: Stethoscope, description: "Jornadas, confirmações e acompanhamento operacional.", links: [["Central de alertas", "/chrismed/alertas"], ["CRM e jornadas", "/crm/board"], ["Eventos", "/eventos"]] },
  { title: "Financeiro", icon: Wallet, description: "Pagamentos, transações e cobrança.", links: [["Financeiro", "/finance"], ["Transações", "/finance/transactions"], ["Integrações financeiras", "/finance/integracoes"]] },
  { title: "Documentos", icon: FileText, description: "Contratos, termos e políticas da operação.", links: [["Contratos e cobranças", "/admin/billing-contracts"], ["Termos CHRISMED", "/termos"], ["Privacidade", "/privacidade"]] },
  { title: "Gestão", icon: Settings, description: "Configurações, integrações e diagnóstico.", links: [["Configurações do sistema", "/chrismed/setup"], ["Central de alertas", "/chrismed/alertas"], ["Visão CHRISMED 360", "/admin/clientes/chrismed/painel"]] },
] as const;

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function friendlyStatus(status: string) {
  const labels: Record<string, string> = {
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Recusado",
    cancelled: "Cancelado",
    queued: "Na fila",
    sending: "Enviando",
    sent: "Enviado",
    failed: "Falha",
  };
  return labels[status] ?? status;
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
      { name: "description", content: "Centro operacional CHRISMED para agenda, pessoas, comunicação, financeiro e configurações." },
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
      supabase.from("mpago_payments").select("id,status,amount_cents,payer_name,payer_email,payment_method,created_at").eq("company_id", CHRISMED_COMPANY_ID).order("created_at", { ascending: false }).limit(50),
      supabase.from("chrismed_communication_outbox").select("id,event_code,channel,recipient,status,attempts,created_at,sent_at").eq("company_id", CHRISMED_COMPANY_ID).order("created_at", { ascending: false }).limit(50),
      supabase.rpc("chrismed_get_mercado_pago_status"),
    ]);

    if (pay.error || out.error || mp.error) {
      console.error("[CHRISMED] Falha ao carregar dashboard", { pay: pay.error, out: out.error, mp: mp.error });
      setLoadFailed(true);
    }

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

    if (error) {
      console.error("[CHRISMED] Falha ao configurar Mercado Pago", error);
      toast.error("Não foi possível salvar a integração agora. Verifique as credenciais e tente novamente.");
      return;
    }

    setMpAccessToken("");
    setMpWebhookSecret("");
    toast.success("Configuração salva. Os segredos foram enviados ao cofre seguro e não ficam visíveis nesta tela.");
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Centro operacional</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071C18]">Gestão CHRISMED</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#3F4A47]">Agenda, comunicação, financeiro, pessoas e integrações em um único painel de gestão.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 lg:mt-0">
            <Button asChild variant="outline" className="border-[#0B2A24] bg-white text-[#071C18] hover:bg-[#E7EDEB]"><a href="/chrismed/alertas"><AlertTriangle className="mr-2 h-4 w-4" />Alertas</a></Button>
            <Button asChild variant="outline" className="border-[#0B2A24] bg-white text-[#071C18] hover:bg-[#E7EDEB]"><a href="/chrismed/setup"><Settings className="mr-2 h-4 w-4" />Configurações</a></Button>
            <Button type="button" onClick={() => void load()} disabled={loading} className="bg-[#071C18] text-white hover:bg-[#0B2A24]"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
          </div>
        </header>

        {loading && payments.length === 0 && outbox.length === 0 && (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-[#D9D3CB] bg-white text-sm font-medium text-[#3F4A47]" role="status" aria-live="polite">
            <Loader2 className="h-5 w-5 animate-spin text-[#071C18]" aria-hidden="true" /> Carregando dados operacionais…
          </div>
        )}

        {loadFailed && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert">
            <strong>Alguns dados não puderam ser atualizados agora.</strong> Os detalhes técnicos foram registrados para diagnóstico. Use “Atualizar” para tentar novamente.
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores operacionais">
          {[
            ["GMV aprovado", brl(gmv)],
            ["Pagamentos aprovados", String(approved.length)],
            ["PIX pendentes", String(pending)],
            ["Comunicação na fila", String(queued)],
          ].map(([label, value]) => (
            <Card key={label} className="border-[#D9D3CB] bg-white text-[#071C18]">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-[#596660]">{label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-[#071C18]">{value}</div>{label === "Comunicação na fila" && <div className="mt-1 text-xs text-[#596660]">{failed} com falha</div>}</CardContent>
            </Card>
          ))}
        </section>

        <Card className={`bg-white text-[#071C18] ${mpReady ? "border-emerald-300" : "border-amber-300"}`}>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#071C18]"><CreditCard className="h-5 w-5" /> Mercado Pago</CardTitle>
                <p className="mt-1 text-sm text-[#3F4A47]">Credenciais secretas são enviadas ao cofre seguro. A tela nunca volta a exibi-las.</p>
              </div>
              <Badge className={mpReady ? "border border-emerald-300 bg-emerald-50 text-emerald-900" : "border border-amber-300 bg-amber-50 text-amber-950"}>{mpReady ? "CONFIGURADO" : "PENDENTE"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [ShieldCheck, "Public Key", mpStatus?.public_key ? "Configurada" : "Não configurada"],
                [KeyRound, "Access Token", mpStatus?.has_access_token ? "Protegido no cofre" : "Não configurado"],
                [CheckCircle2, "Webhook Secret", mpStatus?.has_webhook_secret ? "Protegido no cofre" : "Não configurado"],
              ].map(([Icon, title, state]) => {
                const IconComponent = Icon as typeof ShieldCheck;
                return <div key={String(title)} className="rounded-xl border border-[#D9D3CB] bg-[#FDFCFB] p-3"><IconComponent className="mb-2 h-4 w-4 text-[#071C18]" /><strong className="text-sm text-[#071C18]">{String(title)}</strong><p className="mt-1 text-xs text-[#596660]">{String(state)}</p></div>;
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="mp-environment" className="text-[#071C18]">Ambiente</Label><select id="mp-environment" value={mpEnvironment} onChange={(event) => setMpEnvironment(event.target.value as "sandbox" | "production")} className="h-10 w-full rounded-md border border-[#D9D3CB] bg-white px-3 text-sm text-[#071C18]"><option value="production">Produção</option><option value="sandbox">Sandbox/Testes</option></select></div>
              <div className="space-y-2"><Label htmlFor="mp-public-key" className="text-[#071C18]">Public Key</Label><Input id="mp-public-key" value={mpPublicKey} onChange={(event) => setMpPublicKey(event.target.value)} autoComplete="off" className="border-[#D9D3CB] bg-white text-[#071C18]" placeholder="Public Key Mercado Pago" /></div>
              <div className="space-y-2"><Label htmlFor="mp-access-token" className="text-[#071C18]">Access Token</Label><Input id="mp-access-token" type="password" value={mpAccessToken} onChange={(event) => setMpAccessToken(event.target.value)} autoComplete="new-password" className="border-[#D9D3CB] bg-white text-[#071C18]" placeholder={mpStatus?.has_access_token ? "Digite somente para substituir" : "Access Token"} /></div>
              <div className="space-y-2"><Label htmlFor="mp-webhook-secret" className="text-[#071C18]">Segredo do webhook</Label><Input id="mp-webhook-secret" type="password" value={mpWebhookSecret} onChange={(event) => setMpWebhookSecret(event.target.value)} autoComplete="new-password" className="border-[#D9D3CB] bg-white text-[#071C18]" placeholder={mpStatus?.has_webhook_secret ? "Digite somente para substituir" : "Webhook Secret"} /></div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#596660]">Salvar substitui as credenciais do ambiente escolhido. Não compartilhe segredos em prints, e-mail ou chat.</p><Button type="button" onClick={() => void saveMercadoPago()} disabled={mpSaving} className="bg-[#071C18] text-white hover:bg-[#0B2A24]">{mpSaving ? "Salvando…" : "Salvar Mercado Pago"}</Button></div>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Áreas da gestão CHRISMED">
          {operationalGroups.map(({ title, icon: Icon, description, links }) => (
            <Card key={title} className="overflow-hidden border-[#D9D3CB] bg-white text-[#071C18]">
              <CardHeader className="pb-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#E7EDEB] p-2.5 text-[#071C18]"><Icon className="h-5 w-5" /></div><div><CardTitle className="text-lg text-[#071C18]">{title}</CardTitle><p className="mt-1 text-xs text-[#596660]">{description}</p></div></div></CardHeader>
              <CardContent className="grid gap-2">{links.map(([label, href]) => <Button key={`${title}-${href}-${label}`} asChild variant="ghost" className="h-10 justify-start px-3 font-normal text-[#071C18] hover:bg-[#E7EDEB]"><a href={href}>{label}</a></Button>)}</CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card className="border-[#D9D3CB] bg-white text-[#071C18]">
            <CardHeader><CardTitle className="text-lg text-[#071C18]">Pagamentos recentes</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {payments.length === 0 ? <p className="py-8 text-center text-sm text-[#596660]">Nenhum pagamento registrado para exibir.</p> : (
                <table className="w-full min-w-[560px] text-sm"><thead className="border-b border-[#D9D3CB] text-left text-[#596660]"><tr><th className="py-2 pr-3">Pagador</th><th className="py-2 pr-3">Valor</th><th className="py-2 pr-3">Método</th><th className="py-2">Status</th></tr></thead><tbody>{payments.slice(0, 12).map((payment) => <tr key={payment.id} className="border-b border-[#EEEAE4] last:border-0"><td className="py-3 pr-3"><div className="font-medium text-[#071C18]">{payment.payer_name || "Paciente"}</div><div className="text-xs text-[#596660]">{payment.payer_email || "—"}</div></td><td className="py-3 pr-3 text-[#071C18]">{brl(Number(payment.amount_cents || 0) / 100)}</td><td className="py-3 pr-3 text-[#3F4A47]">{payment.payment_method || "—"}</td><td className="py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClasses(payment.status)}`}>{friendlyStatus(payment.status)}</span></td></tr>)}</tbody></table>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#D9D3CB] bg-white text-[#071C18]">
            <CardHeader><CardTitle className="text-lg text-[#071C18]">Comunicações recentes</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              {outbox.length === 0 ? <p className="py-8 text-center text-sm text-[#596660]">Nenhuma comunicação registrada para exibir.</p> : (
                <table className="w-full min-w-[560px] text-sm"><thead className="border-b border-[#D9D3CB] text-left text-[#596660]"><tr><th className="py-2 pr-3">Evento</th><th className="py-2 pr-3">Canal</th><th className="py-2 pr-3">Destino</th><th className="py-2">Status</th></tr></thead><tbody>{outbox.slice(0, 12).map((item) => <tr key={item.id} className="border-b border-[#EEEAE4] last:border-0"><td className="py-3 pr-3 font-medium text-[#071C18]">{item.event_code}</td><td className="py-3 pr-3 text-[#3F4A47]">{item.channel}</td><td className="max-w-[180px] truncate py-3 pr-3 text-[#3F4A47]" title={item.recipient}>{item.recipient}</td><td className="py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusClasses(item.status)}`}>{friendlyStatus(item.status)}</span></td></tr>)}</tbody></table>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
