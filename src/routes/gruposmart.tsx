import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, BarChart3, Bot, BriefcaseBusiness, CalendarDays, CheckCircle2, ClipboardList, Coffee, Mail, MessageCircle, PackageCheck, PlayCircle, ShoppingBasket, Sparkles, Users } from 'lucide-react';

export const Route = createFileRoute('/gruposmart')({ component: GrupoSmartHome });

const modules = [
  ['CRM & Pipeline', 'Lead único, origem, vertical, ICP, score, owner, SLA, histórico e passagem de bastão.', BarChart3],
  ['ERP operacional', 'Cadastros, unidades, produtos/serviços, propostas, contratos, operação e controle.', PackageCheck],
  ['Agendamento', 'Reuniões, visitas, bloqueios, lembretes, no-show, handoff e disponibilidade comercial.', CalendarDays],
  ['Vídeo próprio', 'Player para teleatendimento, reunião remota e registro de link dentro da agenda.', PlayCircle],
  ['N8N & jornadas', 'Cadências por estágio, público, vertical, região, comportamento, SLA e reativação.', Sparkles],
  ['WhatsApp', 'Ativação quando aplicável, templates, consentimento e disparos transacionais.', MessageCircle],
  ['E-mail', 'Templates editáveis, confirmação, follow-up, nutrição, reativação e régua comercial.', Mail],
  ['BI & metas', 'Conversão, aging, forecast, produtividade, origem, cross-sell e visão executiva.', BarChart3],
  ['Smartito', 'Agente próprio conectado ao Impulsionito, com triagem, intenção e próxima melhor ação.', Bot],
];

