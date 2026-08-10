import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Check,
  Clock3,
  MapPin,
  MonitorSmartphone,
  Palmtree,
  ShieldCheck,
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

  useEffect(() => {
    void (async () => {
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
        navigate({ to: "/alth" });
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
    setSaving(true);
    const { error } = await client.rpc("complete_chrismed_professional_onboarding", {
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
      },
      p_schedules: schedules,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    sessionStorage.removeItem("chrismed-professional-signup");
    toast.success("Cadastro e agenda enviados para análise da gestão CHRISMED.");
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
                Defina sua disponibilidade, modalidades e locais. Você poderá alterar tudo depois no
                painel.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[#078f8b]" />
                Dias e horários
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
                      {active && <Check className="mr-1 h-4 w-4" />}
                      {label}
                    </Button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração da consulta</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={10}
                    max={480}
                    step={5}
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo (min)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={0}
                    max={120}
                    step={5}
                    value={interval}
                    onChange={(event) => setInterval(Number(event.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-[#078f8b]" />
                Modalidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["presencial", "Atendimento presencial"],
                ["teleconsulta", "Teleconsulta"],
                ["hibrido", "Atendimento híbrido"],
              ].map(([value, label]) => (
                <div
                  key={value}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <Label htmlFor={`mode-${value}`}>{label}</Label>
                  <Switch
                    id={`mode-${value}`}
                    checked={serviceModes.includes(value)}
                    onCheckedChange={() => toggleMode(value)}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Locais de atendimento
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
                <Palmtree className="h-5 w-5 text-[#078f8b]" />
                Férias e bloqueios iniciais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vacation-start">Início das férias</Label>
                  <Input
                    id="vacation-start"
                    type="date"
                    value={vacationStart}
                    onChange={(event) => setVacationStart(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacation-end">Fim das férias</Label>
                  <Input
                    id="vacation-end"
                    type="date"
                    min={vacationStart}
                    value={vacationEnd}
                    onChange={(event) => setVacationEnd(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-[#078f8b]" />
            Configuração privada e protegida por controle de acesso.
          </p>
          <Button
            size="lg"
            disabled={!profileReady || saving}
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
