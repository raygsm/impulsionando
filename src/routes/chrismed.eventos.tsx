import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';

export const Route = createFileRoute('/chrismed/eventos')({
  head: () => ({
    meta: [
      { title: 'Eventos CHRISMED · Saúde, prevenção e cuidado' },
      { name: 'description', content: 'Agenda oficial de eventos, encontros e ações de saúde da CHRISMED.' },
      { property: 'og:title', content: 'Eventos CHRISMED' },
      { property: 'og:description', content: 'Acompanhe a agenda oficial de eventos e ações de saúde da CHRISMED.' },
    ],
  }),
  component: EventosPage,
});

const COPY = {
  pt: {
    eyebrow: 'Agenda CHRISMED',
    title: 'Eventos que aproximam cuidado, conhecimento e prevenção.',
    lead: 'Esta é a agenda oficial de encontros, ações de saúde e conteúdos especiais da CHRISMED.',
    emptyTitle: 'Nenhum evento público neste momento.',
    emptyText: 'Novas programações serão exibidas aqui assim que forem confirmadas e publicadas pela equipe CHRISMED.',
    contact: 'Falar com a equipe',
    book: 'Agendar consulta',
  },
  en: {
    eyebrow: 'CHRISMED calendar',
    title: 'Events connecting care, knowledge and prevention.',
    lead: 'This is the official calendar for CHRISMED meetings, health initiatives and special content.',
    emptyTitle: 'No public events at this time.',
    emptyText: 'New dates will appear here as soon as they are confirmed and published by the CHRISMED team.',
    contact: 'Talk to our team',
    book: 'Book a consultation',
  },
  es: {
    eyebrow: 'Agenda CHRISMED',
    title: 'Eventos que conectan cuidado, conocimiento y prevención.',
    lead: 'Esta es la agenda oficial de encuentros, acciones de salud y contenidos especiales de CHRISMED.',
    emptyTitle: 'No hay eventos públicos en este momento.',
    emptyText: 'Las nuevas fechas aparecerán aquí cuando sean confirmadas y publicadas por el equipo CHRISMED.',
    contact: 'Hablar con el equipo',
    book: 'Agendar consulta',
  },
} as const;

function EventosPage() {
  const lang = useLang();
  const t = COPY[lang];

  return (
    <ChrismedShell>
      <main className="chrismed-page-mustard min-h-[70vh]">
        <section className="border-b border-[var(--chrismed-mustard-deep)]/20">
          <div className="container max-w-5xl py-20 md:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--chrismed-forest-deep)]">{t.eyebrow}</p>
            <h1 className="chrismed-serif mt-5 max-w-4xl text-4xl leading-[1.03] md:text-6xl">{t.title}</h1>
            <p className="chrismed-lede mt-6 max-w-2xl text-lg leading-relaxed">{t.lead}</p>
          </div>
        </section>

        <section className="container max-w-5xl py-14 md:py-20">
          <div className="rounded-[2rem] border border-[var(--chrismed-mustard-deep)]/30 bg-[var(--chrismed-ivory)] p-8 shadow-[var(--chrismed-shadow-md)] md:p-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--chrismed-forest-deep)] text-[var(--chrismed-amber-soft)]">
              <CalendarDays aria-hidden="true" className="h-6 w-6" />
            </div>
            <h2 className="chrismed-serif mt-7 text-3xl text-[var(--chrismed-forest-deep)] md:text-4xl">{t.emptyTitle}</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--chrismed-graphite)]">{t.emptyText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/chrismed/contato" className="chrismed-cta inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                {t.contact}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link to="/chrismed/agendar" className="chrismed-cta-ghost inline-flex min-h-11 items-center rounded-full px-6 py-3 text-sm font-semibold">
                {t.book}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </ChrismedShell>
  );
}