function GrupoSmartHome() {
  return <main className="min-h-screen bg-slate-950 text-white" data-tenant="gruposmart">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/gruposmart" className="text-xl font-black tracking-tight">GRUPO <span className="text-sky-400">SMART</span></a>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex"><a href="#solucoes">Soluções</a><a href="#operacao">Operação comercial</a><a href="#full">Plano Full</a></nav>
        <a href="/gruposmart/app" className="rounded-full bg-sky-500 px-5 py-2 text-sm font-bold text-slate-950">Acessar gestão</a>
      </div>
    </header>

    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(14,165,233,.22),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(37,99,235,.16),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-sky-300"><Sparkles size={15}/> Conveniência corporativa conectada</div>
          <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">Duas soluções.<br/><span className="text-sky-400">Uma inteligência comercial.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">wizMart e Smart Café preservam seus produtos, públicos e jornadas. O Grupo Smart conecta dados, oportunidades, equipe, marketing, ERP, agenda, vídeo, automações e relacionamento em uma única estrutura preparada para crescer.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="#full" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-bold text-slate-950">Ver ecossistema Full <ArrowRight size={18}/></a><a href="/gruposmart/app" className="rounded-xl border border-white/20 px-6 py-3 font-semibold">Entrar no cockpit Full</a></div>
        </div>
        <div id="solucoes" className="grid gap-4">
          <a href="#wizmart" className="group rounded-3xl border border-sky-400/25 bg-gradient-to-br from-sky-500/15 to-white/5 p-7 transition hover:-translate-y-1 hover:border-sky-300/60"><ShoppingBasket className="mb-5 text-sky-300" size={36}/><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Maior frente comercial</p><h2 className="mt-2 text-3xl font-black">wizMart</h2><p className="mt-3 text-slate-300">Mercadinhos e conveniência para operações com aderência ao formato completo.</p><span className="mt-5 inline-flex items-center gap-2 font-bold text-sky-300">Explorar <ArrowRight size={17}/></span></a>
          <a href="#smartcafe" className="group rounded-3xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/15 to-white/5 p-7 transition hover:-translate-y-1 hover:border-indigo-300/60"><Coffee className="mb-5 text-indigo-300" size={36}/><p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-300">Café corporativo</p><h2 className="mt-2 text-3xl font-black">Smart Café</h2><p className="mt-3 text-slate-300">Máquina, café e apoio de conveniência onde o formato compacto é a melhor solução.</p><span className="mt-5 inline-flex items-center gap-2 font-bold text-indigo-300">Explorar <ArrowRight size={17}/></span></a>
        </div>
      </div>
    </section>

    <section id="operacao" className="border-y border-white/10 bg-white/[.035] px-6 py-20"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-sky-400">Nova arquitetura comercial</p><h2 className="mt-3 text-4xl font-black md:text-5xl">Da prospecção ao fechamento, sem perder contexto.</h2><div className="mt-10 grid gap-5 md:grid-cols-3">
      {[['Hunters internos',Users,'Prospecção ativa + inbound, qualificação, ICP, cadência e reunião.'],['Executivos de campo',BriefcaseBusiness,'Atuação regional, visita, diagnóstico, proposta, negociação e fechamento.'],['Playbooks e marketing',ClipboardList,'Geração de demanda, aquecimento de leads, régua comercial e handoff para vendas.']].map(([t,I,d]:any)=><article key={t} className="rounded-2xl border border-white/10 bg-slate-900 p-6"><I className="text-sky-400"/><h3 className="mt-5 text-xl font-bold">{t}</h3><p className="mt-2 leading-7 text-slate-400">{d}</p></article>)}
    </div></div></section>

    <section id="full" className="px-6 py-20"><div className="mx-auto max-w-7xl"><div className="max-w-4xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-sky-400">Impulsionando Tecnologia · Plano Full</p><h2 className="mt-3 text-4xl font-black md:text-5xl">Um ecossistema operacional, não apenas um CRM.</h2><p className="mt-5 text-lg leading-8 text-slate-300">A assessoria liderada por Priscila Caldas define pessoas, metas, modelo de trabalho e processo. O Plano Full materializa essa estratégia em CRM, ERP, agenda, vídeo, automações, comunicação, IA, BI e governança.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modules.map(([t,d,I]:any)=><article key={t} className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><I className="text-sky-400"/><h3 className="mt-4 font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d}</p></article>)}</div></div></section>

    <section id="wizmart" className="px-6 pb-6"><div className="mx-auto max-w-7xl rounded-3xl bg-sky-500 p-8 text-slate-950 md:p-12"><ShoppingBasket size={38}/><h2 className="mt-5 text-4xl font-black">wizMart</h2><p className="mt-3 max-w-3xl text-lg font-medium">Funil próprio, ICP próprio e abordagem própria. Toda oportunidade mantém sua cicatriz de origem e pode gerar cross-sell para Smart Café sem duplicar cadastro.</p></div></section>
    <section id="smartcafe" className="px-6 pb-20"><div className="mx-auto max-w-7xl rounded-3xl bg-indigo-500 p-8 md:p-12"><Coffee size={38}/><h2 className="mt-5 text-4xl font-black">Smart Café</h2><p className="mt-3 max-w-3xl text-lg font-medium">Jornada comercial especializada para café corporativo, integrada ao mesmo cockpit de dados e executivos regionais quando a conta exigir visita e fechamento em campo.</p></div></section>

    <section className="border-t border-white/10 px-6 py-20"><div className="mx-auto max-w-5xl text-center"><CheckCircle2 className="mx-auto text-sky-400" size={42}/><h2 className="mt-5 text-4xl font-black">Homologar primeiro. Crescer depois.</h2><p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">Implantação prevista em 30–45 dias no subdomínio Impulsionando, com testes de jornadas, integrações, ERP, agenda, vídeo, WhatsApp e e-mail. Após homologação, os domínios próprios podem ser direcionados sem desmontar a estrutura atual.</p><a href="/gruposmart/app" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-7 py-4 font-black text-slate-950">Abrir cockpit do Grupo Smart <ArrowRight size={18}/></a></div></section>
  </main>;
}
