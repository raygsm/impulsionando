import { createFileRoute, Link } from '@tanstack/react-router'
import { Building2, CalendarCheck2, Headphones, Hotel, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { WmpShell } from '@/components/wmp/WmpShell'
import { WmpCorporatePlanner } from '@/components/wmp/WmpCorporatePlanner'

export const Route = createFileRoute('/wmp/empresas')({
  head: () => ({
    meta: [
      { title: 'WMP para hotéis e empresas — DJs, eventos e operação recorrente' },
      { name: 'description', content: 'Contratação recorrente de DJs, produção técnica e operação de eventos para hotéis e empresas com agenda multi-data, briefing, histórico e gestão centralizada pela WMP.' },
      { property: 'og:title', content: 'WMP para hotéis e empresas — operação recorrente de eventos e DJs' },
      { property: 'og:description', content: 'Envie uma ou várias datas. A WMP centraliza briefing, curadoria de DJs, estrutura técnica, propostas e histórico.' },
      { property: 'og:url', content: 'https://wmp.impulsionando.com.br/empresas' },
    ],
    links: [{ rel: 'canonical', href: 'https://wmp.impulsionando.com.br/empresas' }],
  }),
  component: EmpresasPage,
})

function EmpresasPage() {
  return (
    <WmpShell breadcrumbs={[{ label: 'Hotéis e empresas' }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <span className="wmp-chip mb-5"><Building2 className="size-3" /> B2B WMP</span>
          <h1 className="wmp-display max-w-4xl text-4xl leading-tight md:text-6xl">Um único parceiro para sua agenda de DJs, eventos e estrutura técnica.</h1>
          <p className="mt-6 max-w-3xl text-lg opacity-80">A WMP organiza demandas recorrentes de hotéis e empresas em uma única operação. Você pode enviar várias datas de uma vez; cada data fica rastreável para curadoria, proposta, confirmação e execução.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#agenda-corporativa" className="wmp-cta"><CalendarCheck2 className="size-4" /> Enviar minha agenda</a>
            <a href="#como-funciona" className="wmp-cta wmp-cta-outline">Conhecer o modelo</a>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 max-w-3xl">
          <span className="wmp-chip mb-3"><CalendarCheck2 className="size-3" /> Operação recorrente</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Da necessidade à confirmação, sem planilhas soltas.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Card icon={Hotel} title="Agenda multi-data" text="Cadastre uma ou dezenas de datas numa única demanda, vinculadas à mesma unidade, hotel ou empresa." />
          <Card icon={Users} title="Rede qualificada" text="A WMP cruza briefing, perfil profissional e disponibilidade dos parceiros cadastrados." />
          <Card icon={Headphones} title="DJ + estrutura" text="Mão de obra e equipamentos são tratados separadamente, com custos, proprietários e responsáveis rastreáveis." />
          <Card icon={ShieldCheck} title="Histórico e controle" text="Cada data mantém status próprio para proposta, confirmação, execução e relacionamento futuro." />
        </div>
      </section>

      <section id="agenda-corporativa" className="mx-auto max-w-6xl px-6 py-20">
        <WmpCorporatePlanner />
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="wmp-surface p-8 md:p-10">
          <h2 className="wmp-display text-2xl md:text-3xl">Milito acompanha a jornada.</h2>
          <p className="mt-3 max-w-2xl opacity-80">O Milito identifica necessidade pontual ou recorrente, direciona a agenda corporativa, qualifica o contexto e preserva o histórico do atendimento. Quando houver decisão comercial, a equipe WMP assume o handoff necessário.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#agenda-corporativa" className="wmp-cta"><Sparkles className="size-4" /> Cadastrar várias datas</a>
            <Link to="/wmp/orcamento" className="wmp-cta wmp-cta-outline">Tenho apenas um evento</Link>
            <Link to="/wmp/parceiro" className="wmp-cta wmp-cta-outline">Sou DJ ou fornecedor</Link>
          </div>
        </div>
      </section>
    </WmpShell>
  )
}

function Card({ icon: Icon, title, text }: { icon: typeof Hotel; title: string; text: string }) {
  return <article className="wmp-surface p-6"><Icon className="mb-4 size-6" style={{ color: 'var(--wmp-gold)' }} aria-hidden /><h3 className="wmp-display text-lg">{title}</h3><p className="mt-2 text-sm leading-relaxed opacity-75">{text}</p></article>
}
