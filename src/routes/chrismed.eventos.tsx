import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, Ticket, Users } from 'lucide-react';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { listPublicChrismedEvents, registerForChrismedEvent, type PublicChrismedEvent } from '@/lib/chrismed-events.functions';

export const Route = createFileRoute('/chrismed/eventos')({
  head: () => ({ meta: [
    { title: 'Eventos CHRISMED · Agenda e inscrições' },
    { name: 'description', content: 'Agenda oficial e inscrições para eventos CHRISMED.' },
    { property: 'og:title', content: 'Eventos CHRISMED' },
    { property: 'og:description', content: 'Consulte eventos CHRISMED, disponibilidade e faça sua inscrição.' },
  ] }),
  component: EventosPage,
});

const COPY = {
  pt: { eyebrow: 'Agenda de eventos', title: 'Conhecimento, prevenção e cuidado em encontros CHRISMED.', lead: 'Consulte a programação oficial, veja a disponibilidade e faça sua inscrição. Esta agenda é exclusiva para eventos e não agenda consultas.', emptyTitle: 'Nenhum evento publicado neste momento.', emptyText: 'Novas programações serão exibidas aqui após confirmação da equipe CHRISMED.', contact: 'Falar sobre eventos', register: 'Inscrever-se', closed: 'Inscrições encerradas', waitlist: 'Lista de espera', confirmed: 'Inscrição confirmada', name: 'Nome completo', email: 'E-mail', phone: 'Telefone', quantity: 'Participantes', submit: 'Confirmar inscrição', consent: 'Ao confirmar, autorizo o uso destes dados exclusivamente para gestão e comunicação deste evento.', seats: 'vagas disponíveis' },
  en: { eyebrow: 'Events calendar', title: 'Knowledge, prevention and care in CHRISMED events.', lead: 'See the official calendar, availability and register. This calendar is exclusively for events and does not book medical appointments.', emptyTitle: 'No events published at this time.', emptyText: 'New dates will appear after confirmation by the CHRISMED team.', contact: 'Talk about events', register: 'Register', closed: 'Registration closed', waitlist: 'Waitlist', confirmed: 'Registration confirmed', name: 'Full name', email: 'Email', phone: 'Phone', quantity: 'Attendees', submit: 'Confirm registration', consent: 'By confirming, I authorize use of this data exclusively to manage and communicate about this event.', seats: 'seats available' },
  es: { eyebrow: 'Agenda de eventos', title: 'Conocimiento, prevención y cuidado en eventos CHRISMED.', lead: 'Consulte la agenda oficial, la disponibilidad e inscríbase. Esta agenda es exclusiva para eventos y no agenda consultas médicas.', emptyTitle: 'No hay eventos publicados en este momento.', emptyText: 'Las nuevas fechas aparecerán tras confirmación del equipo CHRISMED.', contact: 'Hablar sobre eventos', register: 'Inscribirse', closed: 'Inscripciones cerradas', waitlist: 'Lista de espera', confirmed: 'Inscripción confirmada', name: 'Nombre completo', email: 'Email', phone: 'Teléfono', quantity: 'Participantes', submit: 'Confirmar inscripción', consent: 'Al confirmar, autorizo el uso de estos datos exclusivamente para gestionar y comunicar sobre este evento.', seats: 'plazas disponibles' },
} as const;

function EventosPage() {
  const lang = useLang();
  const t = COPY[lang];
  const list = useServerFn(listPublicChrismedEvents);
  const { data: events = [], isLoading, isError } = useQuery({ queryKey: ['chrismed-public-events'], queryFn: () => list() });

  return <ChrismedShell><main className="chrismed-page-mustard min-h-[70vh]">
    <section className="border-b border-[var(--chrismed-mustard-deep)]/20"><div className="container max-w-5xl py-20 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--chrismed-forest-deep)]">{t.eyebrow}</p>
      <h1 className="chrismed-serif mt-5 max-w-4xl text-4xl leading-[1.03] md:text-6xl">{t.title}</h1>
      <p className="chrismed-lede mt-6 max-w-3xl text-lg leading-relaxed">{t.lead}</p>
    </div></section>
    <section className="container max-w-5xl py-14 md:py-20">
      {isLoading && <div className="rounded-[2rem] bg-white/70 p-10 text-[var(--chrismed-forest-deep)]">Carregando agenda de eventos…</div>}
      {isError && <EmptyState title="Agenda temporariamente indisponível" text="Fale com a equipe CHRISMED para receber informações sobre os próximos eventos." contact={t.contact} />}
      {!isLoading && !isError && events.length === 0 && <EmptyState title={t.emptyTitle} text={t.emptyText} contact={t.contact} />}
      <div className="space-y-8">{events.map((event) => <EventCard key={event.id} event={event} copy={t} lang={lang} />)}</div>
    </section>
  </main></ChrismedShell>;
}

