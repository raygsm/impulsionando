import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChrismedShell } from "@/components/chrismed/ChrismedShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Receipt, UserRound, Video, MapPin, Home, ArrowRight, Clock3, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/chrismed/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha área — CHRISMED" },
      { name: "description", content: "Suas consultas, pagamentos e dados cadastrais CHRISMED." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MinhaContaPage,
});

type PatientAppointment = {
  appointment_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  professional_id: string;
  professional_name: string;
  modality: string;
  service_name: string;
  seconds_until_start: number;
  replacement_decision?: {
    id: string;
    decision: string;
    expires_at: string;
    proposed_professional_id: string;
  } | null;
};

type Payment = {
  id: string;
  payment_method: string;
  status: string;
  amount_cents: number;
  description: string | null;
  approved_at: string | null;
  created_at: string;
};

type PatientDashboard = {
  appointments: PatientAppointment[];
  payments: Payment[];
  profile: { user_id: string; email: string; display_name: string };
};

const MOD_ICON = { presencial: MapPin, telemedicina: Video, teleconsulta: Video, domiciliar: Home } as const;

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function MinhaContaPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [busyDecision, setBusyDecision] = useState<string | null>(null);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      navigate({ to: "/auth?mode=signin" as never });
      return;
    }
    const { data: dashboard, error } = await supabase.rpc("chrismed_get_my_patient_dashboard");
    if (error) {
      toast.error("Não foi possível carregar sua área CHRISMED.");
      setLoading(false);
      return;
    }
    setData(dashboard as unknown as PatientDashboard);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setInterval(() => void load(), 15000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, []);

  const upcoming = useMemo(
    () => (data?.appointments ?? []).filter((a) => new Date(a.ends_at).getTime() >= now - 5 * 60_000),
    [data?.appointments, now],
  );

  async function decideReplacement(decisionId: string, accept: boolean) {
    setBusyDecision(decisionId);
    const { error } = await supabase.rpc("chrismed_patient_decide_replacement", {
      p_decision_id: decisionId,
      p_accept: accept,
    });
    setBusyDecision(null);
    if (error) return toast.error(error.message);
    toast.success(accept ? "Profissional substituto confirmado." : "Entendido. Vamos procurar outro profissional disponível.");
    await load();
  }

  if (loading) {
    return <ChrismedShell><div className="container max-w-5xl py-20 text-center">Carregando sua área CHRISMED…</div></ChrismedShell>;
  }

  return (
    <ChrismedShell>
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container max-w-5xl py-12">
          <Badge className="mb-4 border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-ink)]">Minha área</Badge>
          <h1 className="chrismed-serif text-4xl leading-[1.05] text-[var(--chrismed-ink)] md:text-5xl">Olá, {data?.profile?.display_name ?? "paciente"}</h1>
          <p className="mt-4 max-w-2xl text-[var(--chrismed-graphite)]">Acompanhe consultas, teleconsultas, substituições e pagamentos diretamente no ecossistema CHRISMED.</p>
        </div>
      </section>

      <section className="container max-w-5xl py-10">
        <Tabs defaultValue="agendamentos">
          <TabsList className="border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]">
            <TabsTrigger value="agendamentos" className="gap-1.5"><CalendarCheck className="h-4 w-4" />Agendamentos</TabsTrigger>
            <TabsTrigger value="pagamentos" className="gap-1.5"><Receipt className="h-4 w-4" />Pagamentos</TabsTrigger>
            <TabsTrigger value="dados" className="gap-1.5"><UserRound className="h-4 w-4" />Meus dados</TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="mt-6 space-y-4">
            {upcoming.length === 0 ? (
              <EmptyState title="Nenhum agendamento próximo" cta />
            ) : upcoming.map((a) => {
              const Icon = MOD_ICON[a.modality as keyof typeof MOD_ICON] ?? MapPin;
              const start = new Date(a.starts_at).getTime();
              const delta = start - now;
              const isTele = a.modality === "telemedicina" || a.modality === "teleconsulta";
              const patientCanEnter = isTele && delta <= 0 && new Date(a.ends_at).getTime() > now;
              return (
                <article key={a.appointment_id} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-[var(--chrismed-graphite)]"><Icon className="h-3.5 w-3.5" /> {a.modality} · {a.service_name}</div>
                      <h3 className="mt-1 chrismed-serif text-xl text-[var(--chrismed-ink)]">{new Date(a.starts_at).toLocaleString("pt-BR")}</h3>
                      <p className="text-sm text-[var(--chrismed-graphite)]">{a.professional_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={a.status} />
                      {isTele && delta > 0 && <span className="inline-flex items-center gap-1 text-xs text-[var(--chrismed-graphite)]"><Clock3 className="h-3.5 w-3.5" /> Sala abre no horário</span>}
                      {patientCanEnter && (
                        <Link to="/chrismed/teleconsulta/$appointmentId" params={{ appointmentId: a.appointment_id }}>
                          <Button size="sm" className="gap-1.5 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]"><Video className="h-4 w-4" /> Entrar na teleconsulta</Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {a.replacement_decision?.decision === "pending" && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
                        <div className="flex-1">
                          <p className="font-semibold text-amber-950">Foi disponibilizado outro profissional para manter seu atendimento.</p>
                          <p className="mt-1 text-sm text-amber-900/75">Você pode aceitar este profissional ou pedir que a CHRISMED procure outra opção disponível.</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => void decideReplacement(a.replacement_decision!.id, true)} disabled={busyDecision === a.replacement_decision.id}>Aceitar profissional</Button>
                            <Button size="sm" variant="outline" onClick={() => void decideReplacement(a.replacement_decision!.id, false)} disabled={busyDecision === a.replacement_decision.id}>Quero outro profissional</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            <div className="pt-2">
              <Link to="/chrismed/agendar"><Button className="gap-1.5 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] hover:bg-[var(--chrismed-champagne-deep)]">Agendar nova consulta <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </TabsContent>

          <TabsContent value="pagamentos" className="mt-6 space-y-3">
            {(data?.payments ?? []).length === 0 ? (
              <EmptyState title="Nenhum pagamento conciliado nesta conta" />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
                <div className="divide-y divide-[var(--chrismed-sand)]">
                  {data!.payments.map((p) => (
                    <div key={p.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                      <div><p className="font-medium text-[var(--chrismed-ink)]">{p.description ?? "Pagamento CHRISMED"}</p><p className="text-xs text-[var(--chrismed-graphite)]">{new Date(p.created_at).toLocaleString("pt-BR")} · {p.payment_method}</p></div>
                      <strong>{money(p.amount_cents)}</strong>
                      <StatusPill status={p.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dados" className="mt-6">
            <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
              <p className="text-sm text-[var(--chrismed-graphite)]">Nome</p>
              <p className="font-medium text-[var(--chrismed-ink)]">{data?.profile?.display_name}</p>
              <p className="mt-4 text-sm text-[var(--chrismed-graphite)]">E-mail</p>
              <p className="font-medium text-[var(--chrismed-ink)]">{data?.profile?.email}</p>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </ChrismedShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const good = ["confirmed", "completed", "approved", "pago"].includes(status);
  const bad = ["cancelled", "rejected", "refunded", "no_show"].includes(status);
  const cls = good
    ? "bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] border-[var(--chrismed-ink)]"
    : bad
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-100 text-amber-900 border-amber-200";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>{status.replaceAll("_", " ")}</span>;
}

function EmptyState({ title, cta }: { title: string; cta?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-10 text-center">
      <p className="text-[var(--chrismed-graphite)]">{title}</p>
      {cta && <Link to="/chrismed/agendar" className="mt-4 inline-block"><Button className="gap-1.5 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]">Agendar consulta <ArrowRight className="h-4 w-4" /></Button></Link>}
    </div>
  );
}
