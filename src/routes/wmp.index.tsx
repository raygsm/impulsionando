import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Music2, Lightbulb, Mic2, Calendar, Handshake, ArrowRight, ShieldCheck, Headphones, Zap } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";

export const Route = createFileRoute("/wmp/")({
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

      {/* CASES (placeholder com dados reais virão na Onda 2) */}
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
