import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, History, MapPin, Sparkles, Users } from "lucide-react";
import { ChrismedShell, useLang } from "@/components/chrismed/ChrismedShell";
import { listPublicChrismedEvents, registerForChrismedEvent, type PublicChrismedEvent } from "@/lib/chrismed-events";

export const Route = createFileRoute("/chrismed/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos CHRISMED · Agenda científica e participação profissional" },
      { name: "description", content: "Agenda oficial CHRISMED para profissionais de saúde, com solicitação individual de participação, convites e credenciais." },
      { property: "og:title", content: "Eventos CHRISMED" },
      { property: "og:description", content: "Conhecimento, atualização e relacionamento em uma agenda exclusiva para profissionais de saúde." },
    ],
  }),
  component: EventosPage,
});

const COPY = {
  pt: {
    eyebrow: "Agenda científica CHRISMED", title: "Encontros que transformam informação em cuidado.",
    lead: "Uma agenda de atualização, relacionamento e experiências para profissionais de saúde. Consulte os próximos encontros e solicite sua participação individual.",
    next: "Próximo evento", upcoming: "Próximos eventos", history: "Eventos anteriores", agenda: "Agenda",
    agendaText: "Datas, horários, locais, contratantes e disponibilidade em uma visão simples e objetiva.",
    emptyTitle: "Nenhum evento publicado neste momento.", emptyText: "Novas programações serão exibidas aqui após confirmação da equipe CHRISMED.",
    contact: "Falar sobre eventos", register: "Solicitar participação", closed: "Solicitações encerradas", past: "Evento realizado",
    pending: "Solicitação recebida", pendingText: "Sua vaga fica reservada por até 90 minutos enquanto a CHRISMED analisa sua solicitação. Você receberá a confirmação pelos canais cadastrados após a aprovação.",
    name: "Nome completo", email: "E-mail profissional", phone: "Telefone / WhatsApp", referral: "Indicar outro profissional de saúde (opcional)",
    referralHelp: "A indicação não ocupa vaga. O profissional indicado receberá um convite para fazer a própria solicitação.",
    submit: "Enviar solicitação", sending: "Enviando…", consent: "Ao enviar, autorizo o uso destes dados exclusivamente para gestão e comunicação deste evento.",
    seats: "vagas disponíveis", professional: "Participação para profissionais de saúde", viewAgenda: "Ver agenda",
    contractor: "Realização/contratante",
  },
  en: {
    eyebrow: "CHRISMED scientific calendar", title: "Meetings that turn information into care.",
    lead: "A calendar of education, relationships and experiences for healthcare professionals. See upcoming meetings and request your individual participation.",
    next: "Next event", upcoming: "Upcoming events", history: "Past events", agenda: "Calendar",
    agendaText: "Dates, times, venues, contractors and availability in a clear view.",
    emptyTitle: "No events published at this time.", emptyText: "New dates will appear after confirmation by the CHRISMED team.",
    contact: "Talk about events", register: "Request participation", closed: "Requests closed", past: "Event completed",
    pending: "Request received", pendingText: "Your seat is held for up to 90 minutes while CHRISMED reviews your request. Confirmation will be sent after approval.",
    name: "Full name", email: "Professional email", phone: "Phone / WhatsApp", referral: "Refer another healthcare professional (optional)",
    referralHelp: "A referral does not occupy a seat. The referred professional will receive an invitation to make their own request.",
    submit: "Send request", sending: "Sending…", consent: "By sending, I authorize use of these data exclusively to manage and communicate about this event.",
    seats: "seats available", professional: "Participation for healthcare professionals", viewAgenda: "View calendar", contractor: "Organizer/contractor",
  },
  es: {
    eyebrow: "Agenda científica CHRISMED", title: "Encuentros que transforman información en cuidado.",
    lead: "Una agenda de actualización, relaciones y experiencias para profesionales de la salud. Consulte los próximos encuentros y solicite su participación individual.",
    next: "Próximo evento", upcoming: "Próximos eventos", history: "Eventos anteriores", agenda: "Agenda",
    agendaText: "Fechas, horarios, lugares, contratantes y disponibilidad en una visión clara.",
    emptyTitle: "No hay eventos publicados en este momento.", emptyText: "Las nuevas fechas aparecerán tras confirmación del equipo CHRISMED.",
    contact: "Hablar sobre eventos", register: "Solicitar participación", closed: "Solicitudes cerradas", past: "Evento realizado",
    pending: "Solicitud recibida", pendingText: "Su plaza queda reservada hasta 90 minutos mientras CHRISMED analiza la solicitud. Recibirá la confirmación después de la aprobación.",
    name: "Nombre completo", email: "Email profesional", phone: "Teléfono / WhatsApp", referral: "Indicar otro profesional de salud (opcional)",
    referralHelp: "La indicación no ocupa una plaza. El profesional indicado recibirá una invitación para hacer su propia solicitud.",
    submit: "Enviar solicitud", sending: "Enviando…", consent: "Al enviar, autorizo el uso de estos datos exclusivamente para gestionar y comunicar sobre este evento.",
    seats: "plazas disponibles", professional: "Participación para profesionales de salud", viewAgenda: "Ver agenda", contractor: "Organización/contratante",
  },
} as const;

