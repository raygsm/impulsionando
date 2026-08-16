import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, Clock3, Instagram, MapPin, Sparkles } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { WmpShell } from '@/components/wmp/WmpShell'
import { listPublicWhereabouts } from '@/lib/wmp/whereabouts.server'

const loadWhereabouts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await listPublicWhereabouts()
  } catch (error) {
    console.error('[WMP Onde Estou] public agenda unavailable', error)
    return []
  }
})

export const Route = createFileRoute('/wmp/onde-estou')({
  head: () => ({
    meta: [
      { title: 'Onde Estou — agenda pública Wagner Miller | WMP' },
      { name: 'description', content: 'Agenda pública validada de Wagner Miller. Consulte datas, locais e horários publicados diretamente pela WMP.' },
      { property: 'og:title', content: 'Onde Estou — agenda pública de Wagner Miller' },
      { property: 'og:description', content: 'Veja somente locais, datas e horários validados e publicados pela WMP.' },
      { property: 'og:url', content: 'https://wmp.impulsionando.com.br/onde-estou' },
    ],
    links: [{ rel: 'canonical', href: 'https://wmp.impulsionando.com.br/onde-estou' }],
  }),
  loader: async () => ({ entries: await loadWhereabouts() }),
  component: OndeEstouPage,
})

function formatTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : ''
}

function OndeEstouPage() {
  const { entries } = Route.useLoaderData()
  return (
    <WmpShell breadcrumbs={[{ label: 'Onde Estou' }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <span className="wmp-chip mb-5"><MapPin className="size-3" /> Onde Estou</span>
          <h1 className="wmp-display text-4xl md:text-6xl">Agenda pública de Wagner Miller.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-80">Locais e horários publicados diretamente pela WMP. A agenda é atualizada diariamente pelo Milito a partir da confirmação de Wagner Miller.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        {entries.length === 0 ? (
          <div className="wmp-surface p-8 text-center md:p-12">
            <CalendarDays className="mx-auto size-10" style={{ color: 'var(--wmp-gold)' }} aria-hidden />
            <h2 className="wmp-display mt-4 text-2xl">Nenhuma apresentação publicada no momento.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed opacity-75">Assim que Wagner Miller confirmar o local e os horários do dia, o Milito publica automaticamente aqui.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map((entry: any) => (
              <article key={entry.id} className="wmp-surface p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{new Date(`${entry.event_date}T12:00:00-03:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
                <h2 className="wmp-display mt-2 text-2xl">{entry.venue_name}</h2>
                <div className="mt-4 space-y-2 text-sm opacity-80">
                  <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--wmp-gold)' }} />{entry.venue_address}</p>
                  <p className="flex items-center gap-2"><Clock3 className="size-4 shrink-0" style={{ color: 'var(--wmp-gold)' }} />{formatTime(entry.start_time)}{entry.end_time ? ` às ${formatTime(entry.end_time)}` : ''}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/wmp/orcamento" className="wmp-cta"><Sparkles className="size-4" /> Quero contratar</Link>
          <a className="wmp-cta wmp-cta-outline" href="https://www.instagram.com/wagnermiller_dj" target="_blank" rel="noreferrer"><Instagram className="size-4" /> @wagnermiller_dj</a>
        </div>
      </section>
    </WmpShell>
  )
}