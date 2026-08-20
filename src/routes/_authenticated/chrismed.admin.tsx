import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, Building2, CalendarDays, CheckCircle2, Clock3, CreditCard,
  FileSpreadsheet, HeartPulse, KeyRound, Loader2, Mail, MessageCircle, RefreshCw,
  Send, Settings, ShieldCheck, Stethoscope, UserPlus, UserRound, Users, WalletCards,
  Workflow,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/chrismed/admin')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedAdmin,
  head: () => ({ meta: [{ title: 'Gestão CHRISMED — Centro de Comando' }] }),
});

type CommandCenter = {
  generated_at?: string;
  patients?: { total?: number; pending?: number };
  professionals?: { total?: number; pending_review?: number; approved_waiting_agenda?: number; active?: number };
  agenda?: { today?: number; next_7_days?: number; open_schedules?: number };
  companies?: { occupational_total?: number; requests_pending?: number };
  events?: { upcoming?: number; next_7_days?: number };
  communication?: {
    queued?: number;
    failed?: number;
    whatsapp?: { status?: string; provider?: string; address?: string; last_healthcheck_at?: string | null; last_error?: string | null };
    n8n?: { total?: number; active?: number; ready?: number };
  };
  operations?: { open_tasks?: number; critical_tasks?: number };
  payments?: { approved_count?: number; pending_count?: number; approved_amount_cents?: number };
};

type PayoutDashboard = {
  reference_month?: string;
  policy?: { pix_maturity_days?: number; card_maturity_days?: number; invoice_required?: boolean };
  summary?: {
    professionals?: number;
    ready_for_payout?: number;
    invoice_pending?: number;
    matured_amount_cents?: number;
    unmatured_amount_cents?: number;
    next_eligible_at?: string | null;
  };
};

type MpStatus = {
  configured: boolean;
  environment: 'sandbox' | 'production' | null;
  public_key: string | null;
  active?: boolean;
  has_access_token: boolean;
  has_webhook_secret: boolean;
};

function money(cents = 0) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents || 0) / 100);
}

