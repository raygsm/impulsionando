/**
 * /chrismed/agendar — fluxo público com reserva transacional antes da cobrança.
 * A disponibilidade vem da agenda única do profissional e o pagamento aprovado
 * é a confirmação definitiva. O checkout mantém apenas um hold temporário de 5 minutos.
 */
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
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
  Heart, Briefcase, Baby, Brain, Plane, ChevronLeft, ChevronRight, MapPin, AlertCircle, Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { openChrismedOliver } from '@/components/chrismed/oliver-store';
import { isValidCPF } from '@/lib/validators';
import {
  CHRISMED_SPECIALTIES, CHRISMED_DOCTORS, CHRISMED_UNITS,
  type ChrismedModality, type ChrismedSpecialty, type ChrismedDoctor, type ChrismedUnit, type ChrismedDay, type ChrismedSlot,
} from '@/data/chrismed-mock';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';
const CHECKOUT_HOLD_SECONDS = 300;

type Offering = { id: string; slug: string; name: string; modality: ChrismedModality; price_cents: number; duration_minutes: number; };

const MODALITY_META: Record<ChrismedModality, { icon: typeof Stethoscope; label: string; sub: string }> = {
  presencial: { icon: Stethoscope, label: 'Presencial', sub: 'No consultório em Copacabana' },
  telemedicina: { icon: Video, label: 'Teleconsulta', sub: 'Consulta por vídeo, onde estiver' },
  domiciliar: { icon: Home, label: 'Domiciliar', sub: 'Médico no seu endereço' },
  retorno: { icon: RefreshCw, label: 'Retorno', sub: 'Continuidade de tratamento' },
  ocupacional: { icon: Briefcase, label: 'ASO', sub: 'Atendimento ocupacional em Copacabana' },
  pericia: { icon: Briefcase, label: 'Perícia médica', sub: 'Entrevista técnica para laudo' },
};
const SPECIALTY_ICON = { stethoscope: Stethoscope, heart: Heart, briefcase: Briefcase, baby: Baby, brain: Brain, plane: Plane } as const;
const CARE_360_LABEL = 'Gastroenterologia · Hepatologia · Clínica Médica';
const CARE_360: ChrismedSpecialty = { slug: 'care-360', name: 'Atendimento 360°', short: CARE_360_LABEL, icon: 'stethoscope' };

const searchSchema = z.object({
  modality: fallback(z.enum(['presencial', 'telemedicina', 'domiciliar', 'retorno', 'ocupacional', 'pericia']).optional(), undefined),
  service: fallback(z.enum(['aso', 'pericia']).optional(), undefined),
  specialty: fallback(z.string().optional(), undefined),
  doctor: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute('/chrismed/agendar')({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [
    { title: 'Agendar consulta · CHRISMED' },
    { name: 'description', content: 'Escolha especialidade, médico, modalidade, data e horário. A confirmação definitiva ocorre após o pagamento aprovado.' },
    { property: 'og:title', content: 'Agendar consulta · CHRISMED' },
    { property: 'og:description', content: 'Agenda única CHRISMED — presencial, teleconsulta, domiciliar, ASO e perícia sem conflitos de horário.' },
  ] }),
  component: ChrismedAgendarPage,
  errorComponent: ({ reset }) => <div className="container py-12 text-center"><h1 className="text-2xl font-semibold mb-2">Não foi possível abrir esta etapa</h1><p className="text-muted-foreground mb-4">Tente novamente. Se o problema continuar, fale com o atendimento CHRISMED.</p><Button onClick={reset}>Tentar novamente</Button></div>,
  notFoundComponent: () => <div className="container py-12">Página não encontrada.</div>,
});

