import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BadgePercent,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  MonitorSmartphone,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

type Offer = {
  offer_id: string;
  offer_status: string;
  wave: number;
  sent_at: string;
  offer_expires_at: string;
  slot_id: string;
  origin: string;
  starts_at: string;
  ends_at: string;
  primary_area: string | null;
  slot_status: string;
  slot_expires_at: string;
  reason: string | null;
};

type PegaAgendaPolicy = {
  enabled: boolean;
  penalty_window_hours: number;
  cancellation_penalty_pct: number;
  replacement_bonus_pct: number;
  terms_version: string;
};

type PegaAgendaState = {
  professional_found: boolean;
  professional_id?: string;
  professional_name?: string;
  enabled: boolean;
  terms_version?: string | null;
  current_terms_version?: string | null;
  accepted_at?: string | null;
  revoked_at?: string | null;
  min_notice_minutes?: number;
  max_response_minutes?: number;
  wallet_pending_balance_cents?: number;
  policy?: PegaAgendaPolicy;
  offers: Offer[];
};

type ProfessionalAppointment = {
  appointment_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patient_name: string;
  service_name: string;
  modality: string;
  seconds_until_start: number;
};

type ProfessionalTimeline = {
  appointments: ProfessionalAppointment[];
  history: Array<{ event_type: string; appointment_id: string; created_at: string; payload: Record<string, unknown> }>;
  wallet: {
    pending_balance_cents?: number;
    unsettled_balance_cents?: number;
    last_entry_at?: string | null;
  };
};

export const Route = createFileRoute("/_authenticated/agenda/profissional")({
  component: AgendaProfissionalPage,
  head: () => ({ meta: [{ title: "CHRISMED — Agenda do profissional" }] }),
});

async function loadState(): Promise<PegaAgendaState> {
  const { data, error } = await supabase.rpc("chrismed_get_my_pega_agenda_state");
  if (error) throw error;
  return (data ?? { professional_found: false, enabled: false, offers: [] }) as PegaAgendaState;
}

async function loadTimeline(): Promise<ProfessionalTimeline> {
  const { data, error } = await supabase.rpc("chrismed_get_my_professional_timeline");
  if (error) throw error;
  return (data ?? { appointments: [], history: [], wallet: {} }) as ProfessionalTimeline;
}