function remaining(target: string | null | undefined, now: number) {
  if (!target) return 'Sem recebível em contagem';
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return 'LIBERADO';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function metric(value: number | undefined) { return Number(value || 0); }

function QuickAction({ href, icon: Icon, title, description }: { href: string; icon: any; title: string; description: string }) {
  return <a href={href} className="group rounded-2xl border border-[#d9e1df] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0b7a75] hover:shadow-md"><Icon className="h-5 w-5 text-[#087f79]"/><strong className="mt-3 block text-sm">{title}</strong><p className="mt-1 text-xs leading-relaxed text-[#61706d]">{description}</p></a>;
}

function AlertItem({ active, title, detail, href }: { active: boolean; title: string; detail: string; href: string }) {
  if (!active) return null;
  return <a href={href} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 transition hover:border-amber-400"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><div><strong>{title}</strong><p className="mt-0.5 text-xs opacity-80">{detail}</p></div></a>;
}

function ChrismedAdmin() {
  const [cc, setCc] = useState<CommandCenter | null>(null);
  const [payout, setPayout] = useState<PayoutDashboard | null>(null);
  const [mpStatus, setMpStatus] = useState<MpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [mpSaving, setMpSaving] = useState(false);
  const [mpEnvironment, setMpEnvironment] = useState<'sandbox' | 'production'>('production');
  const [mpPublicKey, setMpPublicKey] = useState('');
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpWebhookSecret, setMpWebhookSecret] = useState('');

  async function load() {
    setLoading(true);
    setLoadFailed(false);
    const [command, finance, mp] = await Promise.all([
      (supabase as any).rpc('chrismed_get_management_command_center', {}),
      (supabase as any).rpc('chrismed_get_management_payout_dashboard', { p_reference_month: null }),
      supabase.rpc('chrismed_get_mercado_pago_status'),
    ]);
    if (command.error || finance.error || mp.error) setLoadFailed(true);
    if (!command.error) setCc((command.data ?? {}) as CommandCenter);
    if (!finance.error) setPayout((finance.data ?? {}) as PayoutDashboard);
    if (!mp.error && mp.data) {
      const s = mp.data as unknown as MpStatus;
      setMpStatus(s);
      if (s.environment) setMpEnvironment(s.environment);
      if (s.public_key) setMpPublicKey(s.public_key);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const refresh = window.setInterval(() => void load(), 30000);
    const ticker = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.clearInterval(refresh); window.clearInterval(ticker); };
  }, []);

  async function saveMercadoPago() {
    if (mpPublicKey.trim().length < 10) return toast.error('Informe a Public Key do Mercado Pago.');
    if (mpAccessToken.trim().length < 20) return toast.error('Informe um Access Token válido.');
    if (mpWebhookSecret.trim().length < 16) return toast.error('Informe o segredo de assinatura do webhook.');
    setMpSaving(true);
    const { error } = await supabase.rpc('chrismed_configure_mercado_pago', {
      p_environment: mpEnvironment,
      p_public_key: mpPublicKey.trim(),
      p_access_token: mpAccessToken.trim(),
      p_webhook_secret: mpWebhookSecret.trim(),
    });
    setMpSaving(false);
    if (error) return toast.error('Não foi possível salvar a integração.');
    setMpAccessToken(''); setMpWebhookSecret('');
    toast.success('Mercado Pago atualizado no cofre seguro.');
    await load();
  }

  const wa = cc?.communication?.whatsapp;
  const n8n = cc?.communication?.n8n;
  const payoutSummary = payout?.summary;
  const mpReady = Boolean(mpStatus?.configured && mpStatus.has_access_token && mpStatus.has_webhook_secret);
  const attentionCount =
    metric(cc?.professionals?.pending_review) + metric(cc?.professionals?.approved_waiting_agenda) +
    metric(cc?.companies?.requests_pending) + metric(cc?.communication?.failed) +
    metric(cc?.operations?.critical_tasks) + metric(payoutSummary?.invoice_pending) +
    (String(wa?.status || '').toUpperCase() === 'CONNECTED' ? 0 : 1);

  return <main className="min-h-screen bg-[#f5f7f6] px-4 py-6 text-[#102b29] sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="rounded-3xl border border-[#dbe3e1] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#637471]">Centro de comando</p><h1 className="mt-2 text-3xl font-bold">Gestão CHRISMED</h1><p className="mt-2 max-w-3xl text-sm text-[#596966]">Tudo que exige ação, comunicação, agenda, aprovação e financeiro em uma única visão. Atualização automática a cada 30 segundos.</p></div>
          <div className="flex flex-wrap gap-2"><Button asChild><a href="/chrismed/convites"><Send className="mr-2 h-4 w-4"/>Enviar convite</a></Button><Button asChild variant="outline"><a href="/chrismed/whatsapp"><MessageCircle className="mr-2 h-4 w-4"/>WhatsApp</a></Button><Button onClick={() => void load()} disabled={loading} variant="outline"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>Atualizar</Button></div>
        </div>
      </header>

      {loading && !cc ? <div className="flex min-h-28 items-center justify-center gap-2 rounded-2xl border bg-white text-sm"><Loader2 className="h-5 w-5 animate-spin"/>Carregando operação CHRISMED…</div> : null}
      {loadFailed ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Atualização parcial.</strong> Um ou mais módulos não responderam nesta leitura. O painel continuará tentando automaticamente.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Card><CardContent className="p-5"><UserRound className="h-5 w-5 text-[#087f79]"/><p className="mt-3 text-xs text-muted-foreground">Pacientes</p><p className="text-2xl font-bold">{metric(cc?.patients?.total)}</p><p className="text-xs text-amber-700">{metric(cc?.patients?.pending)} pendentes</p></CardContent></Card>
        <Card><CardContent className="p-5"><Stethoscope className="h-5 w-5 text-[#087f79]"/><p className="mt-3 text-xs text-muted-foreground">Profissionais ativos</p><p className="text-2xl font-bold">{metric(cc?.professionals?.active)}</p><p className="text-xs text-amber-700">{metric(cc?.professionals?.pending_review)} em análise</p></CardContent></Card>
        <Card><CardContent className="p-5"><CalendarDays className="h-5 w-5 text-[#087f79]"/><p className="mt-3 text-xs text-muted-foreground">Agenda hoje</p><p className="text-2xl font-bold">{metric(cc?.agenda?.today)}</p><p className="text-xs text-muted-foreground">{metric(cc?.agenda?.next_7_days)} nos próximos 7 dias</p></CardContent></Card>
        <Card><CardContent className="p-5"><Building2 className="h-5 w-5 text-[#087f79]"/><p className="mt-3 text-xs text-muted-foreground">Empresas ocupacionais</p><p className="text-2xl font-bold">{metric(cc?.companies?.occupational_total)}</p><p className="text-xs text-amber-700">{metric(cc?.companies?.requests_pending)} solicitações</p></CardContent></Card>
        <Card><CardContent className="p-5"><CreditCard className="h-5 w-5 text-[#087f79]"/><p className="mt-3 text-xs text-muted-foreground">Recebimentos aprovados</p><p className="text-xl font-bold">{money(cc?.payments?.approved_amount_cents)}</p><p className="text-xs text-amber-700">{metric(cc?.payments?.pending_count)} pagamentos pendentes</p></CardContent></Card>
        <Card className={attentionCount ? 'border-amber-300' : 'border-emerald-300'}><CardContent className="p-5">{attentionCount ? <AlertTriangle className="h-5 w-5 text-amber-600"/> : <CheckCircle2 className="h-5 w-5 text-emerald-600"/>}<p className="mt-3 text-xs text-muted-foreground">Ação necessária</p><p className="text-2xl font-bold">{attentionCount}</p><p className="text-xs text-muted-foreground">itens que pedem atenção</p></CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="border-[#dbe3e1]"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600"/>Ação necessária</CardTitle></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">
          <AlertItem active={metric(cc?.professionals?.pending_review)>0} title={`${metric(cc?.professionals?.pending_review)} profissional(is) aguardando Comitê`} detail="Analisar cadastro, documentos e liberar somente após aprovação." href="/chrismed/time"/>
          <AlertItem active={metric(cc?.professionals?.approved_waiting_agenda)>0} title={`${metric(cc?.professionals?.approved_waiting_agenda)} aprovado(s) sem ativação pública`} detail="Aguardando consultório, serviços e horários para abrir agenda." href="/chrismed/time"/>
          <AlertItem active={metric(cc?.companies?.requests_pending)>0} title={`${metric(cc?.companies?.requests_pending)} empresa(s) aguardando análise`} detail="Solicitações de acesso à medicina ocupacional." href="/chrismed/ocupacional-gestao"/>
          <AlertItem active={metric(cc?.communication?.failed)>0} title={`${metric(cc?.communication?.failed)} comunicação(ões) com falha`} detail="Revisar fila e corrigir entrega antes de novos disparos." href="/chrismed/alertas"/>
          {metric(n8n?.total)>0 ? <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950"><Workflow className="mt-0.5 h-4 w-4 shrink-0"/><div><strong>Automação CHRISMED operacional</strong><p className="mt-0.5 text-xs opacity-80">Worker transacional homologado ativo; {metric(n8n?.ready)} fluxos permanecem como catálogo preparado e só são publicados individualmente quando houver evento e efeito de negócio homologados.</p></div></div> : null}
          <AlertItem active={String(wa?.status || '').toUpperCase() !== 'CONNECTED'} title="WhatsApp oficial ainda não conectado" detail={`Estado: ${wa?.status || 'não informado'} · ${wa?.address || '+55 21 97253-7868'}`} href="/chrismed/whatsapp"/>
          <AlertItem active={metric(cc?.operations?.critical_tasks)>0} title={`${metric(cc?.operations?.critical_tasks)} tarefa(s) operacional(is) crítica(s)`} detail="Prioridade alta na operação CHRISMED." href="/chrismed/alertas"/>
          <AlertItem active={metric(payoutSummary?.invoice_pending)>0} title={`${metric(payoutSummary?.invoice_pending)} profissional(is) com NF pendente`} detail="NF é condição para preparação de repasse." href="/finance"/>
          {attentionCount===0 ? <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="h-5 w-5"/><strong>Nenhuma ação crítica nesta leitura.</strong></div> : null}
        </CardContent></Card>

        <Card className="border-[#dbe3e1]"><CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-[#087f79]"/>Financeiro · próximos repasses</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Maduros</p><strong className="text-lg">{money(payoutSummary?.matured_amount_cents)}</strong></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">A maturar</p><strong className="text-lg">{money(payoutSummary?.unmatured_amount_cents)}</strong></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Prontos para pagar</p><strong className="text-lg">{metric(payoutSummary?.ready_for_payout)}</strong></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">NF pendente</p><strong className="text-lg">{metric(payoutSummary?.invoice_pending)}</strong></div></div>
          <div className="rounded-2xl bg-[#0e3431] p-4 text-white"><p className="text-xs uppercase tracking-[.16em] text-white/60">Próxima maturidade</p><p className="mt-2 font-mono text-xl font-bold">{remaining(payoutSummary?.next_eligible_at, now)}</p>{payoutSummary?.next_eligible_at ? <p className="mt-1 text-xs text-white/60">{new Date(payoutSummary.next_eligible_at).toLocaleString('pt-BR')}</p> : null}</div>
          <div className="flex items-center justify-between rounded-xl bg-[#eef6f5] p-3 text-xs"><span>PIX D{payout?.policy?.pix_maturity_days ?? 7}</span><span>Cartão D{payout?.policy?.card_maturity_days ?? 37}</span><span>NF obrigatória</span></div>
          <Button asChild variant="outline" className="w-full"><a href="/finance"><WalletCards className="mr-2 h-4 w-4"/>Abrir financeiro</a></Button>
        </CardContent></Card>
      </section>

      <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-bold">Criar e operar</h2><p className="text-xs text-muted-foreground">Ações mais usadas pela Gestão CHRISMED.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <QuickAction href="/chrismed/convites" icon={UserPlus} title="Novo convite" description="Profissional, empresa ou paciente."/>
        <QuickAction href="/chrismed/pacientes-gestao" icon={UserRound} title="Pacientes" description="Cadastro, aprovação e acesso à jornada clínica."/>
        <QuickAction href="/chrismed/time" icon={Stethoscope} title="Profissionais" description="Comitê, aprovação, suspensão e ativação."/>
        <QuickAction href="/agenda/appointments" icon={CalendarDays} title="Agenda" description="Consultas, horários e operação diária."/>
        <QuickAction href="/chrismed/ocupacional-gestao" icon={HeartPulse} title="Medicina ocupacional" description="Empresas, trabalhadores, ASO, PCMSO e eSocial."/>
        <QuickAction href="/chrismed/eventos-gestao" icon={Activity} title="Eventos" description="Convites, inscrições, QR e check-in."/>
        <QuickAction href="/ehr" icon={ShieldCheck} title="Prontuário" description="Dados clínicos com acesso restrito."/>
        <QuickAction href="/admin/comunicacoes/email-massa" icon={FileSpreadsheet} title="Importar e disparar" description="Planilhas, contatos e e-mail em massa."/>
        <QuickAction href="/chrismed/whatsapp" icon={MessageCircle} title="WhatsApp" description="QR Code, conexão e estado do canal."/>
        <QuickAction href="/crm/board" icon={Users} title="CRM e jornadas" description="Funis, relacionamento e próximas ações."/>
        <QuickAction href="/chrismed/alertas" icon={Workflow} title="Automações" description="Falhas, n8n e alertas operacionais."/>
        <QuickAction href="/finance" icon={CreditCard} title="Financeiro" description="Pagamentos, repasses e pendências."/>
        <QuickAction href="/chrismed/setup" icon={Settings} title="Configurações" description="Integrações e parâmetros CHRISMED."/>
      </div></section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5"/>Comunicação e jornadas</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Fila</p><strong>{metric(cc?.communication?.queued)}</strong></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Falhas</p><strong>{metric(cc?.communication?.failed)}</strong></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Automação</p><strong>{metric(n8n?.active)>0 ? "Worker ativo" : "Atenção"}</strong></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">WhatsApp</p><strong className="text-xs">{wa?.status || '—'}</strong></div></div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><a href="/chrismed/convites"><Send className="mr-2 h-4 w-4"/>Convites</a></Button><Button asChild variant="outline"><a href="/admin/comunicacoes/email-massa"><Mail className="mr-2 h-4 w-4"/>E-mail em massa</a></Button><Button asChild variant="outline"><a href="/chrismed/whatsapp"><MessageCircle className="mr-2 h-4 w-4"/>WhatsApp</a></Button></div>
        </CardContent></Card>

        <Card className={mpReady ? 'border-emerald-300' : 'border-amber-300'}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5"/>Mercado Pago</CardTitle><p className="mt-1 text-sm text-muted-foreground">Credenciais protegidas no backend; segredo nunca retorna ao navegador.</p></div><Badge variant={mpReady ? 'default' : 'secondary'}>{mpReady ? 'Configurado' : 'Pendente'}</Badge></div></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2"><div><Label>Ambiente</Label><select value={mpEnvironment} onChange={(e) => setMpEnvironment(e.target.value as 'sandbox'|'production')} className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="production">Produção</option><option value="sandbox">Sandbox</option></select></div><div><Label>Public Key</Label><Input value={mpPublicKey} onChange={(e) => setMpPublicKey(e.target.value)} autoComplete="off" /></div><div><Label>Access Token</Label><Input type="password" value={mpAccessToken} onChange={(e) => setMpAccessToken(e.target.value)} autoComplete="new-password" placeholder={mpStatus?.has_access_token ? 'Token já armazenado · informe somente para substituir' : 'APP_USR-…'} /></div><div><Label>Webhook secret</Label><Input type="password" value={mpWebhookSecret} onChange={(e) => setMpWebhookSecret(e.target.value)} autoComplete="new-password" placeholder={mpStatus?.has_webhook_secret ? 'Segredo já armazenado · informe somente para substituir' : 'Segredo de assinatura'} /></div></div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f7f6] p-3 text-xs"><span className="flex items-center gap-1"><KeyRound className="h-4 w-4"/>Token: {mpStatus?.has_access_token ? 'armazenado' : 'pendente'}</span><span>Webhook: {mpStatus?.has_webhook_secret ? 'armazenado' : 'pendente'}</span><span>Ambiente: {mpStatus?.environment || '—'}</span></div>
          <Button onClick={() => void saveMercadoPago()} disabled={mpSaving}>{mpSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}{mpSaving ? 'Salvando…' : 'Salvar no cofre seguro'}</Button>
        </CardContent></Card>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-xs text-muted-foreground"><span>Última leitura: {cc?.generated_at ? new Date(cc.generated_at).toLocaleString('pt-BR') : '—'}</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5"/>Horário de Brasília</span></footer>
    </div>
  </main>;
}
