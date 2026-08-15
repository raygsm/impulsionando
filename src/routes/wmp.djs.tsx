import { createFileRoute, Link } from '@tanstack/react-router'
import { Building2, CalendarCheck2, CheckCircle2, Headphones, Music2, ShieldCheck, Sparkles } from 'lucide-react'
import { WmpShell } from '@/components/wmp/WmpShell'

export const Route = createFileRoute('/wmp/djs')({
  head: () => ({
    meta: [
      { title: 'Contratar DJ para eventos, hotéis e empresas | WMP' },
      { name: 'description', content: 'A WMP conecta eventos, hotéis e empresas a DJs qualificados com briefing, curadoria, disponibilidade, estrutura técnica, proposta e operação centralizada pelo Milito.' },
      { property: 'og:title', content: 'Contratar DJ com curadoria WMP' },
      { property: 'og:description', content: 'Conte o perfil do evento ao Milito. A WMP organiza briefing, curadoria, disponibilidade, proposta e operação.' },
      { property: 'og:url', content: 'https://wmp.impulsionando.com.br/djs' },
    ],
    links: [{ rel: 'canonical', href: 'https://wmp.impulsionando.com.br/djs' }],
  }),
  component: DjsPage,
})

const steps = [
  ['1', 'Conte o evento ao Milito', 'Tipo de evento, data, local, público, perfil musical e estrutura desejada.'],
  ['2', 'Curadoria e disponibilidade', 'A WMP cruza o briefing com parceiros aprovados e disponibilidade registrada.'],
  ['3', 'Proposta comercial', 'Você recebe primeiro uma proposta objetiva com serviço, data e preço.'],
  ['4', 'Contrato e operação', 'Após o aceite comercial, a formalização é liberada e a WMP coordena DJ, equipamento e logística.'],
]

function DjsPage() {
  return <WmpShell breadcrumbs={[{ label: 'Contratar DJ' }]}>
    <section className="wmp-stage-bg">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-4xl">
          <span className="wmp-chip"><Headphones className="size-3"/> Curadoria de DJs WMP</span>
          <h1 className="wmp-display mt-6 text-5xl leading-[1.03] md:text-7xl">O DJ certo para o <span style={{color:'var(--wmp-gold)'}}>momento certo</span>.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 opacity-80">Não é uma lista aleatória de nomes. O Milito entende o evento, organiza o briefing e conduz a WMP na busca por perfil musical, disponibilidade, estrutura e operação adequados.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/wmp/orcamento" className="wmp-cta"><Sparkles className="size-4"/> Encontrar meu DJ</Link><Link to="/wmp/parceiro" className="wmp-cta wmp-cta-outline"><Music2 className="size-4"/> Sou DJ e quero me cadastrar</Link></div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-20"><div className="mb-10 max-w-3xl"><span className="wmp-chip"><CalendarCheck2 className="size-3"/> Jornada inteligente</span><h2 className="wmp-display mt-4 text-3xl md:text-4xl">Da intenção à pista, sem improviso</h2></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{steps.map(([n,title,desc])=><article key={n} className="wmp-surface p-6"><div className="flex size-9 items-center justify-center rounded-full text-sm font-bold" style={{background:'var(--gradient-wmp-cta)',color:'var(--wmp-bg)'}}>{n}</div><h3 className="wmp-display mt-4 text-xl">{title}</h3><p className="mt-2 text-sm leading-6 opacity-70">{desc}</p></article>)}</div></section>

    <section className="mx-auto max-w-7xl px-6 py-20"><div className="grid gap-6 lg:grid-cols-2"><article className="wmp-surface p-7"><Building2 className="size-7" style={{color:'var(--wmp-gold)'}}/><h2 className="wmp-display mt-4 text-2xl">Hotéis e empresas</h2><p className="mt-3 leading-7 opacity-75">Para operações recorrentes, a WMP pode centralizar datas, perfis de DJ, confirmações, histórico e padrão de atendimento. O foco é relacionamento de longo prazo, não apenas uma contratação isolada.</p><Link to="/wmp/empresas" className="wmp-cta wmp-cta-outline mt-6">Conhecer solução B2B</Link></article><article className="wmp-surface p-7"><ShieldCheck className="size-7" style={{color:'var(--wmp-gold)'}}/><h2 className="wmp-display mt-4 text-2xl">Rede profissional controlada</h2><ul className="mt-4 space-y-3 text-sm opacity-80">{['Cadastro e aprovação do parceiro','Agenda e disponibilidade por data','Cachê e logística registrados separadamente','Equipamentos tratados como locação quando aplicável','Histórico de convites, aceite e execução'].map(item=><li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{color:'var(--wmp-gold)'}}/>{item}</li>)}</ul></article></div></section>

    <section className="mx-auto max-w-5xl px-6 py-20 text-center"><div className="wmp-surface p-8 md:p-12"><Sparkles className="mx-auto size-8" style={{color:'var(--wmp-gold)'}}/><h2 className="wmp-display mt-4 text-3xl md:text-4xl">Comece pelo Milito</h2><p className="mx-auto mt-4 max-w-2xl opacity-75">Quanto melhor o briefing, melhor a curadoria. Conte data, local, tipo de evento, público e clima musical desejado. A WMP cuida do restante da jornada comercial e operacional.</p><Link to="/wmp/orcamento" className="wmp-cta mt-7"><Headphones className="size-4"/> Quero contratar um DJ</Link></div></section>
  </WmpShell>
}
