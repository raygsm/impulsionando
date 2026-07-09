import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Music2, Lightbulb, Mic2, Calendar, Handshake, ArrowRight, ShieldCheck, Headphones, Zap, Quote, Check, HelpCircle, Ticket } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { WMP_DEPOIMENTOS, WMP_PACOTES, WMP_FAQ, WMP_CERTIFICACOES } from "@/data/wmp-content";

export const Route = createFileRoute("/wmp/")({
  head: () => ({
    meta: [
      { title: "WMP — Plataforma de produção e gestão de eventos" },
      { name: "description", content: "Plataforma completa de produção, gestão e comercialização de eventos: som, luz, palco, telão, coordenação, ART e laudo de dB. Referência Impulsionando em eventos, shows, festivais e corporativos." },
      { property: "og:title", content: "WMP — Plataforma completa para eventos" },
      { property: "og:description", content: "Do briefing à execução: pré-diagnóstico acústico, estrutura, coordenação e experiência. Um único interlocutor, sem improviso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/wmp" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Wagner Miller Produções (WMP)",
          description: "Plataforma de produção, gestão e comercialização de eventos: som, iluminação, palco, telão e coordenação técnica.",
          areaServed: "Brasil",
          address: { "@type": "PostalAddress", addressRegion: "RJ", addressCountry: "BR" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "WMP", item: "/wmp" },
          ],
        }),
      },
    ],
  }),
  component: WmpHome,
});