function money(cents = 0) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function AgendaProfissionalPage() {
  const qc = useQueryClient();
  const [now, setNow] = useState(Date.now());
  const reminders = useRef(new Set<string>());
  const stateQuery = useQuery({ queryKey: ["chrismed-pega-agenda-state"], queryFn: loadState, refetchInterval: 15000 });
  const timelineQuery = useQuery({ queryKey: ["chrismed-professional-timeline"], queryFn: loadTimeline, refetchInterval: 15000 });
  const state = stateQuery.data;
  const timeline = timelineQuery.data;
  const policy = state?.policy;

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(Date.now()), 1000);
    const channel = supabase.channel("chrismed-professional-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "agenda_slot_offers" }, () => qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "chrismed_appointments" }, () => qc.invalidateQueries({ queryKey: ["chrismed-professional-timeline"] }))
      .subscribe();
    return () => {
      window.clearInterval(ticker);
      supabase.removeChannel(channel);
    };
  }, [qc]);

  useEffect(() => {
    for (const appointment of timeline?.appointments ?? []) {
      if (appointment.modality !== "telemedicina" && appointment.modality !== "teleconsulta") continue;
      if (!["held", "pending_payment", "confirmed"].includes(appointment.status)) continue;
      const delta = new Date(appointment.starts_at).getTime() - now;
      const minute = Math.ceil(delta / 60_000);
      if (minute <= 3 && minute >= 1) {
        const key = `${appointment.appointment_id}:${minute}`;
        if (!reminders.current.has(key)) {
          reminders.current.add(key);
          toast.warning(`Teleconsulta com ${appointment.patient_name} em ${minute} minuto${minute === 1 ? "" : "s"}. Entre na sala e confirme sua presença.`);
        }
      }
      if (delta <= 0 && delta > -60_000) {
        const key = `${appointment.appointment_id}:start`;
        if (!reminders.current.has(key)) {
          reminders.current.add(key);
          toast.error(`A teleconsulta com ${appointment.patient_name} começou. Entre na sala agora.`);
        }
      }
    }
  }, [timeline?.appointments, now]);

  const preference = useMutation({
    mutationFn: async (enabled: boolean) => {
      const termsVersion = policy?.terms_version ?? state?.current_terms_version;
      if (!termsVersion) throw new Error("Política atual do Pega Agenda indisponível.");
      const { error } = await supabase.rpc("chrismed_set_pega_agenda_preference", {
        p_enabled: enabled,
        p_terms_version: termsVersion,
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      toast.success(enabled ? "Pega Agenda ativado com sucesso." : "Participação no Pega Agenda desativada.");
      qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Não foi possível atualizar sua preferência."),
  });

  const claim = useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase.rpc("chrismed_claim_pega_agenda_offer", { p_offer_id: offerId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Horário assumido com sucesso. A consulta foi vinculada à sua agenda e o paciente será avisado.");
      qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] });
      qc.invalidateQueries({ queryKey: ["chrismed-professional-timeline"] });
    },
    onError: (e: { message?: string }) => {
      const message = e.message ?? "Não foi possível assumir o horário.";
      toast.error(message.includes("offer_not_available") ? "Esta oportunidade não está mais disponível." : message);
      qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] });
    },
  });

  const decline = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase.rpc("chrismed_decline_pega_agenda_offer", { p_offer_id: offerId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chrismed-pega-agenda-state"] }),
  });

  const upcoming = useMemo(
    () => (timeline?.appointments ?? []).filter((item) => new Date(item.ends_at).getTime() >= now - 5 * 60_000),
    [timeline?.appointments, now],
  );

  if (stateQuery.isLoading || timelineQuery.isLoading) return <div className="container mx-auto py-8">Carregando sua agenda CHRISMED…</div>;

  if (!state?.professional_found) {
    return <div className="container mx-auto py-8"><Card><CardContent className="py-10 text-center">Seu usuário ainda não está vinculado a um perfil profissional ativo da CHRISMED.</CardContent></Card></div>;
  }

  const walletBalance = timeline?.wallet?.unsettled_balance_cents ?? state.wallet_pending_balance_cents ?? 0;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#078f8b]">Portal do Profissional da Saúde</p>
        <h1 className="text-3xl font-bold tracking-tight">Sua agenda CHRISMED</h1>
        <p className="text-muted-foreground">Atendimentos, teleconsultas, carteira e oportunidades do Pega Agenda em um só lugar.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <CalendarClock className="mb-3 h-6 w-6 text-[#078f8b]" />
            <p className="text-sm text-muted-foreground">Próximos atendimentos</p>
            <p className="mt-1 text-3xl font-bold">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <WalletCards className="mb-3 h-6 w-6 text-[#078f8b]" />
            <p className="text-sm text-muted-foreground">Carteira a compensar</p>
            <p className={`mt-1 text-3xl font-bold ${walletBalance < 0 ? "text-red-700" : "text-emerald-700"}`}>{money(walletBalance)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Créditos e débitos são compensados no próximo repasse.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Bell className="mb-3 h-6 w-6 text-[#078f8b]" />
            <p className="text-sm text-muted-foreground">Pega Agenda</p>
            <p className="mt-1 text-3xl font-bold">{state.offers.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">oportunidade(s) disponível(is) agora.</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div><h2 className="text-xl font-semibold">Próximos atendimentos</h2><p className="text-sm text-muted-foreground">Teleconsultas liberam a sala para você 3 minutos antes do horário.</p></div>
        {upcoming.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum atendimento próximo.</CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcoming.map((appointment) => {
              const start = new Date(appointment.starts_at).getTime();
              const delta = start - now;
              const isTele = appointment.modality === "telemedicina" || appointment.modality === "teleconsulta";
              const canEnter = isTele && delta <= 3 * 60_000;
              return (
                <Card key={appointment.appointment_id} className={canEnter ? "border-[#078f8b]/40 shadow-sm" : ""}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{appointment.service_name}</p>
                        <h3 className="text-lg font-semibold">{appointment.patient_name}</h3>
                      </div>
                      <Badge variant="secondary">{appointment.modality}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /> {new Date(appointment.starts_at).toLocaleString("pt-BR")} → {new Date(appointment.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                    {isTele && (
                      <div className="rounded-xl bg-[#edf8f7] p-3 text-sm text-[#075c59]">
                        {delta > 3 * 60_000 ? `Sala disponível em ${Math.ceil((delta - 3 * 60_000) / 60_000)} min.` : delta > 0 ? "Sala liberada. Entre agora e aguarde o paciente." : "Consulta em andamento. Se ainda não entrou, acesse imediatamente."}
                      </div>
                    )}
                    {canEnter && (
                      <Link to="/chrismed/teleconsulta/$appointmentId" params={{ appointmentId: appointment.appointment_id }}>
                        <Button className="w-full"><MonitorSmartphone className="mr-2 h-4 w-4" /> Entrar na sala CHRISMED</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Participação no Pega Agenda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            O Pega Agenda oferece consultas liberadas a profissionais compatíveis. Com {policy?.penalty_window_hours ?? 48} horas ou mais de antecedência, não há multa nem bônus extra. Nas últimas {policy?.penalty_window_hours ?? 48} horas, cancelamento ou ausência do profissional gera débito de {policy?.cancellation_penalty_pct ?? 10}% e quem assumir recebe bônus de {policy?.replacement_bonus_pct ?? 5}%.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-3"><Clock className="mb-2 h-4 w-4 text-[#078f8b]" /><strong>{policy?.penalty_window_hours ?? 48}h</strong><p className="text-xs text-muted-foreground">janela de última hora</p></div>
            <div className="rounded-xl border p-3"><WalletCards className="mb-2 h-4 w-4 text-red-700" /><strong>{policy?.cancellation_penalty_pct ?? 10}%</strong><p className="text-xs text-muted-foreground">multa por cancelamento/ausência</p></div>
            <div className="rounded-xl border p-3"><BadgePercent className="mb-2 h-4 w-4 text-emerald-700" /><strong>{policy?.replacement_bonus_pct ?? 5}%</strong><p className="text-xs text-muted-foreground">bônus ao substituto de última hora</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={state.enabled ? "default" : "secondary"}>{state.enabled ? "ATIVO" : "INATIVO"}</Badge>
            {state.accepted_at && <span className="text-xs text-muted-foreground">Aceite: {new Date(state.accepted_at).toLocaleString("pt-BR")} · {state.terms_version}</span>}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => preference.mutate(true)} disabled={preference.isPending || state.enabled}>SIM, participar</Button>
            <Button variant="outline" onClick={() => preference.mutate(false)} disabled={preference.isPending || !state.enabled}>NÃO participar</Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div><h2 className="text-xl font-semibold">Oportunidades Pega Agenda</h2><p className="text-sm text-muted-foreground">Atualização automática e em tempo real.</p></div>
        {!state.enabled && <Card><CardContent className="py-8 text-center text-muted-foreground">Ative sua participação para receber oportunidades.</CardContent></Card>}
        {state.enabled && state.offers.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma oportunidade compatível disponível neste momento.</CardContent></Card>}
        {state.enabled && <div className="grid gap-4 md:grid-cols-2">{state.offers.map((offer) => {
          const late = new Date(offer.starts_at).getTime() - now < (policy?.penalty_window_hours ?? 48) * 60 * 60_000;
          return (
            <Card key={offer.offer_id} className="border-primary/30">
              <CardHeader className="pb-3"><CardTitle className="flex items-center justify-between text-lg"><span>{offer.primary_area ?? "Atendimento CHRISMED"}</span><Badge>{late ? `Última hora · +${policy?.replacement_bonus_pct ?? 5}%` : `Onda ${offer.wave}`}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>{new Date(offer.starts_at).toLocaleString("pt-BR")} → {new Date(offer.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                {offer.reason && <p className="text-sm text-muted-foreground">Motivo: {offer.reason}</p>}
                <p className="text-xs text-muted-foreground">Disponível até {new Date(offer.offer_expires_at).toLocaleString("pt-BR")}.</p>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => claim.mutate(offer.offer_id)} disabled={claim.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Assumir horário</Button>
                  <Button variant="outline" onClick={() => decline.mutate(offer.offer_id)} disabled={decline.isPending}><XCircle className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}</div>}
      </section>
    </div>
  );
}