type Lang = "pt" | "en" | "es";
type Copy = (typeof COPY)[keyof typeof COPY];

function EventosPage() {
  const lang = useLang();
  const t = COPY[lang];
  const { data: events = [], isLoading, isError } = useQuery({ queryKey: ["chrismed-public-events"], queryFn: listPublicChrismedEvents });
  const { upcoming, past, featured } = useMemo(() => {
    const upcomingEvents = events.filter((event) => !event.isPast).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    const pastEvents = events.filter((event) => event.isPast).sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
    return { upcoming: upcomingEvents, past: pastEvents, featured: upcomingEvents[0] ?? null };
  }, [events]);

  return <ChrismedShell><main className="min-h-[70vh] bg-[var(--chrismed-ivory)] text-[var(--chrismed-forest-deep)]">
    <section className="relative overflow-hidden border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-forest-deep)] text-white">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_28%),radial-gradient(circle_at_80%_30%,#e6c16a_0,transparent_25%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:py-28">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--chrismed-amber-soft)]"><Sparkles className="h-4 w-4" />{t.eyebrow}</div><h1 className="chrismed-serif mt-6 max-w-4xl text-5xl leading-[.96] md:text-7xl">{t.title}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/78 md:text-xl">{t.lead}</p><a href="#agenda" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--chrismed-amber-soft)] px-6 py-3 text-sm font-bold text-[var(--chrismed-forest-deep)] shadow-lg transition hover:-translate-y-0.5">{t.viewAgenda}<ArrowRight className="h-4 w-4" /></a></div>
        <div className="grid content-end gap-4"><Metric label={t.upcoming} value={String(upcoming.length)} /><Metric label={t.history} value={String(past.length)} /><Metric label="CHRISMED" value="Saúde · Ciência · Relacionamento" small /></div>
      </div>
    </section>
    {isLoading && <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6"><div className="rounded-[2rem] border border-[var(--chrismed-sand)] bg-white p-10">Carregando agenda de eventos…</div></section>}
    {isError && <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6"><EmptyState title="Agenda temporariamente indisponível" text="Fale com a equipe CHRISMED para receber informações sobre os próximos eventos." contact={t.contact} /></section>}
    {!isLoading && !isError && events.length === 0 && <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6"><EmptyState title={t.emptyTitle} text={t.emptyText} contact={t.contact} /></section>}
    {!isLoading && !isError && featured && <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 md:py-20"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--chrismed-mustard-deep)]">{t.next}</p><div className="mt-5 overflow-hidden rounded-[2.25rem] bg-[var(--chrismed-forest-deep)] text-white shadow-2xl"><div className="grid md:grid-cols-[.9fr_1.1fr]"><div className="flex min-h-80 flex-col justify-between bg-[linear-gradient(145deg,#183b35,#275b51)] p-8 md:p-10"><DateBlock event={featured} lang={lang} dark /><div><p className="text-sm text-white/60">{featured.venueName || featured.city || "CHRISMED"}</p><p className="mt-2 text-sm font-semibold text-[var(--chrismed-amber-soft)]">{featured.seatsRemaining} {t.seats}</p></div></div><div className="p-8 md:p-12"><h2 className="chrismed-serif text-4xl leading-tight md:text-5xl">{featured.title}</h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75">{featured.summary || featured.description}</p><div className="mt-7 flex flex-wrap gap-3"><Chip icon={MapPin}>{[featured.venueName, featured.city].filter(Boolean).join(" · ")}</Chip><Chip icon={Users}>{t.professional}</Chip></div>{featured.contractorName && <p className="mt-4 text-sm text-white/65"><strong>{t.contractor}:</strong> {featured.contractorName}</p>}<div className="mt-8"><RegistrationPanel event={featured} copy={t} /></div></div></div></div></section>}
    {upcoming.length > 0 && <section id="agenda" className="border-y border-[var(--chrismed-sand)] bg-[#f4efdf]"><div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 md:py-20"><div className="grid gap-8 md:grid-cols-[.75fr_1.25fr]"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--chrismed-mustard-deep)]">{t.agenda}</p><h2 className="chrismed-serif mt-3 text-4xl md:text-5xl">{t.upcoming}</h2><p className="mt-4 max-w-md leading-relaxed text-[var(--chrismed-graphite)]">{t.agendaText}</p></div><div className="space-y-4">{upcoming.map((event, index) => <AgendaRow key={event.id} event={event} lang={lang} copy={t} featured={index === 0} />)}</div></div></div></section>}
    {upcoming.length > 1 && <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 md:py-20"><div className="grid gap-6 md:grid-cols-2">{upcoming.slice(1).map((event) => <EventCard key={event.id} event={event} copy={t} lang={lang} />)}</div></section>}
    {past.length > 0 && <section className="bg-[var(--chrismed-forest-deep)] text-white"><div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 md:py-20"><div className="flex items-end justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--chrismed-amber-soft)]">CHRISMED</p><h2 className="chrismed-serif mt-3 text-4xl md:text-5xl">{t.history}</h2></div><History className="hidden h-10 w-10 text-white/30 sm:block" /></div><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{past.map((event) => <PastEventCard key={event.id} event={event} lang={lang} copy={t} />)}</div></div></section>}
  </main></ChrismedShell>;
}

function Metric({ label, value, small = false }: { label: string; value: string; small?: boolean }) { return <div className="rounded-[1.75rem] border border-white/14 bg-white/8 p-6 backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-white/55">{label}</p><p className={`mt-2 font-semibold ${small ? "text-xl" : "text-4xl"}`}>{value}</p></div>; }
function Chip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) { return <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/85"><Icon className="h-4 w-4" />{children}</span>; }
function DateBlock({ event, lang, dark = false }: { event: PublicChrismedEvent; lang: Lang; dark?: boolean }) { const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR"; const d = new Date(event.startsAt); return <div><p className={`text-sm font-semibold uppercase tracking-[.16em] ${dark ? "text-[var(--chrismed-amber-soft)]" : "text-[var(--chrismed-mustard-deep)]"}`}>{new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "America/Sao_Paulo" }).format(d)}</p><div className="mt-2 flex items-end gap-3"><span className="chrismed-serif text-7xl leading-none">{new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone: "America/Sao_Paulo" }).format(d)}</span><div className="pb-2 text-sm uppercase tracking-[.14em] opacity-70"><div>{new Intl.DateTimeFormat(locale, { month: "long", timeZone: "America/Sao_Paulo" }).format(d)}</div><div>{new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d)}</div></div></div></div>; }
function AgendaRow({ event, lang, copy, featured }: { event: PublicChrismedEvent; lang: Lang; copy: Copy; featured: boolean }) { return <article className={`rounded-[1.6rem] border p-5 shadow-sm ${featured ? "border-[var(--chrismed-mustard-deep)] bg-white" : "border-[var(--chrismed-sand)] bg-white/70"}`}><div className="grid gap-4 sm:grid-cols-[140px_1fr_auto] sm:items-center"><DateBlock event={event} lang={lang} /><div><h3 className="text-lg font-bold">{event.title}</h3><p className="mt-1 text-sm text-[var(--chrismed-graphite)]">{[event.venueName, event.city].filter(Boolean).join(" · ")}</p>{event.contractorName && <p className="mt-1 text-xs text-[var(--chrismed-graphite)]">{copy.contractor}: {event.contractorName}</p>}</div><a href={`#evento-${event.id}`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--chrismed-forest-deep)] px-4 text-sm font-semibold">{copy.register}</a></div></article>; }
function PastEventCard({ event, lang, copy }: { event: PublicChrismedEvent; lang: Lang; copy: Copy }) { const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR"; return <article className="rounded-[1.7rem] border border-white/12 bg-white/6 p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--chrismed-amber-soft)]">{copy.past}</p><h3 className="chrismed-serif mt-3 text-2xl">{event.title}</h3><p className="mt-4 text-sm text-white/65">{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(event.startsAt))}</p><p className="mt-2 text-sm text-white/55">{[event.venueName, event.city].filter(Boolean).join(" · ")}</p></article>; }
function EmptyState({ title, text, contact }: { title: string; text: string; contact: string }) { return <div className="rounded-[2rem] border border-[var(--chrismed-sand)] bg-white p-8 shadow-sm md:p-12"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--chrismed-forest-deep)] text-[var(--chrismed-amber-soft)]"><CalendarDays className="h-6 w-6" /></div><h2 className="chrismed-serif mt-7 text-3xl md:text-4xl">{title}</h2><p className="mt-4 max-w-2xl text-[var(--chrismed-graphite)]">{text}</p><Link to="/chrismed/contato" className="chrismed-cta mt-8 inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">{contact}<ArrowRight className="h-4 w-4" /></Link></div>; }
function EventCard({ event, copy, lang }: { event: PublicChrismedEvent; copy: Copy; lang: Lang }) { return <article id={`evento-${event.id}`} className="overflow-hidden rounded-[2rem] border border-[var(--chrismed-sand)] bg-white shadow-[var(--chrismed-shadow-md)]"><div className="p-7 md:p-9"><DateBlock event={event} lang={lang} /><h2 className="chrismed-serif mt-6 text-3xl">{event.title}</h2><p className="mt-4 leading-relaxed text-[var(--chrismed-graphite)]">{event.summary || event.description}</p><div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{[event.venueName, event.city].filter(Boolean).join(" · ")}</span><span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{event.seatsRemaining} {copy.seats}</span></div>{event.contractorName && <p className="mt-3 text-sm text-[var(--chrismed-graphite)]"><strong>{copy.contractor}:</strong> {event.contractorName}</p>}<div className="mt-7"><RegistrationPanel event={event} copy={copy} /></div></div></article>; }

function RegistrationPanel({ event, copy }: { event: PublicChrismedEvent; copy: Copy }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", referredEmail: "", website: "" });
  const mutation = useMutation({ mutationFn: () => registerForChrismedEvent({ eventId: event.id, ...form }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chrismed-public-events"] }) });
  if (event.isPast) return <span className="inline-flex items-center rounded-full bg-black/5 px-4 py-2 text-sm font-semibold opacity-70">{copy.past}</span>;
  return <div>
    {!mutation.data && <button type="button" disabled={!event.registrationOpen} onClick={() => setOpen((v) => !v)} className="chrismed-cta inline-flex min-h-11 items-center rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45">{event.registrationOpen ? copy.register : copy.closed}</button>}
    {open && !mutation.data && <form className="mt-7 grid gap-4 rounded-[1.5rem] border border-[var(--chrismed-sand)] bg-white/95 p-5 text-[var(--chrismed-forest-deep)] md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
      <label className="text-sm font-semibold">{copy.name}<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
      <label className="text-sm font-semibold">{copy.email}<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
      <label className="text-sm font-semibold">{copy.phone}<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /></label>
      <label className="text-sm font-semibold">{copy.referral}<input type="email" value={form.referredEmail} onChange={(e) => setForm({ ...form, referredEmail: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-[var(--chrismed-sand)] bg-white px-4 font-normal" /><span className="mt-2 block text-xs font-normal text-[var(--chrismed-graphite)]">{copy.referralHelp}</span></label>
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" />
      <p className="text-xs leading-relaxed text-[var(--chrismed-graphite)] md:col-span-2">{copy.consent}</p>
      {mutation.error && <p role="alert" className="text-sm font-semibold text-red-800 md:col-span-2">{mutation.error.message}</p>}
      <button disabled={mutation.isPending} className="chrismed-cta inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold md:w-fit">{mutation.isPending ? copy.sending : copy.submit}</button>
    </form>}
    {mutation.data && <div role="status" className="mt-6 rounded-2xl bg-[var(--chrismed-forest-deep)] p-5 text-white"><CheckCircle2 className="h-6 w-6 text-[var(--chrismed-amber-soft)]" /><h3 className="mt-2 text-lg font-semibold text-[var(--chrismed-amber-soft)]">{copy.pending}</h3><p className="mt-2 text-sm text-white/85">{copy.pendingText}</p><p className="mt-2 text-sm text-white/85">Protocolo: <strong>{mutation.data.code}</strong></p></div>}
  </div>;
}