function WmpHome() {
  return (
    <WmpShell>
      {/* HERO */}
      <section className="wmp-stage-bg">
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-28 text-center">
          <span className="wmp-chip mb-6"><Sparkles className="size-3" /> Produção premium para o seu evento</span>
          <h1 className="wmp-display text-5xl md:text-7xl leading-[1.05] mb-6 max-w-4xl mx-auto">
            Som que <span style={{ color: "var(--wmp-gold)" }}>preenche</span>.
            <br />
            Luz que <span style={{ color: "var(--wmp-violet-glow)" }}>emociona</span>.
          </h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto mb-10">
            Da estrutura ao último acorde, a WMP entrega som, luz, telão e palco com pré-diagnóstico
            acústico inteligente — você sabe o que precisa antes mesmo da nossa visita técnica.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/wmp/orcamento" className="wmp-cta">
              <Sparkles className="size-4" /> Quero meu orçamento em 60s
            </Link>
            <Link to="/wmp/parceiro" className="wmp-cta wmp-cta-outline">
              <Handshake className="size-4" /> Seja parceiro WMP
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm opacity-80 max-w-3xl mx-auto">
            <Stat n="+850" l="eventos realizados" />
            <Stat n="15 anos" l="de palco" />
            <Stat n="24h" l="resposta garantida" />
            <Stat n="100%" l="laudo de dB sob demanda" />
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <span className="wmp-chip mb-3"><Music2 className="size-3" /> O que entregamos</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Estrutura completa, um único interlocutor</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <ServiceCard
            icon={Headphones}
            title="Sonorização profissional"
            desc="PA, line array, monitores in-ear, mesa digital e técnico FOH dedicado. Cobrimos de 50 a 10.000 pessoas."
          />
          <ServiceCard
            icon={Lightbulb}
            title="Iluminação cênica"
            desc="Moving heads, PAR LED, máquinas de fumaça, programação DMX e operador. Cenas pré-aprovadas com o cliente."
          />
          <ServiceCard
            icon={Mic2}
            title="Palco, telão e backline"
            desc="Estruturas em alumínio Q30/Q50, telões LED P3/P4, gerador silencioso e backline completo para bandas."
          />
          <ServiceCard
            icon={Zap}
            title="Pré-diagnóstico acústico"
            desc="Calculamos potência, reverberação e iluminação ideais a partir do seu briefing. Sem suposição."
          />
          <ServiceCard
            icon={ShieldCheck}
            title="ART e laudo de dB"
            desc="Anotação de responsabilidade técnica e medição de pressão sonora dentro dos limites municipais."
          />
          <ServiceCard
            icon={Calendar}
            title="Coordenação do evento"
            desc="Cronograma minuto a minuto, equipe uniformizada e plano B documentado para chuva, falha elétrica ou atraso."
          />
        </div>
      </section>

      {/* CASES */}
      <section id="cases" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <span className="wmp-chip mb-3"><Sparkles className="size-3" /> Cases recentes</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Eventos que marcaram</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { t: "Festival Sertanejo de Verão", d: "8.000 pessoas · line array L-Acoustics · 4 dias" },
            { t: "Convenção Corporativa Tech", d: "1.200 executivos · 3 palcos simultâneos · telão 12m" },
            { t: "Casamento ao ar livre", d: "350 convidados · estrutura coberta · DJ + banda" },
          ].map((c) => (
            <div key={c.t} className="wmp-surface p-6">
              <div className="aspect-video rounded-lg mb-4" style={{ background: "var(--gradient-wmp-stage)" }} />
              <h3 className="wmp-display text-xl mb-2">{c.t}</h3>
              <p className="opacity-70 text-sm">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AGENDA / INGRESSOS — placeholder institucional (roadmap Codex) */}
      <section id="agenda" className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-10">
          <span className="wmp-chip mb-3"><Calendar className="size-3" aria-hidden /> Agenda &amp; ingressos</span>
          <h2 className="wmp-display text-3xl md:text-4xl mb-3">Eventos abertos ao público</h2>
          <p className="opacity-75 max-w-2xl mx-auto">
            A WMP está preparando a plataforma de venda de ingressos, inscrições e credenciamento
            integrada ao ecossistema Impulsionando. Enquanto a agenda pública é liberada, os eventos
            fechados seguem atendidos por briefing direto.
          </p>
        </div>
        <div className="wmp-surface p-8 md:p-10 text-center max-w-3xl mx-auto">
          <Ticket className="size-10 mx-auto mb-4" style={{ color: "var(--wmp-gold)" }} aria-hidden />
          <h3 className="wmp-display text-xl mb-2">Nenhum evento público em cartaz no momento</h3>
          <p className="opacity-75 text-sm mb-6">
            Produz um evento e quer vender ingressos, gerir lotes, check-in por QR Code e área
            do participante? Fale com a WMP: montamos a operação técnica e comercial ponta a ponta.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/wmp/orcamento" className="wmp-cta">
              <Sparkles className="size-4" aria-hidden /> Solicitar proposta para meu evento
            </Link>
            <Link to="/wmp/cases" className="wmp-cta wmp-cta-outline">
              Ver eventos já entregues <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <span className="wmp-chip mb-3"><Sparkles className="size-3" /> Pacotes comerciais</span>
          <h2 className="wmp-display text-3xl md:text-4xl mb-2">Escolha o porte. O escopo é transparente.</h2>
          <p className="opacity-70">Três referências para acelerar sua decisão — todas personalizáveis no briefing.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {WMP_PACOTES.map((p) => (
            <div
              key={p.slug}
              className="wmp-surface p-7 flex flex-col relative"
              style={p.destaque ? { borderColor: "var(--wmp-gold)", borderWidth: 2 } : undefined}
            >
              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 wmp-chip text-xs"
                  style={{ background: "var(--gradient-wmp-cta)", color: "var(--wmp-bg)", borderColor: "var(--wmp-gold)" }}>
                  Mais contratado
                </span>
              )}
              <h3 className="wmp-display text-xl mb-1">{p.nome}</h3>
              <p className="text-xs opacity-70 mb-3">{p.publico}</p>
              <div className="mb-4">
                <span className="text-xs opacity-60 block">a partir de</span>
                <span className="wmp-display text-2xl" style={{ color: "var(--wmp-gold)" }}>{p.preco_a_partir}</span>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
                {p.bullets.slice(0, 4).map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs opacity-85">
                    <Check className="size-3.5 mt-0.5 shrink-0" style={{ color: "var(--wmp-gold)" }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link to="/wmp/pacotes" className="wmp-cta wmp-cta-outline text-sm">
                Ver escopo completo <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <span className="wmp-chip mb-3"><Quote className="size-3" /> Prova social</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Quem contratou. Quem voltou a contratar.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {WMP_DEPOIMENTOS.map((d) => (
            <figure key={d.nome} className="wmp-surface p-6 flex flex-col">
              <Quote className="size-6 mb-3" style={{ color: "var(--wmp-gold)" }} />
              <blockquote className="text-sm opacity-90 flex-1 leading-relaxed">"{d.texto}"</blockquote>
              <figcaption className="mt-4 pt-4 border-t text-sm" style={{ borderColor: "var(--wmp-border)" }}>
                <div className="wmp-display">{d.nome}</div>
                <div className="text-xs opacity-70">{d.cargo}</div>
                <div className="text-xs opacity-60 mt-1">{d.evento}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* GARANTIAS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <span className="wmp-chip mb-3"><ShieldCheck className="size-3" /> Garantias técnicas</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Sem improviso. Documentado por escrito.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {WMP_CERTIFICACOES.map((c) => (
            <div key={c.titulo} className="wmp-surface p-5">
              <ShieldCheck className="size-6 mb-3" style={{ color: "var(--wmp-gold)" }} />
              <h3 className="wmp-display text-base mb-1">{c.titulo}</h3>
              <p className="text-xs opacity-75 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ (preview) */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center mb-10">
          <span className="wmp-chip mb-3"><HelpCircle className="size-3" /> Dúvidas frequentes</span>
          <h2 className="wmp-display text-3xl md:text-4xl">Antes de você perguntar…</h2>
        </div>
        <div className="wmp-surface p-2 md:p-4">
          {WMP_FAQ.slice(0, 4).map((f, i) => (
            <details key={f.pergunta} className="group p-5 border-b last:border-0"
              style={{ borderColor: "var(--wmp-border)" }} open={i === 0}>
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                <span className="wmp-display text-base">{f.pergunta}</span>
                <span className="shrink-0 size-6 rounded-full flex items-center justify-center text-sm transition group-open:rotate-45"
                  style={{ background: "var(--wmp-surface-2)", color: "var(--wmp-gold)" }}>+</span>
              </summary>
              <p className="mt-3 text-sm opacity-80 leading-relaxed">{f.resposta}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/wmp/faq" className="wmp-cta wmp-cta-outline text-sm">
            Ver todas as perguntas <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* PARCEIROS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="wmp-surface p-10 text-center">
          <span className="wmp-chip mb-3"><Handshake className="size-3" /> Rede WMP</span>
          <h2 className="wmp-display text-3xl md:text-4xl mb-3">Você é DJ, músico ou técnico?</h2>
          <p className="opacity-80 max-w-2xl mx-auto mb-6">
            Cadastre-se na rede de parceiros WMP e seja chamado em eventos compatíveis com seu perfil,
            cidade e disponibilidade. Avaliação contínua, pagamentos pontuais.
          </p>
          <Link to="/wmp/parceiro/cadastro" className="wmp-cta">
            Quero me cadastrar <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="wmp-surface p-10 md:p-14 text-center" style={{ borderColor: "var(--wmp-gold)", borderWidth: 2 }}>
          <h2 className="wmp-display text-3xl md:text-5xl mb-4">Pronto para começar?</h2>
          <p className="opacity-85 max-w-xl mx-auto mb-8">
            Briefing em 60 segundos, com pré-diagnóstico acústico instantâneo. Proposta detalhada em até 24 horas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/wmp/orcamento" className="wmp-cta">
              <Sparkles className="size-4" /> Quero meu orçamento
            </Link>
            <Link to="/wmp/cases" className="wmp-cta wmp-cta-outline">
              Ver cases <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </WmpShell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="wmp-display text-3xl" style={{ color: "var(--wmp-gold)" }}>{n}</div>
      <div className="text-xs uppercase tracking-wider mt-1 opacity-70">{l}</div>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="wmp-surface p-6 transition hover:-translate-y-1">
      <div className="size-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "color-mix(in oklab, var(--wmp-gold) 18%, transparent)" }}>
        <Icon className="size-5" style={{ color: "var(--wmp-gold)" }} />
      </div>
      <h3 className="wmp-display text-xl mb-2">{title}</h3>
      <p className="opacity-75 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
