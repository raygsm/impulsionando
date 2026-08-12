import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CalendarCheck2,
  Check,
  Clock3,
  Info,
  MapPin,
  MonitorSmartphone,
  Palmtree,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/chrismed/profissional/onboarding")({
  head: () => ({
    meta: [
      { title: "Configurar agenda — Portal do Profissional da Saúde | CHRISMED" },
      {
        name: "description",
        content: "Configure sua disponibilidade e conclua seu perfil profissional CHRISMED.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProfessionalOnboardingPage,
});

const WEEKDAYS = [
  [1, "Segunda"],
  [2, "Terça"],
  [3, "Quarta"],
  [4, "Quinta"],
  [5, "Sexta"],
  [6, "Sábado"],
  [0, "Domingo"],
] as const;

type PegaAgendaPolicy = {
  enabled: boolean;
  penalty_window_hours: number;
  cancellation_penalty_pct: number;
  replacement_bonus_pct: number;
  terms_version: string;
};

type RpcClient = {
  rpc: (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => { maybeSingle: () => Promise<{ data: { id: string } | null; error: unknown }> };
    };
  };
};

const FALLBACK_POLICY: PegaAgendaPolicy = {
  enabled: true,
  penalty_window_hours: 48,
  cancellation_penalty_pct: 10,
  replacement_bonus_pct: 5,
  terms_version: "pega-agenda-v2-2026-08-12",
};

function ProfessionalOnboardingPage() {
  const navigate = useNavigate();
  const client = supabase as unknown as RpcClient;
  const [profileReady, setProfileReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [duration, setDuration] = useState(30);
  const [interval, setInterval] = useState(10);
  const [serviceModes, setServiceModes] = useState<string[]>(["presencial"]);
  const [locations, setLocations] = useState("");
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");
  const [pegaAgendaChoice, setPegaAgendaChoice] = useState<boolean | null>(null);
  const [policy, setPolicy] = useState<PegaAgendaPolicy>(FALLBACK_POLICY);

  useEffect(() => {
    void (async () => {
      const policyResult = await client.rpc("chrismed_get_pega_agenda_policy", {});
      if (!policyResult.error && policyResult.data) {
        setPolicy(policyResult.data as PegaAgendaPolicy);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const existing = await client
        .from("agenda_professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      const raw = sessionStorage.getItem("chrismed-professional-signup");
      if (!raw) {
        if (existing.data?.id) {
          setProfileReady(true);
          return;
        }
        toast.error("Complete seus dados profissionais antes de configurar a agenda.");
        navigate({ to: "/auth?mode=signup" as never });
        return;
      }
      const registration = JSON.parse(raw) as Record<string, unknown>;
      const { error } = existing.data?.id
        ? { error: null }
        : await client.rpc("ensure_chrismed_professional_profile", {
            p_registration: registration,
          });
      if (error) {
        toast.error("Não foi possível preparar seu perfil profissional.");
        return;
      }
      const otherSpecialty =
        typeof registration.otherSpecialty === "string" ? registration.otherSpecialty.trim() : "";
      if (
        otherSpecialty &&
        sessionStorage.getItem("chrismed-specialty-request-sent") !== otherSpecialty
      ) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const response = session
          ? await fetch("/api/chrismed/specialty-request", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                requestedName: otherSpecialty,
                details: registration.otherSpecialtyDetails,
              }),
            })
          : null;
        if (response?.ok) {
          sessionStorage.setItem("chrismed-specialty-request-sent", otherSpecialty);
          toast.success("Especialidade enviada para avaliação da gestão CHRISMED.");
        } else {
          toast.warning(
            "Seu perfil foi criado, mas a solicitação de especialidade ainda não foi enviada.",
          );
        }
      }
      setProfileReady(true);
    })();
  }, [client, navigate]);

  const schedules = useMemo(
    () => days.map((weekday) => ({ weekday, startTime, endTime })),
    [days, startTime, endTime],
  );

  function toggleMode(mode: string) {
    setServiceModes((current) =>
      current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode],
    );
  }

  async function complete() {
    if (!days.length) return toast.error("Selecione pelo menos um dia de atendimento.");
    if (startTime >= endTime) return toast.error("O horário final deve ser posterior ao inicial.");
    if (!serviceModes.length)
      return toast.error("Selecione pelo menos uma modalidade de atendimento.");
    if (policy.enabled && pegaAgendaChoice === null)
      return toast.error("Escolha SIM ou NÃO para sua participação no Pega Agenda.");

    setSaving(true);
    const onboarding = await client.rpc("complete_chrismed_professional_onboarding", {
      p_config: {
        durationMinutes: duration,
        intervalMinutes: interval,
        serviceModes,
        locations: locations
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        vacations:
          vacationStart && vacationEnd ? [{ startsOn: vacationStart, endsOn: vacationEnd }] : [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pegaAgendaChoice,
        pegaAgendaTermsVersion: policy.terms_version,
      },
      p_schedules: schedules,
    });

    if (!onboarding.error && policy.enabled && pegaAgendaChoice !== null) {
      const preference = await client.rpc("chrismed_set_pega_agenda_preference", {
        p_enabled: pegaAgendaChoice,
        p_terms_version: policy.terms_version,
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (preference.error) {
        setSaving(false);
        return toast.error("Sua agenda foi salva, mas não foi possível registrar sua escolha do Pega Agenda.");
      }
    }

    setSaving(false);
    if (onboarding.error) return toast.error(onboarding.error.message);
    sessionStorage.removeItem("chrismed-professional-signup");
    toast.success("Cadastro, agenda e preferências enviados para análise da gestão CHRISMED.");
    navigate({ to: "/agenda/profissional" });
  }

  return (
    <div className="min-h-screen bg-[#f3f8f8] py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6">
        <header className="rounded-2xl bg-gradient-to-r from-[#057c79] to-[#09a19c] p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
              <CalendarCheck2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-white/75">
                Portal do Profissional da Saúde
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Configure sua agenda CHRISMED</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                Defina sua disponibilidade, modalidades e locais. Você poderá alterar tudo depois no painel.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[#078f8b]" /> Dias e horários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WEEKDAYS.map(([value, label]) => {
                  const active = days.includes(value);
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className={active ? "bg-[#078f8b] hover:bg-[#067b78]" : ""}
                      onClick={() =>
                        setDays((current) =>
                          active ? current.filter((day) => day !== value) : [...current, value],
                        )
                      }
                    >
                      {active && <Check className="mr-1 h-4 w-4" />} {label}
                    </Button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Início</Label>
                  <Input id="start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Fim</Label>
                  <Input id="end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração da consulta</Label>
                  <Input id="duration" type="number" min={10} max={480} step={5} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo (min)</Label>
                  <Input id="interval" type="number" min={0} max={120} step={5} value={interval} onChange={(event) => setInterval(Number(event.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-[#078f8b]" /> Modalidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["presencial", "Atendimento presencial"],
                ["teleconsulta", "Teleconsulta"],
                ["hibrido", "Atendimento híbrido"],
              ].map(([value, label]) => (
                <div key={value} className="flex items-center justify-between rounded-xl border p-4">
                  <Label htmlFor={`mode-${value}`}>{label}</Label>
                  <Switch id={`mode-${value}`} checked={serviceModes.includes(value)} onCheckedChange={() => toggleMode(value)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Locais de atendimento
                </Label>
                <textarea
                  id="locations"
                  value={locations}
                  onChange={(event) => setLocations(event.target.value)}
                  placeholder="Informe um endereço por linha"
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palmtree className="h-5 w-5 text-[#078f8b]" /> Férias e bloqueios iniciais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vacation-start">Início das férias</Label>
                  <Input id="vacation-start" type="date" value={vacationStart} onChange={(event) => setVacationStart(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacation-end">Fim das férias</Label>
                  <Input id="vacation-end" type="date" min={vacationStart} value={vacationEnd} onChange={(event) => setVacationEnd(event.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {policy.enabled && (
            <Card className="border-[#078f8b]/25 bg-gradient-to-br from-white to-[#eef8f7] shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#075c59]">
                  <BadgePercent className="h-5 w-5" /> Pega Agenda — escolha obrigatória
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-[#078f8b]/20 bg-white p-4 text-sm leading-relaxed text-slate-700">
                  <p className="font-semibold text-slate-900">O que é o Pega Agenda?</p>
                  <p className="mt-1">
                    Quando uma consulta já marcada fica disponível, profissionais compatíveis que escolheram participar podem receber a oportunidade. O primeiro aceite válido assume aquele atendimento e passa a ser o profissional responsável pela consulta.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border bg-white p-4">
                    <Clock3 className="mb-2 h-5 w-5 text-[#078f8b]" />
                    <strong className="block">Até {policy.penalty_window_hours}h antes</strong>
                    <span className="mt-1 block text-sm text-muted-foreground">O profissional pode cancelar sem multa. Quem assumir recebe a oportunidade do atendimento, sem bônus financeiro adicional.</span>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <WalletCards className="mb-2 h-5 w-5 text-amber-700" />
                    <strong className="block">Nas últimas {policy.penalty_window_hours}h</strong>
                    <span className="mt-1 block text-sm text-muted-foreground">Cancelamento ou ausência do profissional gera débito de {policy.cancellation_penalty_pct}% do valor da consulta em sua carteira CHRISMED.</span>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <BadgePercent className="mb-2 h-5 w-5 text-emerald-700" />
                    <strong className="block">Substituição de última hora</strong>
                    <span className="mt-1 block text-sm text-muted-foreground">O profissional que assumir uma consulta dentro dessa janela recebe bônus de {policy.replacement_bonus_pct}% sobre o valor do atendimento.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Débitos e créditos ficam registrados na carteira virtual do profissional e são compensados no próximo repasse. Os percentuais e a janela são políticas administráveis pela gestão CHRISMED e podem mudar em versões futuras dos termos.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPegaAgendaChoice(true)}
                    className={`rounded-2xl border-2 p-5 text-left transition ${pegaAgendaChoice === true ? "border-[#078f8b] bg-[#e8f7f5] shadow-sm" : "border-slate-200 bg-white hover:border-[#078f8b]/50"}`}
                  >
                    <span className="text-lg font-bold text-[#075c59]">SIM, quero participar</span>
                    <span className="mt-1 block text-sm text-slate-600">Aceito receber oportunidades compatíveis e concordo com as regras vigentes do Pega Agenda.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPegaAgendaChoice(false)}
                    className={`rounded-2xl border-2 p-5 text-left transition ${pegaAgendaChoice === false ? "border-slate-700 bg-slate-100 shadow-sm" : "border-slate-200 bg-white hover:border-slate-400"}`}
                  >
                    <span className="text-lg font-bold text-slate-800">NÃO quero participar</span>
                    <span className="mt-1 block text-sm text-slate-600">Minha agenda continua funcionando normalmente e posso ativar o recurso depois no dashboard.</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Versão dos termos: {policy.terms_version}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-[#078f8b]" /> Configuração privada e protegida por controle de acesso.
          </p>
          <Button
            size="lg"
            disabled={!profileReady || saving || (policy.enabled && pegaAgendaChoice === null)}
            onClick={complete}
            className="w-full bg-[#078f8b] hover:bg-[#067b78] sm:w-auto"
          >
            {saving ? "Salvando…" : "Concluir e acessar o dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