function EmptyState({ title, text, contact }: { title: string; text: string; contact: string }) {
  return <div className="rounded-[2rem] border border-[var(--chrismed-mustard-deep)]/30 bg-[var(--chrismed-ivory)] p-8 shadow-[var(--chrismed-shadow-md)] md:p-12">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--chrismed-forest-deep)] text-[var(--chrismed-amber-soft)]"><CalendarDays aria-hidden="true" className="h-6 w-6" /></div>
    <h2 className="chrismed-serif mt-7 text-3xl text-[var(--chrismed-forest-deep)] md:text-4xl">{title}</h2>
    <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--chrismed-graphite)]">{text}</p>
    <Link to="/chrismed/contato" className="chrismed-cta mt-8 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">{contact}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
  </div>;
}

function EventCard({ event, copy, lang }: { event: PublicChrismedEvent; copy: typeof COPY[keyof typeof COPY]; lang: 'pt' | 'en' | 'es' }) {
  const register = useServerFn(registerForChrismedEvent);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', quantity: 1, website: '' });
  const mutation = useMutation({
    mutationFn: () => register({ data: { eventId: event.id, ...form } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chrismed-public-events'] }),
  });
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(event.startsAt));
  const canRegister = event.registrationOpen;

  return <article className="overflow-hidden rounded-[2rem] border border-[var(--chrismed-mustard-deep)]/30 bg-[var(--chrismed-ivory)] shadow-[var(--chrismed-shadow-md)]">
    {event.coverUrl && <img src={event.coverUrl} alt="" className="h-56 w-full object-cover md:h-72" />}
    <div className="p-7 md:p-10">
      <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--chrismed-forest-deep)]">
        <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{date}</span>
        {(event.venueName || event.city) && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{[event.venueName, event.city].filter(Boolean).join(' · ')}</span>}
      </div>
      <h2 className="chrismed-serif mt-5 text-3xl text-[var(--chrismed-forest-deep)] md:text-4xl">{event.title}</h2>
      {(event.summary || event.description) && <p className="mt-4 max-w-3xl leading-relaxed text-[var(--chrismed-graphite)]">{event.summary || event.description}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--chrismed-forest-deep)]"><Users className="h-4 w-4" />{event.seatsRemaining} {copy.seats}</span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--chrismed-forest-deep)]"><Ticket className="h-4 w-4" />{event.priceCents === 0 ? 'Gratuito' : new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(event.priceCents / 100)}</span>
      </div>
      {!mutation.data && <button type="button" disabled={!canRegister} onClick={() => setOpen((value) => !value)} className="chrismed-cta mt-7 inline-flex min-h-11 items-center rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{canRegister ? copy.register : copy.closed}</button>}
      {open && !mutation.data && <form className="mt-8 grid gap-4 border-t border-[var(--chrismed-sand)] pt-7 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <label className="text-sm font-semibold text-[var(--chrismed-forest-deep)]">{copy.name}<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
        <label className="text-sm font-semibold text-[var(--chrismed-forest-deep)]">{copy.email}<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
        <label className="text-sm font-semibold text-[var(--chrismed-forest-deep)]">{copy.phone}<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
        <label className="text-sm font-semibold text-[var(--chrismed-forest-deep)]">{copy.quantity}<input required type="number" min={1} max={6} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
        <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" />
        <p className="text-xs leading-relaxed text-[var(--chrismed-graphite)] md:col-span-2">{copy.consent}</p>
        {mutation.error && <p role="alert" className="text-sm font-semibold text-red-800 md:col-span-2">{mutation.error.message}</p>}
        <button disabled={mutation.isPending} className="chrismed-cta inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold md:w-fit">{mutation.isPending ? 'Confirmando…' : copy.submit}</button>
      </form>}
      {mutation.data && <div role="status" className="mt-8 rounded-2xl bg-[var(--chrismed-forest-deep)] p-6 text-white"><CheckCircle2 className="h-7 w-7 text-[var(--chrismed-amber-soft)]" /><h3 className="mt-3 text-xl font-semibold text-[var(--chrismed-amber-soft)]">{mutation.data.status === 'confirmed' ? copy.confirmed : copy.waitlist}</h3><p className="mt-2 text-white/90">Código: <strong>{mutation.data.code}</strong></p></div>}
    </div>
  </article>;
}
