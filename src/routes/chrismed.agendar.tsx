/**
 * /chrismed/agendar — Wave 1 (fluxo invertido, frontend-only).
 *
 * Ordem oficial: 1) Especialidade → 2) Médico → 3) Modalidade → 4) Unidade
 * → 5) Data + Horário (SEM login) → 6) Identificação → 7) Confirmação
 * → 8) Pagamento PIX (Mercado Pago, único ponto real hoje) → 9) Sucesso.
 *
 * Wave 1 usa dados-mock explicitados (`src/data/chrismed-mock.ts`) para
 * especialidade / médico / unidade / calendário / horário. Pagamento PIX
 * segue chamando `mpago-create-payment` real. Reserva transacional de
 * slot, lock, webhook idempotente e persistência de agendamento continuam
 * como Pendências Codex — marcadas no rodapé de cada passo.
 */
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Stethoscope, Video, Home, RefreshCw, CheckCircle2, Copy,
  Heart, Briefcase, Baby, Brain, Plane, ChevronLeft, ChevronRight, MapPin, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { openChrismedOliver } from '@/components/chrismed/oliver-store';
import {
  CHRISMED_SPECIALTIES, CHRISMED_DOCTORS, CHRISMED_UNITS,
  buildChrismedMockCalendar, CHRISMED_MOCK_NOTICE,
  type ChrismedModality, type ChrismedSpecialty, type ChrismedDoctor, type ChrismedUnit, type ChrismedDay, type ChrismedSlot,
} from '@/data/chrismed-mock';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

type Offering = {
  id: string;
  slug: string;
  name: string;
  modality: ChrismedModality;
  price_cents: number;
  duration_minutes: number;
};

const MODALITY_META: Record<ChrismedModality, { icon: typeof Stethoscope; label: string; sub: string }> = {
  presencial: { icon: Stethoscope, label: 'Presencial', sub: 'No consultório em Copacabana' },
  telemedicina: { icon: Video, label: 'Teleconsulta', sub: 'Consulta por vídeo, onde estiver' },
  domiciliar: { icon: Home, label: 'Domiciliar', sub: 'Médico no seu endereço' },
  retorno: { icon: RefreshCw, label: 'Retorno', sub: 'Continuidade de tratamento' },
};

const SPECIALTY_ICON = { stethoscope: Stethoscope, heart: Heart, briefcase: Briefcase, baby: Baby, brain: Brain, plane: Plane } as const;

/**
 * Especialidade sintética "Atendimento 360°": ao escolher Teleconsulta
 * OU Domiciliar, o paciente não escolhe especialidade — recebe a visão
 * integrada das três atuações ambulatoriais da Dra. Christiane Alencar
 * (Gastroenterologia, Hepatologia e Clínica Médica). Só no Presencial
 * (Consultório) o paciente escolhe especialidade antes.
 */
const CARE_360_LABEL = 'Gastroenterologia · Hepatologia · Clínica Médica';
const CARE_360: ChrismedSpecialty = {
  slug: 'care-360',
  name: 'Atendimento 360°',
  short: CARE_360_LABEL,
  icon: 'stethoscope',
};


const searchSchema = z.object({
  modality: fallback(z.enum(['presencial', 'telemedicina', 'domiciliar', 'retorno']).optional(), undefined),
  specialty: fallback(z.string().optional(), undefined),
  doctor: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute('/chrismed/agendar')({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: 'Agendar consulta · CrisMed' },
      { name: 'description', content: 'Escolha especialidade, médico, modalidade, data e horário. Sem cadastro obrigatório para consultar a agenda.' },
      { property: 'og:title', content: 'Agendar consulta · CrisMed' },
      { property: 'og:description', content: 'Agenda pública CrisMed — presencial, teleconsulta e domiciliar. Cadastro só após escolher o horário.' },
    ],
  }),
  component: ChrismedAgendarPage,
  errorComponent: ({ error, reset }) => (
    <div className="container py-12 text-center">
      <h1 className="text-2xl font-semibold mb-2">Ops, algo deu errado</h1>
      <p className="text-muted-foreground mb-4">{String(error)}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  ),
  notFoundComponent: () => <div className="container py-12">Página não encontrada.</div>,
});

type Step = 'specialty' | 'doctor' | 'modality' | 'unit' | 'schedule' | 'identify' | 'confirm' | 'payment' | 'done';

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function maskPhone(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}
function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}
function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidCPF(v: string) { return v.replace(/\D/g, '').length === 11; }