type Step = 'specialty' | 'doctor' | 'modality' | 'unit' | 'schedule' | 'identify' | 'confirm' | 'payment' | 'done';
function openOliver() { if (typeof window !== 'undefined') { openChrismedOliver(); window.dispatchEvent(new CustomEvent('chrismed:oliver:open')); } }
function maskCPF(v: string) { return v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }
function maskPhone(v: string) { return v.replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2'); }
function maskCEP(v: string) { return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'); }
function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function formatSlotLabel(slot: Pick<ChrismedSlot, 'time' | 'occurrence' | 'endTime'> | null | undefined) { if (!slot) return '—'; const suffix = slot.occurrence > 1 ? ` · ${slot.occurrence}ª janela` : ''; return `${slot.time}${suffix} · até ${slot.endTime}`; }
function formatCountdown(total: number) { const safe = Math.max(0, total); return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`; }

function ChrismedAgendarPage() {
  const search = useSearch({ from: '/chrismed/agendar' });
  const occupationalService = search.service === 'aso' || search.service === 'pericia';
  const initialOccupationalSpecialty = occupationalService ? CHRISMED_SPECIALTIES.find((item) => item.slug === 'medicina-do-trabalho') ?? null : null;
  const initialOccupationalDoctor = occupationalService ? CHRISMED_DOCTORS.find((item) => item.slug === 'dra-christiane-alencar') ?? null : null;
  const initialOccupationalUnit = occupationalService ? CHRISMED_UNITS.find((item) => item.slug === 'copacabana') ?? null : null;
  const [step, setStep] = useState<Step>(occupationalService ? 'schedule' : 'modality');
  const [specialty, setSpecialty] = useState<ChrismedSpecialty | null>(initialOccupationalSpecialty);
  const [doctor, setDoctor] = useState<ChrismedDoctor | null>(initialOccupationalDoctor);
  const [modality, setModality] = useState<ChrismedModality | null>(occupationalService ? (search.service === 'aso' ? 'ocupacional' : 'pericia') : null);
  const [selectedOfferingSlug, setSelectedOfferingSlug] = useState<string | null>(null);
  const [unit, setUnit] = useState<ChrismedUnit | null>(initialOccupationalUnit);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [patient, setPatient] = useState({ first_name: '', last_name: '', email: '', doc: '', phone: '', cep: '' });
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [calendar, setCalendar] = useState<ChrismedDay[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pixResult, setPixResult] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(null);
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(CHECKOUT_HOLD_SECONDS);
  const [pollStatus, setPollStatus] = useState<string>('pending');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const holdExpired = step === 'payment' && holdSecondsRemaining <= 0 && pollStatus !== 'confirmed';

  function applyCare360(mod: 'telemedicina' | 'domiciliar', offeringSlug: string | null = null) {
    const doc = CHRISMED_DOCTORS.find((d) => d.slug === 'dra-christiane-alencar');
    const targetUnit = CHRISMED_UNITS.find((u) => u.slug === mod);
    setSelectedOfferingSlug(offeringSlug); setSpecialty(CARE_360); if (doc) setDoctor(doc); setModality(mod); if (targetUnit) setUnit(targetUnit); setStep('schedule');
  }

  useEffect(() => {
    if (search.service === 'aso' || search.service === 'pericia') {
      const doc = CHRISMED_DOCTORS.find((d) => d.slug === 'dra-christiane-alencar');
      const sp = CHRISMED_SPECIALTIES.find((s) => s.slug === 'medicina-do-trabalho');
      const office = CHRISMED_UNITS.find((u) => u.slug === 'copacabana');
      if (doc) setDoctor(doc); if (sp) setSpecialty(sp); if (office) setUnit(office);
      setModality(search.service === 'aso' ? 'ocupacional' : 'pericia'); setStep('schedule'); return;
    }
    if (search.modality === 'telemedicina' || search.modality === 'domiciliar') { applyCare360(search.modality); return; }
    if (search.modality === 'presencial') { setModality('presencial'); setStep('specialty'); return; }
    if (search.doctor) { const doc = CHRISMED_DOCTORS.find((d) => d.slug === search.doctor); if (doc) setDoctor(doc); }
    if (search.specialty) { const sp = CHRISMED_SPECIALTIES.find((s) => s.slug === search.specialty); if (sp) setSpecialty(sp); }
  }, [search.specialty, search.doctor, search.modality, search.service]);

  useEffect(() => { (async () => {
    const { data } = await supabase.from('chrismed_service_offerings').select('id,slug,name,modality,price_cents,duration_minutes').eq('company_id', CHRISMED_COMPANY_ID).eq('active', true).order('display_order');
    setOfferings((data ?? []) as Offering[]); setLoadingOfferings(false);
  })(); }, []);

  const currentOffering = useMemo(() => selectedOfferingSlug ? offerings.find((o) => o.slug === selectedOfferingSlug) ?? null : modality ? offerings.find((o) => o.modality === modality) ?? null : null, [modality, offerings, selectedOfferingSlug]);

  useEffect(() => {
    if (!doctor || !currentOffering) { setCalendar([]); return; }
    let cancelled = false; setLoadingCalendar(true);
    (async () => {
      const from = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const { data, error } = await (supabase as any).rpc('list_chrismed_available_slots', { p_professional_slug: doctor.slug, p_offering_id: currentOffering.id, p_from: from, p_days: 42 });
      if (cancelled) return;
      if (error) { setCalendar([]); toast.error('A agenda está temporariamente indisponível. Nenhuma cobrança será realizada.'); setLoadingCalendar(false); return; }
      const byDay = new Map<string, ChrismedSlot[]>();
      for (const row of (data ?? []) as Array<{ starts_at: string; ends_at: string }>) {
        const starts = new Date(row.starts_at), ends = new Date(row.ends_at);
        const iso = starts.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
        const time = starts.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = ends.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
        const [slotHour, slotMinute] = time.split(':').map(Number), startsAtMinutes = slotHour * 60 + slotMinute;
        const list = byDay.get(iso) ?? [];
        list.push({ id: row.starts_at, time, endTime, state: 'available', occurrence: 1, startsAtMinutes, endsAtMinutes: startsAtMinutes + currentOffering.duration_minutes }); byDay.set(iso, list);
      }
      const days: ChrismedDay[] = [], base = new Date(`${from}T12:00:00`);
      for (let offset = 0; offset < 42; offset += 1) { const date = new Date(base); date.setDate(base.getDate() + offset); const iso = date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); const slots = byDay.get(iso) ?? []; days.push({ iso, slots, state: slots.length ? 'available' : 'empty' }); }
      setCalendar(days); setLoadingCalendar(false);
    })();
    return () => { cancelled = true; };
  }, [currentOffering, doctor]);

  useEffect(() => { setSelectedDayIso(null); setSelectedTime(null); setSelectedSlotId(null); setMonthOffset(0); }, [modality, specialty?.slug, selectedOfferingSlug]);
  const availabilityStats = useMemo(() => ({ availableDays: calendar.filter((d) => d.state === 'available').length, availableSlots: calendar.reduce((acc, d) => acc + d.slots.filter((s) => s.state === 'available').length, 0) }), [calendar]);

  useEffect(() => {
    if (step !== 'payment' || !holdExpiresAt || pollStatus === 'confirmed') return;
    const tick = () => setHoldSecondsRemaining(Math.max(0, Math.ceil((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 250); return () => window.clearInterval(timer);
  }, [step, holdExpiresAt, pollStatus]);

  useEffect(() => {
    if (!holdToken || pollStatus === 'approved' || holdExpired) return;
    const interval = setInterval(async () => {
      const { data } = await (supabase as any).rpc('get_chrismed_booking_status', { p_hold_token: holdToken });
      const booking = Array.isArray(data) ? data[0] : data;
      if (booking?.status) { setPollStatus(booking.status); if (booking.status === 'confirmed') { clearInterval(interval); setStep('done'); toast.success('Pagamento e consulta confirmados!'); } }
    }, 3000);
    return () => clearInterval(interval);
  }, [holdToken, pollStatus, holdExpired]);

  const doctorsForSpecialty = specialty ? CHRISMED_DOCTORS.filter((d) => d.specialtySlugs.includes(specialty.slug)) : CHRISMED_DOCTORS;
  const modalitiesForDoctor: ChrismedModality[] = (doctor ? doctor.modalities : (['presencial', 'telemedicina', 'domiciliar'] as ChrismedModality[])).filter((m): m is ChrismedModality => m !== 'retorno');
  const unitsForModality = modality === 'telemedicina' ? CHRISMED_UNITS.filter((u) => u.slug === 'telemedicina') : modality === 'domiciliar' ? CHRISMED_UNITS.filter((u) => u.slug === 'domiciliar') : modality === 'ocupacional' || modality === 'pericia' ? CHRISMED_UNITS.filter((u) => u.slug === 'copacabana') : CHRISMED_UNITS.filter((u) => doctor?.unitSlugs.includes(u.slug) ?? true);
  const selectedDay = selectedDayIso ? calendar.find((d) => d.iso === selectedDayIso) ?? null : null;
  const selectedSlot = selectedDay && selectedSlotId ? selectedDay.slots.find((s) => s.id === selectedSlotId) ?? null : null;
  const selectedSlotLabel = selectedSlot ? formatSlotLabel(selectedSlot) : selectedTime ?? '—';

  async function handlePay() {
    if (!currentOffering || !doctor || !selectedDayIso || !selectedTime || !selectedSlot || !acceptedTerms) { toast.error('Revise horário, profissional e aceite dos termos antes de continuar.'); return; }
    if (!isValidCPF(patient.doc)) { toast.error('CPF inválido. Confira os números informados antes de continuar.'); setStep('identify'); return; }
    setSubmitting(true);
    try {
      const requestId = crypto.randomUUID();
      const { data: holdData, error: holdError } = await (supabase as any).rpc('create_chrismed_booking_hold', { p_request: {
        offeringId: currentOffering.id, professionalSlug: doctor.slug, startsAt: selectedSlot.id,
        patientName: `${patient.first_name} ${patient.last_name}`.trim(), patientEmail: patient.email, patientPhone: patient.phone, patientDocument: patient.doc,
        accepted: true, termsVersion: '2026-08-08', privacyVersion: '2026-08-08', locale: 'pt-BR', requestId,
      }});
      if (holdError) throw new Error('Não foi possível reservar temporariamente esse horário. Confira seus dados e tente novamente.');
      const hold = Array.isArray(holdData) ? holdData[0] : holdData;
      if (!hold?.hold_token) throw new Error('Não foi possível reservar esse horário.');
      setHoldToken(hold.hold_token);
      const expiry = hold.hold_expires_at || new Date(Date.now() + CHECKOUT_HOLD_SECONDS * 1000).toISOString();
      setHoldExpiresAt(expiry); setHoldSecondsRemaining(Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 1000))); setPollStatus('pending');
      const { data, error } = await supabase.functions.invoke('mpago-create-payment', { body: {
        company_id: CHRISMED_COMPANY_ID, payment_method: 'pix', hold_token: hold.hold_token,
        payer: { email: patient.email, first_name: patient.first_name, last_name: patient.last_name || undefined, identification: { type: 'CPF', number: patient.doc.replace(/\D/g, '') } },
      }});
      if (error || data?.error) throw new Error('Não foi possível gerar o pagamento agora. Confira seus dados e tente novamente.');
      setPixResult({ qr_code: data.mp.qr_code, qr_code_base64: data.mp.qr_code_base64, payment_id: data.payment.id }); setStep('payment');
    } catch { toast.error('Não foi possível gerar o pagamento agora. Confira seus dados e tente novamente.'); }
    finally { setSubmitting(false); }
  }

  const isCare360 = specialty?.slug === 'care-360' || modality === 'telemedicina' || modality === 'domiciliar';
  const stepOrder: Step[] = isCare360 ? ['modality','schedule','identify','confirm','payment','done'] : ['modality','specialty','doctor','schedule','identify','confirm','payment','done'];
  const stepLabels = isCare360 ? ['Modalidade','Data e horário','Identificação','Confirmação','Pagamento','Pronto'] : ['Modalidade','Especialidade','Médico','Data e horário','Identificação','Confirmação','Pagamento','Pronto'];
  const stepIndex = Math.max(0, stepOrder.indexOf(step)); const canGoBack = stepIndex > 0 && step !== 'done' && step !== 'payment';
  function goBack() { if (stepIndex > 0) setStep(stepOrder[stepIndex - 1]); }
  function restartAfterExpiry() { setPixResult(null); setHoldToken(null); setHoldExpiresAt(null); setHoldSecondsRemaining(CHECKOUT_HOLD_SECONDS); setPollStatus('pending'); setSelectedDayIso(null); setSelectedTime(null); setSelectedSlotId(null); setStep('schedule'); toast.info('O bloqueio temporário expirou. Escolha novamente um horário disponível.'); }
  const stickySummary = [doctor?.name, specialty?.name, modality ? MODALITY_META[modality].label : null, selectedSlot ? formatSlotLabel(selectedSlot) : selectedTime].filter(Boolean).join(' · ');

  return <ChrismedShell variant="minimal"><div className="mx-auto w-full max-w-5xl px-4 md:px-6 py-10 pb-32 sm:pb-10">
    <div className="mb-8"><div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--chrismed-mist)] flex-wrap">{stepLabels.map((label, i) => <span key={label} className="flex items-center gap-2"><span className={i <= stepIndex ? 'text-[var(--chrismed-ink)] font-medium' : ''}>{i + 1}. {label}</span>{i < stepLabels.length - 1 && <ChevronRight className="h-3 w-3 opacity-40" />}</span>)}</div><div className="mt-3 h-1 rounded-full bg-[var(--chrismed-sand)]"><div className="h-full rounded-full bg-[var(--chrismed-ink)] transition-all" style={{ width: `${((stepIndex + 1) / stepLabels.length) * 100}%` }} /></div></div>

    {isCare360 && step !== 'done' && step !== 'modality' && <div className="mb-6 rounded-lg border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] px-4 py-3 text-sm text-[var(--chrismed-ink)]"><div className="text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)] mb-1">Atendimento 360° · {modality === 'domiciliar' ? 'Domiciliar' : 'Teleconsulta'}</div><p className="leading-relaxed">Nesta modalidade, a Dra. Christiane Alencar avalia você com o olhar integrado das três especialidades — <strong>Gastroenterologia</strong>, <strong>Hepatologia</strong> e <strong>Clínica Médica</strong> — sem que você precise escolher uma antes. É o mesmo médico, com diagnóstico 360°.</p></div>}

    {step === 'modality' && <section aria-labelledby="s1"><h1 id="s1" className="chrismed-serif text-3xl md:text-4xl text-[var(--chrismed-ink)]">Como você quer ser atendido?</h1><p className="mt-2 text-[var(--chrismed-graphite)]">Escolha a modalidade. Todas usam a agenda única do profissional: um horário ocupado por um serviço fica indisponível para qualquer outro serviço durante todo o intervalo.</p><div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{(['telemedicina','presencial','domiciliar'] as ChrismedModality[]).map((m) => { const meta = MODALITY_META[m], Icon = meta.icon, badge = m === 'presencial' ? 'Escolha a especialidade' : 'Visão 360° · 3 especialidades', label = m === 'presencial' ? 'Presencial no Consultório' : meta.label; return <button key={m} type="button" onClick={() => { if (m === 'telemedicina' || m === 'domiciliar') return applyCare360(m); setSelectedOfferingSlug(null); setModality('presencial'); setSpecialty(null); setDoctor(null); setUnit(null); setStep('specialty'); }} className={`${m === 'telemedicina' ? 'order-1' : m === 'presencial' ? 'order-2' : 'order-3'} text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)] hover:shadow-sm transition-all`}><div className="h-11 w-11 rounded-lg bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div><div className="chrismed-serif text-lg text-[var(--chrismed-ink)]">{label}</div><div className="text-sm text-[var(--chrismed-graphite)] mt-1">{meta.sub}</div><div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--chrismed-champagne-deep)]">{badge}</div></button>; })}</div>
      <div className="mt-10 rounded-xl border border-[var(--chrismed-champagne)] bg-[var(--chrismed-bone)] p-5"><div className="text-[10px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)] mb-1">Continuidade de cuidado</div><h3 className="chrismed-serif text-lg text-[var(--chrismed-ink)]">Fez uma Teleconsulta que evoluiu para Consulta Presencial?</h3><p className="text-sm text-[var(--chrismed-graphite)] mt-2 leading-relaxed">Se a Dra. Christiane indicar evolução para atendimento presencial, a recepção orienta a continuidade e a diferença aplicável de valor.</p><Button variant="outline" className="mt-4 border-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ink)]" onClick={() => { window.dispatchEvent(new CustomEvent('chrismed:reception:notify', { detail: { reason: 'tele_to_presencial_upgrade' } })); openOliver(); toast.success('Recepção CHRISMED avisada.'); }}>Avisar a recepção CHRISMED</Button></div>
    </section>}

    {step === 'specialty' && (() => { const base = doctor ? CHRISMED_SPECIALTIES.filter((s) => doctor.specialtySlugs.includes(s.slug)) : CHRISMED_SPECIALTIES; const specialtiesToShow = base.filter((s) => ['gastroenterologia','hepatologia','clinica-medica'].includes(s.slug)); return <section aria-labelledby="s2"><button onClick={() => setStep('modality')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar modalidade</button><h2 id="s2" className="chrismed-serif text-3xl md:text-4xl text-[var(--chrismed-ink)]">Escolha a especialidade</h2><p className="mt-2 text-[var(--chrismed-graphite)]">Consulta presencial no consultório em Copacabana.</p><div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{specialtiesToShow.map((sp) => { const Icon = SPECIALTY_ICON[sp.icon]; return <button key={sp.slug} type="button" onClick={() => { setSpecialty(sp); setStep('doctor'); }} className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)]"><div className="h-11 w-11 rounded-lg bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div><div className="chrismed-serif text-lg text-[var(--chrismed-ink)]">{sp.name}</div><div className="text-sm text-[var(--chrismed-graphite)] mt-1">{sp.short}</div></button>; })}</div></section>; })()}

    {step === 'doctor' && specialty && <section aria-labelledby="s3"><button onClick={() => setStep('specialty')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar especialidade</button><h2 id="s3" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Escolha o médico</h2><p className="mt-2 text-[var(--chrismed-graphite)]">Profissionais que atendem <strong>{specialty.name}</strong>.</p>{doctorsForSpecialty.length === 0 ? <EmptyState message="Nenhum médico disponível para esta especialidade no momento." onOliver={openOliver} /> : <div className="mt-8 grid md:grid-cols-2 gap-4">{doctorsForSpecialty.map((d) => <button key={d.slug} type="button" onClick={() => { setDoctor(d); const autoUnit = CHRISMED_UNITS.find((u) => u.slug === 'copacabana'); if (autoUnit) setUnit(autoUnit); setStep('schedule'); }} className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5 hover:border-[var(--chrismed-champagne-deep)]"><div className="chrismed-serif text-xl text-[var(--chrismed-ink)]">{d.name}</div><div className="text-xs uppercase tracking-[0.14em] text-[var(--chrismed-mist)] mt-1">{d.title}</div><div className="text-xs text-[var(--chrismed-mist)] mt-1">{d.crm}</div><p className="text-sm text-[var(--chrismed-graphite)] mt-3">{d.bio}</p></button>)}</div>}</section>}

    {step === 'unit' && modality && <section aria-labelledby="s4"><button onClick={() => setStep('doctor')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar médico</button><h2 id="s4" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Onde será o atendimento?</h2><div className="mt-8 grid md:grid-cols-2 gap-4">{unitsForModality.map((u) => <button key={u.slug} type="button" onClick={() => { setUnit(u); setStep('schedule'); }} className="text-left rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5"><MapPin className="h-5 w-5 mb-3" /><div className="chrismed-serif text-lg">{u.name}</div><div className="text-sm text-[var(--chrismed-graphite)] mt-1">{u.address}</div></button>)}</div></section>}

    {step === 'schedule' && unit && <section aria-labelledby="s5"><button onClick={() => isCare360 ? setStep('modality') : setStep('doctor')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← {isCare360 ? 'Trocar modalidade' : 'Trocar médico'}</button><h2 id="s5" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Escolha data e horário</h2><p className="mt-2 text-[var(--chrismed-graphite)]">A disponibilidade já considera todos os serviços do mesmo médico e suas respectivas durações.</p><div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6"><MockCalendar calendar={calendar} monthOffset={monthOffset} onMonth={setMonthOffset} selectedIso={selectedDayIso} onPick={(iso) => { setSelectedDayIso(iso); setSelectedTime(null); setSelectedSlotId(null); }} /><div className="rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--chrismed-mist)] mb-3">Horários disponíveis {modality ? `· ${MODALITY_META[modality].label}` : ''}</div>{availabilityStats.availableSlots === 0 && <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"><strong>Sem disponibilidade nas próximas semanas.</strong> Fale com Oliver para lista de espera ou outra modalidade.</div>}{!selectedDay && availabilityStats.availableSlots > 0 && <p className="text-sm text-[var(--chrismed-mist)]">Selecione uma data. {availabilityStats.availableDays} dia(s) com agenda aberta.</p>}{selectedDay?.state === 'empty' && <p className="text-sm text-[var(--chrismed-mist)]">Sem agenda neste dia.</p>}{selectedDay && selectedDay.slots.length > 0 && <div className="grid grid-cols-2 gap-2">{selectedDay.slots.map((s) => <SlotButton key={s.id} slot={s} selected={selectedSlotId === s.id} onPick={() => { setSelectedTime(s.time); setSelectedSlotId(s.id); }} />)}</div>}<Button className="w-full mt-5 bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]" disabled={!selectedDayIso || !selectedSlotId || selectedSlot?.state !== 'available'} onClick={() => setStep('identify')}>Continuar</Button><p className="text-[11px] text-[var(--chrismed-mist)] mt-3">O horário só é reservado definitivamente após a aprovação do pagamento.</p></div></div></section>}

    {step === 'identify' && <section aria-labelledby="s6" className="max-w-2xl"><button onClick={() => setStep('schedule')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Trocar horário</button><h2 id="s6" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Sua identificação</h2><p className="mt-2 text-[var(--chrismed-graphite)]">Pedimos apenas os dados necessários para reservar e identificar o pagamento.</p><Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]"><CardContent className="p-6 grid gap-4"><div className="grid sm:grid-cols-2 gap-3"><div><Label htmlFor="fn">Nome*</Label><Input id="fn" value={patient.first_name} onChange={(e) => setPatient({ ...patient, first_name: e.target.value })} /></div><div><Label htmlFor="ln">Sobrenome</Label><Input id="ln" value={patient.last_name} onChange={(e) => setPatient({ ...patient, last_name: e.target.value })} /></div></div><div><Label htmlFor="em">E-mail*</Label><Input id="em" type="email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} />{patient.email && !isValidEmail(patient.email) && <p className="text-xs text-red-600 mt-1">E-mail inválido. Confira o endereço informado.</p>}</div><div className="grid sm:grid-cols-2 gap-3"><div><Label htmlFor="doc">CPF*</Label><Input id="doc" inputMode="numeric" value={patient.doc} onChange={(e) => setPatient({ ...patient, doc: maskCPF(e.target.value) })} placeholder="000.000.000-00" aria-invalid={patient.doc ? !isValidCPF(patient.doc) : undefined} />{patient.doc && !isValidCPF(patient.doc) && <p className="text-xs text-red-600 mt-1">CPF inválido — não é possível avançar. Confira os 11 números e corrija o CPF antes de continuar.</p>}</div><div><Label htmlFor="ph">Telefone</Label><Input id="ph" inputMode="tel" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: maskPhone(e.target.value) })} /></div></div><div><Label htmlFor="cep">CEP (opcional)</Label><Input id="cep" inputMode="numeric" value={patient.cep} onChange={(e) => setPatient({ ...patient, cep: maskCEP(e.target.value) })} placeholder="00000-000" /></div><div className="rounded-lg border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] px-4 py-3 text-xs leading-relaxed text-[var(--chrismed-graphite)]"><strong>Antes de avançar:</strong> nome, e-mail e CPF precisam estar válidos. Se houver erro, corrija o campo indicado. O Impulsionito e o Oliver estão disponíveis para orientar você.</div><Button className="w-full bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]" onClick={() => { if (!patient.first_name.trim()) { toast.error('Informe seu nome para continuar.'); document.getElementById('fn')?.focus(); return; } if (!isValidEmail(patient.email)) { toast.error('E-mail inválido. Confira o endereço completo antes de continuar.'); document.getElementById('em')?.focus(); return; } if (!isValidCPF(patient.doc)) { toast.error('CPF inválido. Confira os 11 números e corrija o CPF antes de continuar.'); document.getElementById('doc')?.focus(); return; } setStep('confirm'); }}>Validar dados e continuar</Button><Button type="button" variant="outline" className="w-full" onClick={openOliver}>Preciso de ajuda</Button></CardContent></Card></section>}

    {step === 'confirm' && specialty && doctor && modality && unit && <section aria-labelledby="s7" className="max-w-2xl"><button onClick={() => setStep('identify')} className="text-sm text-[var(--chrismed-ink)] hover:underline mb-3">← Voltar</button><h2 id="s7" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Confirme os dados</h2><Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]"><CardContent className="p-6 space-y-3 text-sm"><Row label="Especialidade" value={isCare360 ? `Atendimento 360° — ${CARE_360_LABEL}` : specialty.name} /><Row label="Médico" value={doctor.name} /><Row label="Modalidade" value={MODALITY_META[modality].label} /><Row label="Unidade" value={unit.name} /><Row label="Data" value={selectedDayIso ?? '—'} /><Row label="Horário" value={selectedSlotLabel} /><Row label="Paciente" value={`${patient.first_name} ${patient.last_name}`.trim()} /><Row label="E-mail" value={patient.email} /><Row label="CPF" value={patient.doc} /><hr className="border-[var(--chrismed-sand)]" />{loadingOfferings ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando preço...</div> : currentOffering ? <><Row label="Duração" value={`${currentOffering.duration_minutes} minutos`} /><Row label="Valor" value={currentOffering.price_cents === 0 ? 'Cortesia' : `R$ ${(currentOffering.price_cents / 100).toFixed(2).replace('.', ',')}`} /></> : <p className="text-xs text-amber-700">Preço não configurado.</p>}<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Importante:</strong> ao iniciar o checkout, bloquearemos este horário temporariamente por <strong>5 minutos</strong>. A reserva definitiva só é confirmada quando o pagamento for aprovado. Se o prazo expirar, o horário volta automaticamente para a agenda.</div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--chrismed-sand)] bg-white p-4"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--chrismed-ink)]" /><span>Li e aceito os <Link to="/termos" className="underline font-medium">Termos de Uso e Atendimento</Link>, a política de cancelamento e a <Link to="/privacidade" className="underline font-medium">Política de Privacidade e LGPD</Link>. O pagamento confirma a reserva; cancelamentos não geram estorno automático e seguem os termos vigentes.</span></label><Button className="w-full bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]" disabled={submitting || !acceptedTerms || !currentOffering || !isValidCPF(patient.doc)} onClick={handlePay}>{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparando pagamento...</> : 'Iniciar checkout — bloquear por 5 minutos'}</Button></CardContent></Card></section>}

    {step === 'payment' && pixResult && <section aria-labelledby="s8" className="max-w-2xl mx-auto"><div className="text-center"><div className="mx-auto h-14 w-14 rounded-full bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center mb-4"><Clock3 className="h-7 w-7" /></div><h2 id="s8" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Pagamento PIX</h2><p className="mt-2 text-[var(--chrismed-graphite)]">Seu horário está bloqueado temporariamente enquanto aguardamos o pagamento.</p><div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--chrismed-champagne)] bg-[var(--chrismed-bone)] px-4 py-2"><Clock3 className="h-4 w-4" /><span className="font-mono text-xl font-semibold">{formatCountdown(holdSecondsRemaining)}</span></div>{holdExpired && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="inline h-4 w-4 mr-1" /> O tempo expirou e o horário foi liberado. Escolha outro horário para tentar novamente.</div>}</div>
      {!holdExpired ? <Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]"><CardContent className="p-6 space-y-4">{pixResult.qr_code_base64 && <img src={`data:image/png;base64,${pixResult.qr_code_base64}`} alt="QR Code PIX" className="mx-auto rounded-lg border bg-[var(--chrismed-ivory)] p-3" width={256} height={256} />}{pixResult.qr_code && <div className="space-y-1"><Label>Código PIX copia-e-cola</Label><div className="flex gap-2"><Input readOnly value={pixResult.qr_code} className="font-mono text-xs" /><Button variant="outline" size="icon" aria-label="Copiar código PIX" onClick={() => { navigator.clipboard.writeText(pixResult.qr_code); toast.success('Copiado!'); }}><Copy className="h-4 w-4" /></Button></div></div>}<div className="flex items-center gap-2 text-sm text-[var(--chrismed-graphite)] justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Aguardando confirmação do pagamento...</div><p className="text-center text-xs text-[var(--chrismed-mist)]">Não feche esta tela. Se o pagamento não for aprovado dentro do prazo, o horário volta à disponibilidade e poderemos enviar uma mensagem de recuperação do checkout.</p><Button variant="outline" className="w-full" onClick={() => { setPixResult(null); setHoldToken(null); setHoldExpiresAt(null); setPollStatus('pending'); setStep('confirm'); }}>Cancelar e voltar</Button></CardContent></Card> : <Button className="mt-5 w-full bg-[var(--chrismed-ink)] text-white" onClick={restartAfterExpiry}>Escolher outro horário</Button>}
    </section>}

    {step === 'done' && <section aria-labelledby="s9" className="max-w-2xl mx-auto"><div className="text-center"><div className="mx-auto h-16 w-16 rounded-full bg-[var(--chrismed-sand)] text-[var(--chrismed-ink)] flex items-center justify-center mb-4"><CheckCircle2 className="h-9 w-9" /></div><h2 id="s9" className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Agendamento confirmado</h2><p className="mt-3 text-[var(--chrismed-graphite)]">Pagamento aprovado e horário reservado em seu nome. O resumo e as instruções serão enviados para <strong>{patient.email || 'seu e-mail'}</strong>.</p></div><Card className="mt-6 border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]"><CardHeader><CardTitle className="chrismed-serif text-xl">Resumo da sua consulta</CardTitle><CardDescription>Guarde estes dados.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><Row label="Paciente" value={`${patient.first_name} ${patient.last_name}`.trim() || '—'} /><Row label="Modalidade" value={modality ? MODALITY_META[modality].label : '—'} /><Row label="Especialidade" value={isCare360 ? `Atendimento 360° — ${CARE_360_LABEL}` : specialty?.name ?? '—'} /><Row label="Médico(a)" value={doctor?.name ?? '—'} /><Row label="Unidade" value={unit?.name ?? '—'} /><Row label="Data" value={selectedDayIso ?? '—'} /><Row label="Horário" value={selectedSlotLabel} />{currentOffering && <><Row label="Duração" value={`${currentOffering.duration_minutes} minutos`} /><Row label="Valor pago" value={currentOffering.price_cents === 0 ? 'Cortesia' : `R$ ${(currentOffering.price_cents / 100).toFixed(2).replace('.', ',')}`} /></>}</CardContent></Card><Card className="mt-4 border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]"><CardHeader><CardTitle className="chrismed-serif text-lg">Próximos passos</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-[var(--chrismed-graphite)]">{modality === 'telemedicina' && <p>1. Você receberá o link da teleconsulta pelos canais cadastrados antes do horário.</p>}{modality === 'presencial' && <p>1. Chegue com antecedência em {unit?.address || 'nosso consultório em Copacabana'} e traga documento com foto e exames anteriores.</p>}{modality === 'domiciliar' && <p>1. A equipe confirmará endereço e logística da visita domiciliar.</p>}<p>2. Alterações e cancelamentos seguem os termos vigentes da CHRISMED; não há estorno automático pelo simples cancelamento.</p><p>3. Após seu check-in, você recebe boas-vindas e, 24 horas depois, uma pesquisa de experiência.</p></CardContent></Card><div className="mt-6 flex gap-3 justify-center flex-wrap"><Button className="bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]" onClick={() => window.location.reload()}>Agendar outra consulta</Button><Button variant="outline" onClick={openOliver}>Falar com Oliver</Button></div></section>}

    {loadingCalendar && <p className="mt-12 text-center text-sm text-[var(--chrismed-ink)]/70">Consultando disponibilidade segura…</p>}
  </div>
  {step !== 'done' && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]/95 backdrop-blur px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden" role="region" aria-label="Progresso do agendamento"><div className="h-1 rounded-full bg-[var(--chrismed-sand)] mb-2"><div className="h-full rounded-full bg-[var(--chrismed-ink)] transition-all" style={{ width: `${((stepIndex + 1) / stepLabels.length) * 100}%` }} /></div><div className="flex items-center justify-between gap-2"><button type="button" onClick={goBack} disabled={!canGoBack} className="min-h-11 min-w-11 -ml-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-ink)] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /> Voltar</button><div className="flex-1 min-w-0 text-center"><div className="text-[9px] uppercase tracking-[0.16em] text-[var(--chrismed-mist)]">Passo {stepIndex + 1}/{stepLabels.length}</div><div className="text-[11px] text-[var(--chrismed-ink)] truncate font-medium">{stickySummary || stepLabels[stepIndex]}</div></div><button type="button" onClick={openOliver} className="min-h-11 min-w-11 -mr-1 text-[11px] uppercase tracking-[0.14em] text-[var(--chrismed-champagne-deep)] font-medium">Oliver</button></div></div>}
  </ChrismedShell>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><span className="text-[var(--chrismed-mist)]">{label}</span><span className="text-[var(--chrismed-ink)] font-medium text-right">{value}</span></div>; }
function EmptyState({ message, onOliver }: { message: string; onOliver: () => void }) { return <div className="mt-8 rounded-xl border border-dashed border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-8 text-center"><p className="text-[var(--chrismed-graphite)]">{message}</p><Button variant="outline" className="mt-4" onClick={onOliver}>Falar com Oliver</Button></div>; }
function SlotButton({ slot, selected, onPick }: { slot: ChrismedSlot; selected: boolean; onPick: () => void }) {
  const disabled = slot.state !== 'available', suffix = slot.occurrence > 1 ? ` · ${slot.occurrence}ª janela` : '', visibleTime = `${slot.time}${suffix}`;
  const base = 'rounded-md py-2 text-sm border transition-colors focus:outline-none min-h-12';
  if (slot.state === 'held') return <button disabled className={`${base} border-[var(--chrismed-champagne)] bg-[var(--chrismed-bone)] text-[var(--chrismed-champagne-deep)]`}>{visibleTime} · reservado</button>;
  if (disabled) return <button disabled className={`${base} border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)]/40 line-through`}>{visibleTime}</button>;
  return <button onClick={onPick} className={`${base} ${selected ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]' : 'border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] text-[var(--chrismed-ink)]'}`}><span className="block leading-tight">{visibleTime}</span><span className="block text-[10px] opacity-70">até {slot.endTime}</span></button>;
}
function MockCalendar({ calendar, monthOffset, onMonth, selectedIso, onPick }: { calendar: ChrismedDay[]; monthOffset: number; onMonth: (n: number) => void; selectedIso: string | null; onPick: (iso: string) => void; }) {
  const today = new Date(); today.setHours(0,0,0,0); const viewDate = new Date(today.getFullYear(), today.getMonth()+monthOffset,1); const monthLabel = viewDate.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}), firstDow=viewDate.getDay(), daysInMonth=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,0).getDate(), dayMap=new Map(calendar.map((d)=>[d.iso,d]));
  const cells:(ChrismedDay|null)[]=[]; for(let i=0;i<firstDow;i++)cells.push(null); for(let d=1;d<=daysInMonth;d++){const iso=new Date(viewDate.getFullYear(),viewDate.getMonth(),d).toISOString().slice(0,10);cells.push(dayMap.get(iso)??{iso,state:'empty',slots:[]});}
  return <div className="rounded-xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-5"><div className="flex items-center justify-between mb-4"><Button variant="ghost" size="icon" onClick={()=>onMonth(monthOffset-1)} disabled={monthOffset===0}><ChevronLeft className="h-4 w-4"/></Button><div className="chrismed-serif capitalize">{monthLabel}</div><Button variant="ghost" size="icon" onClick={()=>onMonth(monthOffset+1)}><ChevronRight className="h-4 w-4"/></Button></div><div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-[var(--chrismed-ink)]/50 mb-2">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d)=><div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 gap-1">{cells.map((cell,i)=>{if(!cell)return <div key={i}/>;const d=new Date(cell.iso+'T00:00:00'),disabled=d<today||cell.state!=='available',isSelected=selectedIso===cell.iso;return <button key={cell.iso} disabled={disabled} onClick={()=>onPick(cell.iso)} className={['aspect-square rounded-md text-sm transition-colors',isSelected?'bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)] font-medium':disabled?'text-[var(--chrismed-ink)]/25 cursor-not-allowed':'text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-bone)]'].join(' ')}>{d.getDate()}</button>;})}</div></div>;
}