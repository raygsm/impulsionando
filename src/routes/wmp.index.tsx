import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Music2, Lightbulb, Mic2, Calendar, Handshake, ArrowRight, ShieldCheck, Headphones, Zap, Check, HelpCircle, Building2, Bot, UserRoundCheck } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_PACOTES, WMP_FAQ, WMP_CERTIFICACOES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/")({
  head: () => ({
    meta: [
      { title: "WMP — Wagner Miller Produções" },
      { name: "description", content: "Produção de eventos, contratação de DJs, operação recorrente para hotéis e empresas e rede de parceiros, com briefing estruturado e acompanhamento pelo Milito." },
      { property: "og:title", content: "WMP — Wagner Miller Produções" },
      { property: "og:description", content: "Produção musical, artística e operacional para eventos, hotéis e empresas, com o Milito conduzindo cada jornada." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "WMP" },
      { property: "og:url", content: "https://wmp.impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://wmp.impulsionando.com.br/" }],
  }),
  component: WmpHome,
});

function WmpHome() {
  return (
    <WmpShell>
      <section className="wmp-stage-bg">
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center md:pb-28">
          <span className="wmp-chip mb-6"><Sparkles className="size-3" /> Música no contexto certo</span>
          <h1 className="wmp-display mx-auto mb-6 max-w-5xl text-5xl leading-[1.03] md:text-7xl">
            Produção musical, artística e operacional para <span style={{ color: "var(--wmp-gold)" }}>eventos que precisam funcionar</span>.
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-8 opacity-80 md:text-xl">
            A WMP conecta clientes, hotéis, empresas, DJs e fornecedores em uma operação única. O Milito entende o contexto, organiza o briefing, direciona a jornada e acompanha proposta, agenda e execução.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/wmp/orcamento" className="wmp-cta"><Sparkles className="size-4" /> Quero produzir um evento</Link>
            <Link to="/wmp/djs" className="wmp-cta wmp-cta-outline"><Headphones className="size-4" /> Quero contratar um DJ</Link>
            <Link to="/wmp/empresas" className="wmp-cta wmp-cta-outline"><Building2 className="size-4" /> Sou hotel ou empresa</Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link to="/wmp/parceiro" className="text-sm font-medium underline-offset-4 hover:underline"><Handshake className="mr-1 inline size-4" /> Sou DJ ou fornecedor e quero entrar para a rede WMP</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <span className="wmp-chip mb-3"><Bot className="size-3" /> Milito no centro da operação</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Uma entrada. Jornadas diferentes. Contexto preservado.</h2>
          <p className="mx-auto mt-4 max-w-3xl opacity-75">Em vez de obrigar todo mundo a preencher o mesmo caminho, o Milito identifica o perfil do visitante e conduz a próxima ação adequada.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <JourneyCard icon={Sparkles} title="Cliente de evento" text="Briefing técnico, local, data, público, necessidades, equipamentos, proposta e formalização após aceite comercial." cta="Começar meu evento" to="/wmp/orcamento" />
          <JourneyCard icon={Building2} title="Hotel ou empresa" text="Operação pontual ou recorrente de DJs e eventos, com agenda, histórico, padrão de atendimento e gestão centralizada." cta="Conhecer solução B2B" to="/wmp/empresas" />
          <JourneyCard icon={UserRoundCheck} title="DJ, músico ou fornecedor" text="Cadastro profissional, agenda, disponibilidade, equipamentos próprios, convites, histórico operacional e oportunidades WMP." cta="Entrar para a rede" to="/wmp/parceiro" />
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center"><span className="wmp-chip mb-3"><Music2 className="size-3" /> Estrutura sob medida</span><h2 className="wmp-display text-3xl md:text-4xl">Cada evento recebe o que realmente precisa</h2></div>
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard icon={Headphones} title="DJs e curadoria musical" desc="Seleção orientada por briefing, disponibilidade, perfil do evento, operação e histórico do parceiro." />
          <ServiceCard icon={Lightbulb} title="Iluminação" desc="Iluminação cênica e recursos adicionais definidos conforme briefing e disponibilidade." />
          <ServiceCard icon={Mic2} title="Som, vídeo, palco e adicionais" desc="PA, microfones, telas, projetores, estruturas, backline e outros itens podem integrar o escopo." />
          <ServiceCard icon={Zap} title="Briefing técnico" desc="Local, ambiente, público, horários e necessidades especiais orientam a operação." />
          <ServiceCard icon={ShieldCheck} title="Escopo documentado" desc="Serviços, equipamentos, mão de obra e logística ficam discriminados antes da execução." />
          <ServiceCard icon={Calendar} title="Agenda e operação" desc="Agenda, DJs, parceiros, equipamentos, propostas e histórico operacional ficam organizados no ecossistema WMP." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center"><span className="wmp-chip mb-3"><Sparkles className="size-3" /> Formatos de contratação</span><h2 className="wmp-display mb-2 text-3xl md:text-4xl">Escopo claro antes da formalização</h2><p className="opacity-70">Preço, equipamentos e equipe são definidos na proposta real do evento.</p></div>
        <div className="grid gap-6 md:grid-cols-3">{WMP_PACOTES.map((p) => <div key={p.slug} className="wmp-surface flex flex-col p-7"><h3 className="wmp-display mb-1 text-xl">{p.nome}</h3><p className="mb-3 text-xs opacity-70">{p.publico}</p><div className="mb-4"><span className="wmp-display text-2xl" style={{ color: "var(--wmp-gold)" }}>{p.preco_a_partir}</span></div><ul className="mb-5 flex-1 space-y-1.5">{p.bullets.map((b) => <li key={b} className="flex items-start gap-2 text-xs opacity-85"><Check className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--wmp-gold)" }} /><span>{b}</span></li>)}</ul><Link to="/wmp/orcamento" className="wmp-cta wmp-cta-outline text-sm">Solicitar proposta <ArrowRight className="size-3.5" /></Link></div>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center"><span className="wmp-chip mb-3"><ShieldCheck className="size-3" /> Processo operacional</span><h2 className="wmp-display text-3xl md:text-4xl">Controle antes de promessa</h2></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{WMP_CERTIFICACOES.map((c) => <div key={c.titulo} className="wmp-surface p-5"><ShieldCheck className="mb-3 size-6" style={{ color: "var(--wmp-gold)" }} /><h3 className="wmp-display mb-1 text-base">{c.titulo}</h3><p className="text-xs leading-relaxed opacity-75">{c.desc}</p></div>)}</div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="wmp-surface p-8 md:p-12">
          <Bot className="mx-auto size-8" style={{ color: "var(--wmp-gold)" }} />
          <h2 className="wmp-display mt-4 text-3xl md:text-4xl">Não sabe por onde começar? Fale com o Milito.</h2>
          <p className="mx-auto mt-4 max-w-2xl opacity-75">Ele entende se você quer produzir um evento, contratar um DJ, estruturar uma operação recorrente para hotel ou empresa, ou se cadastrar como parceiro WMP.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="mb-10 text-center"><span className="wmp-chip mb-3"><HelpCircle className="size-3" /> Dúvidas frequentes</span><h2 className="wmp-display text-3xl md:text-4xl">Como funciona</h2></div>
        <div className="wmp-surface p-2 md:p-4">{WMP_FAQ.map((item) => <details key={item.pergunta} className="border-b p-4 last:border-b-0" style={{ borderColor: "var(--wmp-border)" }}><summary className="cursor-pointer font-medium">{item.pergunta}</summary><p className="mt-3 text-sm leading-relaxed opacity-75">{item.resposta}</p></details>)}</div>
      </section>
    </WmpShell>
  );
}

function JourneyCard({ icon: Icon, title, text, cta, to }: { icon: React.ElementType; title: string; text: string; cta: string; to: string }) {
  return <article className="wmp-surface flex flex-col p-7"><Icon className="size-7" style={{ color: "var(--wmp-gold)" }} /><h3 className="wmp-display mt-4 text-2xl">{title}</h3><p className="mt-3 flex-1 text-sm leading-7 opacity-75">{text}</p><Link to={to} className="wmp-cta wmp-cta-outline mt-6">{cta}<ArrowRight className="size-4" /></Link></article>;
}

function ServiceCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return <article className="wmp-surface p-6"><Icon className="mb-4 size-7" style={{ color: "var(--wmp-gold)" }} /><h3 className="wmp-display mb-2 text-xl">{title}</h3><p className="text-sm leading-relaxed opacity-75">{desc}</p></article>;
}
