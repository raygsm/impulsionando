import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarDays, Instagram, MapPin, Sparkles } from 'lucide-react'
import { WmpShell } from '@/components/wmp/WmpShell'

export const Route = createFileRoute('/wmp/onde-estou')({
  head: () => ({
    meta: [
      { title: 'Onde Estou — agenda pública Wagner Miller | WMP' },
      { name: 'description', content: 'Agenda pública validada de Wagner Miller. Consulte datas publicadas e fale com a WMP para contratação de DJ e produção de eventos.' },
    ],
    links: [{ rel: 'canonical', href: '/wmp/onde-estou' }],
  }),
  component: OndeEstouPage,
})

function OndeEstouPage() {
  return (
    <WmpShell breadcrumbs={[{ label: 'Onde Estou' }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <span className="wmp-chip mb-5"><MapPin className="size-3" /> Onde Estou</span>
          <h1 className="wmp-display text-4xl md:text-6xl">Agenda pública de Wagner Miller.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg opacity-80">Aqui entram somente apresentações com data, local e horário confirmados. Referências históricas nunca são publicadas automaticamente como agenda atual.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="wmp-surface p-8 text-center md:p-12">
          <CalendarDays className="mx-auto size-10" style={{ color: 'var(--wmp-gold)' }} aria-hidden />
          <h2 className="wmp-display mt-4 text-2xl">Nenhuma data pública validada para exibição neste momento.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed opacity-75">A agenda será atualizada somente quando cada apresentação estiver confirmada pela WMP. Para contratar Wagner Miller, um DJ da rede ou a produção completa do seu evento, inicie o briefing.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/wmp/orcamento" className="wmp-cta"><Sparkles className="size-4" /> Quero contratar</Link>
            <a className="wmp-cta wmp-cta-outline" href="https://www.instagram.com/wagnermiller_dj" target="_blank" rel="noreferrer"><Instagram className="size-4" /> @wagnermiller_dj</a>
          </div>
        </div>
      </section>
    </WmpShell>
  )
}