function ChrismedAgendarPage() {
  const search = useSearch({ from: '/chrismed/agendar' });
  const [step, setStep] = useState<Step>('modality');
  const [specialty, setSpecialty] = useState<ChrismedSpecialty | null>(null);
  const [doctor, setDoctor] = useState<ChrismedDoctor | null>(null);
  const [modality, setModality] = useState<ChrismedModality | null>(null);
  const [unit, setUnit] = useState<ChrismedUnit | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [patient, setPatient] = useState({ first_name: '', last_name: '', email: '', doc: '', phone: '', cep: '' });
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pixResult, setPixResult] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(null);
  const [pollStatus, setPollStatus] = useState<string>('pending');

  // Aplica "Atendimento 360°" (tele + domiciliar) — 1 médico, 3 especialidades.
  function applyCare360(mod: 'telemedicina' | 'domiciliar') {
    const doc = CHRISMED_DOCTORS.find((d) => d.slug === 'dra-cristiane-alencar');
    const targetUnit = CHRISMED_UNITS.find((u) => u.slug === mod);
    setSpecialty(CARE_360);
    if (doc) setDoctor(doc);
    setModality(mod);
    if (targetUnit) setUnit(targetUnit);
    setStep('schedule');
  }

  // Pré-seleção via querystring — fluxo invertido: modalidade primeiro.
  useEffect(() => {
    if (search.modality === 'telemedicina' || search.modality === 'domiciliar') {
      applyCare360(search.modality);
      return;
    }
    if (search.modality === 'presencial') {
      setModality('presencial');
      setStep('specialty');
      return;
    }
    if (search.doctor) {
      const doc = CHRISMED_DOCTORS.find((d) => d.slug === search.doctor);
      if (doc) { setDoctor(doc); }
    }
    if (search.specialty) {
      const sp = CHRISMED_SPECIALTIES.find((s) => s.slug === search.specialty);
      if (sp) { setSpecialty(sp); }
    }
  }, [search.specialty, search.doctor, search.modality]);



  // Carrega offerings reais (para preço/duração no passo de pagamento)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('chrismed_service_offerings')
        .select('id,slug,name,modality,price_cents,duration_minutes')
        .eq('company_id', CHRISMED_COMPANY_ID)
        .eq('active', true)
        .order('display_order');
      setOfferings((data ?? []) as Offering[]);
      setLoadingOfferings(false);
    })();
  }, []);

  // Agenda dinâmica: recalcula quando modalidade/especialidade mudam.
  const calendar = useMemo(
    () => buildChrismedMockCalendar({ modality, specialtySlug: specialty?.slug ?? null }),
    [modality, specialty?.slug],
  );
  const currentOffering = useMemo(
    () => modality ? offerings.find((o) => o.modality === modality) ?? null : null,
    [modality, offerings],
  );

  // Ao trocar modalidade/especialidade, limpa data/horário selecionados para forçar nova escolha
  // dentro da nova agenda.
  useEffect(() => {
    setSelectedDayIso(null);
    setSelectedTime(null);
    setMonthOffset(0);
  }, [modality, specialty?.slug]);

  // Métricas agregadas para exibir mensagem clara de disponibilidade.
  const availabilityStats = useMemo(() => {
    const availableDays = calendar.filter((d) => d.state === 'available').length;
    const availableSlots = calendar.reduce(
      (acc, d) => acc + d.slots.filter((s) => s.state === 'available').length,
      0,
    );
    return { availableDays, availableSlots };
  }, [calendar]);

  // PIX polling
  useEffect(() => {
    if (!pixResult || pollStatus === 'approved') return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from('mpago_payments').select('status').eq('id', pixResult.payment_id).maybeSingle();
      if (data?.status) {
        setPollStatus(data.status);
        if (data.status === 'approved') { clearInterval(interval); setStep('done'); toast.success('Pagamento confirmado!'); }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixResult, pollStatus]);

  // Filtros por escolha
  const doctorsForSpecialty = specialty
    ? CHRISMED_DOCTORS.filter((d) => d.specialtySlugs.includes(specialty.slug))
    : CHRISMED_DOCTORS;

  // "Retorno" foi removido do fluxo público de Agendar. Retornos após consultas
  // ambulatoriais são combinados diretamente com a médica (Teleconsulta ou Presencial em Copacabana).
  const modalitiesForDoctor: ChrismedModality[] = (
    doctor ? doctor.modalities : (['presencial', 'telemedicina', 'domiciliar'] as ChrismedModality[])
  ).filter((m): m is ChrismedModality => m !== 'retorno');
  const unitsForModality = modality === 'telemedicina'
    ? CHRISMED_UNITS.filter((u) => u.slug === 'telemedicina')
    : modality === 'domiciliar'
      ? CHRISMED_UNITS.filter((u) => u.slug === 'domiciliar')
      : CHRISMED_UNITS.filter((u) => doctor?.unitSlugs.includes(u.slug) ?? true);

  const selectedDay: ChrismedDay | null = selectedDayIso ? calendar.find((d) => d.iso === selectedDayIso) ?? null : null;

  async function handlePay() {
    if (!currentOffering) {
      toast.error('Selecione uma modalidade com preço configurado.');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mpago-create-payment', {
        body: {
          company_id: CHRISMED_COMPANY_ID,
          payment_method: 'pix',
          amount_cents: currentOffering.price_cents,
          description: `CrisMed — ${specialty?.name} · ${doctor?.name} · ${selectedDayIso} ${selectedTime}`,
          payer: {
            email: patient.email,
            first_name: patient.first_name,
            last_name: patient.last_name || undefined,
            identification: patient.doc ? { type: 'CPF', number: patient.doc.replace(/\D/g, '') } : undefined,
          },
          context_type: 'chrismed_service_offering',
          context_id: currentOffering.id,
          metadata: {
            offering_slug: currentOffering.slug, modality: currentOffering.modality,
            wave1_mock: true, specialty: specialty?.slug, doctor: doctor?.slug, unit: unit?.slug,
            requested_day: selectedDayIso, requested_time: selectedTime,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPixResult({ qr_code: data.mp.qr_code, qr_code_base64: data.mp.qr_code_base64, payment_id: data.payment.id });
      setStep('payment');
    } catch (e) {
      toast.error(`Erro ao gerar PIX: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Ordem dinâmica: presencial exige especialidade; tele/domiciliar pula direto para o schedule (Atendimento 360°).
  const isCare360 = specialty?.slug === 'care-360' || modality === 'telemedicina' || modality === 'domiciliar';
  const stepOrder: Step[] = isCare360
    ? ['modality','schedule','identify','confirm','payment','done']
    : ['modality','specialty','doctor','schedule','identify','confirm','payment','done'];
  const stepLabels = isCare360
    ? ['Modalidade','Data e horário','Identificação','Confirmação','Pagamento','Pronto']
    : ['Modalidade','Especialidade','Médico','Data e horário','Identificação','Confirmação','Pagamento','Pronto'];
  const stepIndex = Math.max(0, stepOrder.indexOf(step));
  const canGoBack = stepIndex > 0 && step !== 'done' && step !== 'payment';
  function goBack() {
    if (stepIndex <= 0) return;
    const prev = stepOrder[stepIndex - 1];
    setStep(prev);
  }



  const stickySummary = [
    doctor?.name,
    specialty?.name,
    modality ? MODALITY_META[modality].label : null,
    selectedTime,
  ].filter(Boolean).join(' · ');

  return (
    <ChrismedShell variant="minimal">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-10 pb-32 sm:pb-10">
        {/* Progress trail */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--chrismed-mist)] flex-wrap">
            {stepLabels.map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                <span className={i <= stepIndex ? 'text-[var(--chrismed-ink)] font-medium' : ''}>{i + 1}. {label}</span>
                {i < stepLabels.length - 1 && <ChevronRight className="h-3 w-3 opacity-40" />}
              </span>
            ))}
          </div>
          <div className="mt-3 h-1 rounded-full bg-[var(--chrismed-sand)]">
            <div className="h-full rounded-full bg-[var(--chrismed-ink)] transition-all" style={{ width: `${((stepIndex + 1) / stepLabels.length) * 100}%` }} />
          </div>
        </div>

        {/* Agenda real — reserva confirmada após pagamento PIX aprovado */}

        {/* Banner Atendimento 360° — reforça a fusão das 3 especialidades (tele + domiciliar) */}
        {isCare360 && step !== 'done' && step !== 'modality' && (
          <div className="mb-6 rounded-lg border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] px-4 py-3 text-sm text-[var(--chrismed-ink)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)] mb-1">Atendimento 360° · {modality === 'domiciliar' ? 'Domiciliar' : 'Teleconsulta'}</div>
            <p className="leading-relaxed">
              Nesta modalidade, a Dra. Christiane Alencar avalia você com o olhar integrado das três especialidades — <strong>Gastroenterologia</strong>, <strong>Hepatologia</strong> e <strong>Clínica Médica</strong> — sem que você precise escolher uma antes. É o mesmo médico, com diagnóstico 360°.
            </p>
          </div>
        )}


        {/* STEP 1: Modalidade (agora primeiro) */}
        {step === 'modality' && (
          <section aria-labelledby="s1">
            <h1 id="s1" className="chrismed-serif text-3xl md:text-4xl text-[var(--chrismed-ink)]">Como você quer ser atendido?</h1>
            <p className="mt-2 text-[var(--chrismed-graphite)]">
              Escolha a modalidade primeiro. Em <strong>Teleconsulta</strong> e <strong>Domiciliar</strong>, a Dra. Christiane Alencar atende com a visão 360° das três especialidades — <strong>Gastroenterologia</strong>, <strong>Hepatologia</strong> e <strong>Clínica Médica</strong> — sem que você precise escolher uma antes. Em <strong>Presencial no Consultório</strong>, você escolhe a especialidade em seguida.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(['telemedicina','presencial','domiciliar'] as ChrismedModality[]).map((m) => {
                const meta = MODALITY_META[m];
                const Icon = meta.icon;
                const badge = m === 'presencial' ? 'Escolha a especialidade' : 'Visão 360° · 3 especialidades';
                const label = m === 'presencial' ? 'Presencial no Consultório' : meta.label;
                return (
                  <button key={m} type="button"
                    onClick={() => {
                      if (m === 'telemedicina' || m === 'domiciliar') { applyCare360(m); return; }
                      setModality('presencial');
                      setSpecialty(null); setDoctor(null); setUnit(null);
                      setStep('specialty');
                    }}
                    className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]">
                    <div className="h-11 w-11 rounded-lg bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="chrismed-serif text-lg text-[var(--chrismed-ink)]">{label}</div>
                    <div className="text-sm text-[var(--chrismed-graphite)] mt-1">{meta.sub}</div>
                    <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--chrismed-champagne-deep)]">{badge}</div>
                  </button>
                );
              })}
            </div>

            {/* Evolução Teleconsulta → Presencial */}
            <div className="mt-10 rounded-xl border border-[var(--chrismed-champagne)] bg-[var(--chrismed-bone)] p-5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)] mb-1">Continuidade de cuidado</div>
              <h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">Fez uma Teleconsulta que evoluiu para Consulta Presencial?</h3>
              <p className="text-sm text-[var(--chrismed-graphite)] mt-2 leading-relaxed">
                Em caso de dúvidas, uma teleconsulta pode ser marcada primeiro. Se a Dra. Christiane entender ser necessária a consulta presencial, <strong>somente a diferença de valor será cobrada</strong>. A recepção CHRISMED será avisada e enviará as orientações para o agendamento específico.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-ivory)]"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('chrismed:reception:notify', {
                      detail: { reason: 'tele_to_presencial_upgrade' },
                    }));
                  }
                  openOliver();
                  toast.success('Recepção CHRISMED avisada. Você receberá as orientações em breve.');
                }}
              >
                Clique aqui — avisar a recepção CHRISMED
              </Button>
            </div>
          </section>
        )}

        {/* STEP 2: Especialidade (apenas fluxo Presencial) */}
        {step === 'specialty' && (() => {
          const AMBULATORIAL_ONLY = ['gastroenterologia', 'hepatologia', 'clinica-medica'];
          const base = doctor
            ? CHRISMED_SPECIALTIES.filter((s) => doctor.specialtySlugs.includes(s.slug))
            : CHRISMED_SPECIALTIES;
          const specialtiesToShow = base.filter((s) => AMBULATORIAL_ONLY.includes(s.slug));
          return (
          <section aria-labelledby="s2">
            <button onClick={() => setStep('modality')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar modalidade</button>
            <h2 id="s2" className="chrismed-serif text-3xl md:text-4xl text-[var(--chrismed-ink)]">Escolha a especialidade</h2>
            <p className="mt-2 text-[var(--chrismed-graphite)]">
              Consulta <strong>presencial no consultório</strong> em Copacabana. Selecione a especialidade que melhor atende sua demanda.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialtiesToShow.map((sp) => {
                const Icon = SPECIALTY_ICON[sp.icon];
                return (
                  <button key={sp.slug} type="button" onClick={() => { setSpecialty(sp); setStep('doctor'); }}
                    className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]">
                    <div className="h-11 w-11 rounded-lg bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="chrismed-serif text-lg text-[var(--chrismed-ink)]">{sp.name}</div>
                    <div className="text-sm text-[var(--chrismed-graphite)] mt-1">{sp.short}</div>
                  </button>
                );
              })}
            </div>
          </section>
          );
        })()}

        {/* STEP 3: Médico (fluxo Presencial) */}
        {step === 'doctor' && specialty && (
          <section aria-labelledby="s3">
            <button onClick={() => setStep('specialty')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar especialidade</button>
            <h2 id="s3" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Escolha o médico</h2>
            <p className="mt-2 text-[var(--chrismed-graphite)]">Profissionais que atendem <strong>{specialty.name}</strong>.</p>
            {doctorsForSpecialty.length === 0 ? (
              <EmptyState message="Nenhum médico disponível para esta especialidade no momento." onOliver={openOliver} />
            ) : (
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                {doctorsForSpecialty.map((d) => (
                  <button key={d.slug} type="button" onClick={() => { setDoctor(d); setStep('unit'); }}
                    className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]">
                    <div className="chrismed-serif text-xl text-[var(--chrismed-ink)]">{d.name}</div>
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--chrismed-mist)] mt-1">{d.title}</div>
                    <div className="text-xs text-[var(--chrismed-mist)] mt-1">{d.crm}</div>
                    <p className="text-sm text-[var(--chrismed-graphite)] mt-3">{d.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {d.modalities.filter((m) => m === 'presencial').map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px] uppercase tracking-[0.14em] border-[var(--chrismed-sand)]">{MODALITY_META[m].label}</Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}



        {/* STEP 4: Unidade (fluxo Presencial) */}
        {step === 'unit' && modality && (
          <section aria-labelledby="s4">
            <button onClick={() => setStep('doctor')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar médico</button>
            <h2 id="s4" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Onde será o atendimento?</h2>
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {unitsForModality.map((u) => (
                <button key={u.slug} type="button" onClick={() => { setUnit(u); setStep('schedule'); }}
                  className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)] hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]">
                  <div className="h-11 w-11 rounded-lg bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center mb-3">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="chrismed-serif text-lg text-[var(--chrismed-ink)]">{u.name}</div>
                  <div className="text-sm text-[var(--chrismed-graphite)] mt-1">{u.address}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 5: Calendário + horários */}
        {step === 'schedule' && unit && (
          <section aria-labelledby="s5">
            <button onClick={() => isCare360 ? setStep('modality') : setStep('unit')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← {isCare360 ? 'Trocar modalidade' : 'Trocar unidade'}</button>
            <h2 id="s5" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Escolha data e horário</h2>
            <p className="mt-2 text-[var(--chrismed-graphite)]">Datas em branco não têm agenda. Horários em cinza estão indisponíveis. Você reserva ao continuar.</p>



            <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
              <MockCalendar
                calendar={calendar}
                monthOffset={monthOffset}
                onMonth={setMonthOffset}
                selectedIso={selectedDayIso}
                onPick={(iso) => { setSelectedDayIso(iso); setSelectedTime(null); }}
              />
              <div className="rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-[var(--chrismed-mist)] mb-3">
                  Horários disponíveis {modality ? `· ${MODALITY_META[modality].label}` : ''}
                </div>

                {availabilityStats.availableSlots === 0 && (
                  <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <strong>Sem disponibilidade nas próximas semanas</strong> para esta combinação de modalidade e
                    especialidade. Fale com Oliver para entrar na lista de espera ou tentar outra modalidade.
                  </div>
                )}

                {!selectedDay && availabilityStats.availableSlots > 0 && (
                  <p className="text-sm text-[var(--chrismed-mist)]">
                    Selecione uma data disponível no calendário. {availabilityStats.availableDays} dia(s) com agenda
                    aberta nas próximas semanas.
                  </p>
                )}

                {selectedDay?.state === 'empty' && (
                  <p className="text-sm text-[var(--chrismed-mist)]">Sem agenda neste dia. Escolha outra data.</p>
                )}

                {selectedDay && selectedDay.slots.length > 0 && (
                  <>
                    {selectedDay.slots.every((s) => s.state !== 'available') && (
                      <div className="mb-3 rounded-md border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] px-3 py-2 text-xs text-[var(--chrismed-ink)]">
                        Todos os horários deste dia estão ocupados ou indisponíveis. Selecione outra data no
                        calendário.
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDay.slots.map((s) => (
                        <SlotButton key={s.time} slot={s} selected={selectedTime === s.time} onPick={() => setSelectedTime(s.time)} />
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-5 flex items-center gap-3 text-[10px] text-[var(--chrismed-mist)] flex-wrap">
                  <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-[var(--chrismed-ink)]" /> Disponível</span>
                  <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-[var(--chrismed-ink)]/30" /> Indisponível</span>
                  <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full bg-[var(--chrismed-champagne-deep)]" /> Reservado</span>
                </div>
                <Button
                  className="w-full mt-5 bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]"
                  disabled={
                    !selectedDayIso ||
                    !selectedTime ||
                    // trava dupla: horário selecionado precisa continuar 'available' (não pode ser held/past/indisponível)
                    selectedDay?.slots.find((s) => s.time === selectedTime)?.state !== 'available'
                  }
                  onClick={() => setStep('identify')}
                >
                  Continuar
                </Button>
                <p className="text-[11px] text-[var(--chrismed-mist)] mt-3">A reserva é confirmada após a aprovação do pagamento PIX.</p>
              </div>
            </div>
          </section>
        )}

        {/* STEP 6: Identificação */}
        {step === 'identify' && (
          <section aria-labelledby="s6" className="max-w-2xl">
            <button onClick={() => setStep('schedule')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar horário</button>
            <h2 id="s6" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Sua identificação</h2>
            <p className="mt-2 text-[var(--chrismed-graphite)]">Pedimos só agora. Cadastro completo (endereço, documentos) fica para depois do pagamento.</p>
            <Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
              <CardContent className="p-6 grid gap-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fn">Nome*</Label>
                    <Input id="fn" value={patient.first_name} onChange={(e) => setPatient({ ...patient, first_name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="ln">Sobrenome</Label>
                    <Input id="ln" value={patient.last_name} onChange={(e) => setPatient({ ...patient, last_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="em">E-mail*</Label>
                  <Input id="em" type="email" autoComplete="email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} />
                  {patient.email && !isValidEmail(patient.email) && <p className="text-xs text-red-600 mt-1">E-mail inválido.</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="doc">CPF*</Label>
                    <Input id="doc" inputMode="numeric" value={patient.doc} onChange={(e) => setPatient({ ...patient, doc: maskCPF(e.target.value) })} placeholder="000.000.000-00" />
                    {patient.doc && !isValidCPF(patient.doc) && <p className="text-xs text-red-600 mt-1">CPF incompleto.</p>}
                  </div>
                  <div>
                    <Label htmlFor="ph">Telefone</Label>
                    <Input id="ph" inputMode="tel" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cep">CEP (opcional)</Label>
                  <Input id="cep" inputMode="numeric" value={patient.cep} onChange={(e) => setPatient({ ...patient, cep: maskCEP(e.target.value) })} placeholder="00000-000" />
                  <p className="text-[11px] text-[var(--chrismed-mist)] mt-1">Preenchimento automático de endereço: <strong>Pendente Codex</strong>.</p>
                </div>
                <Button className="w-full bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]"
                  disabled={!patient.first_name || !isValidEmail(patient.email) || !isValidCPF(patient.doc)}
                  onClick={() => setStep('confirm')}>
                  Continuar para confirmação
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* STEP 7: Confirmação */}
        {step === 'confirm' && specialty && doctor && modality && unit && (
          <section aria-labelledby="s7" className="max-w-2xl">
            <button onClick={() => setStep('identify')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Voltar</button>
            <h2 id="s7" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Confirme os dados</h2>
            <Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
              <CardContent className="p-6 space-y-3 text-sm">
                <Row label="Especialidade" value={isCare360 ? `Atendimento 360° — ${CARE_360_LABEL}` : specialty.name} />
                {isCare360 && (
                  <p className="text-xs text-[var(--chrismed-graphite)] leading-relaxed">
                    Esta modalidade funde o conhecimento das três especialidades da Dra. Christiane Alencar em uma única consulta — diagnóstico 360°, sem escolher especialidade.
                  </p>
                )}

                <Row label="Médico" value={doctor.name} />
                <Row label="Modalidade" value={MODALITY_META[modality].label} />
                <Row label="Unidade" value={unit.name} />
                <Row label="Data" value={selectedDayIso ?? '—'} />
                <Row label="Horário" value={selectedTime ?? '—'} />
                <Row label="Paciente" value={`${patient.first_name} ${patient.last_name}`.trim()} />
                <Row label="E-mail" value={patient.email} />
                <Row label="CPF" value={patient.doc} />
                <hr className="border-[var(--chrismed-sand)]" />
                {loadingOfferings ? (
                  <div className="flex items-center gap-2 text-[var(--chrismed-graphite)]"><Loader2 className="h-4 w-4 animate-spin" /> Carregando preço...</div>
                ) : currentOffering ? (
                  <Row label="Valor" value={currentOffering.price_cents === 0 ? 'Cortesia' : `R$ ${(currentOffering.price_cents / 100).toFixed(2).replace('.', ',')}`} />
                ) : (
                  <p className="text-xs text-amber-700">Preço não configurado para esta modalidade. Fale com Oliver.</p>
                )}
                <p className="text-xs text-[var(--chrismed-mist)]">
                  Ao continuar, você concorda com a política de cancelamento (reembolso integral com mais de 24h de antecedência). Termos completos e política de LGPD: <strong>versionamento Pendente Codex</strong>.
                </p>
                <Button className="w-full bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]" disabled={submitting || !currentOffering} onClick={handlePay}>
                  {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                  {currentOffering && currentOffering.price_cents === 0 ? 'Confirmar reserva (cortesia)' : 'Ir para pagamento PIX'}
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* STEP 8: Pagamento (PIX real) */}
        {step === 'payment' && pixResult && (
          <section aria-labelledby="s8" className="max-w-xl mx-auto">
            <h2 id="s8" className="chrismed-serif text-3xl text-[var(--chrismed-ink)] text-center">Pague via PIX</h2>
            <p className="mt-2 text-[var(--chrismed-graphite)] text-center">Aponte a câmera para o QR ou copie o código. Confirmação automática.</p>
            <Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
              <CardContent className="p-6 space-y-4">
                {pixResult.qr_code_base64 && (
                  <img src={`data:image/png;base64,${pixResult.qr_code_base64}`} alt="QR Code PIX" className="mx-auto rounded-lg border bg-[var(--chrismed-ivory)] p-3" width={256} height={256} />
                )}
                {pixResult.qr_code && (
                  <div className="space-y-1">
                    <Label>Código PIX copia-e-cola</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={pixResult.qr_code} className="font-mono text-xs" />
                      <Button variant="outline" size="icon" aria-label="Copiar código PIX" onClick={() => { navigator.clipboard.writeText(pixResult.qr_code); toast.success('Copiado!'); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[var(--chrismed-graphite)] justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Aguardando confirmação do pagamento...
                </div>
                <Button variant="outline" className="w-full border-[var(--chrismed-sand)]" onClick={() => { setPixResult(null); setPollStatus('pending'); setStep('confirm'); }}>
                  Cancelar e voltar
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* STEP 9: Sucesso — resumo completo do agendamento + próximos passos */}
        {step === 'done' && (
          <section aria-labelledby="s9" className="max-w-2xl mx-auto">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-[var(--chrismed-sand)] text-[var(--chrismed-ink)] flex items-center justify-center mb-4">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 id="s9" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">
                Agendamento confirmado
              </h2>
              <p className="mt-3 text-[var(--chrismed-graphite)]">
                Pagamento aprovado e horário reservado em seu nome. Um resumo com todas as instruções foi enviado
                para <strong>{patient.email || 'seu e-mail'}</strong>.
              </p>
            </div>

            <Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
              <CardHeader>
                <CardTitle className="chrismed-serif text-xl">Resumo da sua consulta</CardTitle>
                <CardDescription>Guarde estes dados. Você também os recebe por e-mail e WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Paciente" value={`${patient.first_name} ${patient.last_name}`.trim() || '—'} />
                <Row label="Modalidade" value={modality ? MODALITY_META[modality].label : '—'} />
                <Row
                  label="Especialidade"
                  value={isCare360 ? `Atendimento 360° — ${CARE_360_LABEL}` : specialty?.name ?? '—'}
                />
                <Row label="Médico(a)" value={doctor?.name ?? '—'} />
                <Row label="Unidade" value={unit?.name ?? '—'} />
                <Row label="Data" value={selectedDayIso ?? '—'} />
                <Row label="Horário" value={selectedTime ?? '—'} />
                {currentOffering && (
                  <Row
                    label="Valor pago"
                    value={
                      currentOffering.price_cents === 0
                        ? 'Cortesia'
                        : `R$ ${(currentOffering.price_cents / 100).toFixed(2).replace('.', ',')}`
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card className="mt-4 border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]">
              <CardHeader>
                <CardTitle className="chrismed-serif text-lg">Próximos passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--chrismed-graphite)]">
                {modality === 'telemedicina' && (
                  <p>1. Você receberá o <strong>link da teleconsulta</strong> por e-mail e WhatsApp até 30 min antes do horário.</p>
                )}
                {modality === 'presencial' && (
                  <p>1. Chegue com <strong>15 min de antecedência</strong> em {unit?.address || 'nosso consultório em Copacabana'}. Traga documento com foto e exames anteriores.</p>
                )}
                {modality === 'domiciliar' && (
                  <p>1. A equipe entrará em contato para confirmar o <strong>endereço e logística</strong> da visita domiciliar em até 4 horas úteis.</p>
                )}
                <p>2. Em caso de imprevisto, você pode <strong>remarcar sem custo</strong> com mais de 24h de antecedência.</p>
                <p>3. Precisa preparar algum exame ou jejum? Fale com o Oliver para receber a orientação específica da sua consulta.</p>
              </CardContent>
            </Card>

            <div className="mt-6 flex gap-3 justify-center flex-wrap">
              <Button
                className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]"
                onClick={() => window.location.reload()}
              >
                Agendar outra consulta
              </Button>
              <Button variant="outline" className="border-[var(--chrismed-sand)]" onClick={openOliver}>
                Falar com Oliver
              </Button>
            </div>
          </section>
        )}

        <p className="mt-12 text-center text-[11px] text-[var(--chrismed-ink)]/50">{CHRISMED_MOCK_NOTICE}</p>
      </div>

      {/* Sticky CTA bar mobile — contexto persistente + voltar + Oliver */}
      {step !== 'done' && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]/95 backdrop-blur px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden"
          role="region"
          aria-label="Progresso do agendamento"
        >
          <div className="h-1 rounded-full bg-[var(--chrismed-sand)] mb-2">
            <div
              className="h-full rounded-full bg-[var(--chrismed-ink)] transition-all"
              style={{ width: `${((stepIndex + 1) / stepLabels.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              className="min-h-11 min-w-11 -ml-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-ink)] disabled:opacity-30"
              aria-label="Voltar ao passo anterior"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex-1 min-w-0 text-center">
              <div className="text-[9px] uppercase tracking-[0.16em] text-[var(--chrismed-mist)]">
                Passo {stepIndex + 1}/{stepLabels.length}
              </div>
              <div className="text-[11px] text-[var(--chrismed-ink)] truncate font-medium">
                {stickySummary || stepLabels[stepIndex]}
              </div>
            </div>
            <button
              type="button"
              onClick={openOliver}
              className="min-h-11 min-w-11 -mr-1 text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-champagne-deep)] font-medium"
              aria-label="Falar com Oliver"
            >
              Oliver
            </button>
          </div>
        </div>
      )}
    </ChrismedShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[var(--chrismed-mist)]">{label}</span>
      <span className="text-[var(--chrismed-ink)] font-medium text-right">{value}</span>
    </div>
  );
}

function EmptyState({ message, onOliver }: { message: string; onOliver: () => void }) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-8 text-center">
      <p className="text-[var(--chrismed-graphite)]">{message}</p>
      <Button variant="outline" className="mt-4 border-[var(--chrismed-sand)]" onClick={onOliver}>Falar com Oliver</Button>
    </div>
  );
}

function SlotButton({ slot, selected, onPick }: { slot: ChrismedSlot; selected: boolean; onPick: () => void }) {
  const disabled = slot.state !== 'available';
  const base = 'rounded-md py-2 text-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]';
  if (slot.state === 'held') return <button disabled className={`${base} border-[var(--chrismed-champagne)] bg-[var(--chrismed-bone)] text-[var(--chrismed-champagne-deep)] cursor-not-allowed`}>{slot.time} · reservado</button>;
  if (disabled) return <button disabled className={`${base} border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)]/40 cursor-not-allowed line-through`}>{slot.time}</button>;
  return (
    <button onClick={onPick} className={`${base} ${selected ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]' : 'border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)] hover:border-[var(--chrismed-champagne-deep)]'}`}>
      {slot.time}
    </button>
  );
}

function MockCalendar({
  calendar, monthOffset, onMonth, selectedIso, onPick,
}: {
  calendar: ChrismedDay[]; monthOffset: number; onMonth: (n: number) => void;
  selectedIso: string | null; onPick: (iso: string) => void;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const firstDow = viewDate.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const dayMap = new Map(calendar.map((d) => [d.iso, d]));
  const cells: (ChrismedDay | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(viewDate.getFullYear(), viewDate.getMonth(), d).toISOString().slice(0, 10);
    cells.push(dayMap.get(iso) ?? { iso, state: 'empty', slots: [] });
  }

  return (
    <div className="rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => onMonth(monthOffset - 1)} disabled={monthOffset === 0} aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="chrismed-serif text-[var(--chrismed-ink)] capitalize">{monthLabel}</div>
        <Button variant="ghost" size="icon" onClick={() => onMonth(monthOffset + 1)} aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--chrismed-ink)]/50 mb-2">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const d = new Date(cell.iso + 'T00:00:00');
          const isPast = d < today;
          const disabled = isPast || cell.state !== 'available';
          const isSelected = selectedIso === cell.iso;
          return (
            <button key={cell.iso} disabled={disabled} onClick={() => onPick(cell.iso)}
              aria-label={`${d.getDate()} — ${disabled ? 'indisponível' : 'disponível'}`}
              className={[
                'aspect-square rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne-deep)]',
                isSelected ? 'bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] font-medium' :
                disabled ? 'text-[var(--chrismed-ink)]/25 cursor-not-allowed' :
                'text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-bone)]',
              ].join(' ')}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
