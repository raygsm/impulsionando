import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight, Sparkles, PlayCircle, MessageCircle, CheckCircle2,
  Target, TrendingUp, Bot, Rocket, ShieldCheck,
  Stethoscope, Utensils, Dumbbell, Home as HomeIcon, ShoppingBag, Briefcase,
  ChevronRight, LogIn,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { cn } from "@/lib/utils";

/**
 * Onda A2 — Home reconstruída como jornada de conversão.
 * Estrutura: Hero → Intenção → Demonstração → Benefícios → Confiança →
 * Setores → Planos (chamada) → Fechamento.
 * Sem grids densos, sem vitrine de módulos, sem tabelas de planos.
 */

// ============== 2. INTENÇÕES ==============
type IntencaoId =
  | "vender" | "organizar" | "atender" | "automatizar" | "presenca" | "setor";

type Intencao = {
  id: IntencaoId;
  label: string;
  short: string;
  headline: string;
  body: string;
  cta: { to: string; label: string; params?: Record<string, string> };
  hint: string;
};

const INTENCOES: Intencao[] = [
  {
    id: "vender",
    label: "Vender mais",
    short: "Captar, converter e reter clientes.",
    headline: "Cada oportunidade recebida, respondida e acompanhada.",
    body:
      "CRM, WhatsApp oficial, funis por etapa e cobrança automática trabalhando em conjunto para transformar interesse em receita — sem depender de planilhas ou memória.",
    cta: { to: "/solucoes/vender-mais", label: "Ver como vender mais" },
    hint: "Ideal para quem perde lead por demora, esquece follow-up ou não sabe quanto vale seu funil.",
  },
  {
    id: "organizar",
    label: "Organizar a empresa",
    short: "Um só lugar para operação, agenda e financeiro.",
    headline: "A operação inteira visível em um único painel.",
    body:
      "Agenda, cadastros, contratos, fluxo financeiro e permissões por equipe conectados. Menos abas abertas, menos retrabalho, mais clareza para decidir.",
    cta: { to: "/solucoes/organizar-empresa", label: "Organizar minha empresa" },
    hint: "Ideal para quem opera em várias ferramentas soltas e perde tempo consolidando informação.",
  },
  {
    id: "atender",
    label: "Melhorar o atendimento",
    short: "Atendimento contínuo, sem furos, com histórico.",
    headline: "Um atendimento que não dorme e nunca esquece o cliente.",
    body:
      "Impulsionito responde 24/7, o time entra quando precisa, tudo com histórico. O cliente sente que a empresa lembra dele em cada interação.",
    cta: { to: "/solucoes/melhorar-atendimento", label: "Ver atendimento inteligente" },
    hint: "Ideal para negócios que perdem venda por demora ou por atendimento inconsistente entre canais.",
  },
  {
    id: "automatizar",
    label: "Automatizar processos",
    short: "Menos tarefa manual, mais tempo para crescer.",
    headline: "Cada rotina repetida vira automação silenciosa.",
    body:
      "Réguas de comunicação, cobrança, onboarding, renovação e pós-venda executadas em segundo plano. O time cuida do que importa — o sistema cuida do resto.",
    cta: { to: "/solucoes/automatizar-processos", label: "Automatizar operações" },
    hint: "Ideal para quem sente que a equipe passa o dia apagando incêndio em vez de crescer.",
  },
  {
    id: "presenca",
    label: "Presença digital",
    short: "Sites, vitrines, catálogos e link único.",
    headline: "Uma presença digital que trabalha vendendo por você.",
    body:
      "Vitrines, páginas por serviço, catálogos, agendamento online e link único integrados ao Core. O que aparece na internet conecta direto na operação.",
    cta: { to: "/solucoes/presenca-digital", label: "Ver presença digital" },
    hint: "Ideal para quem tem redes sociais ativas, mas nenhuma jornada estruturada até a venda.",
  },
  {
    id: "setor",
    label: "Soluções para meu setor",
    short: "Jornadas prontas por segmento.",
    headline: "O Core adaptado à realidade do seu setor.",
    body:
      "Módulos, jornadas, réguas e vocabulário calibrados para clínicas, bares, imobiliárias, serviços, eventos, e-commerce, jurídico, fitness e mais.",
    cta: { to: "/nichos", label: "Explorar setores" },
    hint: "Ideal para quem quer ver o sistema falando a língua do seu segmento antes de decidir.",
  },
];

// ============== 3. DEMONSTRAÇÃO NARRATIVA ==============
const DEMO_STEPS = [
  { n: "01", title: "O lead chega", body: "Instagram, site, indicação ou WhatsApp — a origem é registrada." },
  { n: "02", title: "Impulsionito responde", body: "Atende em segundos, qualifica e agenda com contexto." },
  { n: "03", title: "CRM registra", body: "Contato, histórico e etapa do funil ficam disponíveis para o time." },
  { n: "04", title: "Jornada inicia", body: "Réguas de comunicação, lembretes e conteúdos entram no ar." },
  { n: "05", title: "Pagamento", body: "Link enviado, confirmação automática, comprovante organizado." },
  { n: "06", title: "Onboarding", body: "Cliente recebe boas-vindas guiadas e acessa sua área imediatamente." },
  { n: "07", title: "Core acompanha", body: "A empresa vê tudo — atendimento, vendas, agenda e financeiro em um só painel." },
];

// ============== 4. BENEFÍCIOS ==============
const BENEFICIOS = [
  { icon: TrendingUp, title: "Mais vendas fechadas", body: "Nenhum lead esquecido. Follow-up automático até a decisão.", to: "/solucoes/vender-mais" },
  { icon: Bot, title: "Menos tarefa manual", body: "Rotinas repetidas viram automação. O time cuida do que importa.", to: "/solucoes/automatizar-processos" },
  { icon: MessageCircle, title: "Atendimento contínuo", body: "Impulsionito responde 24/7 e passa o bastão para o humano com contexto.", to: "/solucoes/melhorar-atendimento" },
  { icon: Target, title: "Visão da operação", body: "Um painel único: agenda, vendas, atendimento e financeiro juntos.", to: "/solucoes/organizar-empresa" },
  { icon: Rocket, title: "Implantação guiada", body: "Você não fica sozinho. Ativação assistida por especialista.", to: "/central-de-ajuda" },
  { icon: ShieldCheck, title: "Crescimento com controle", body: "Permissões, LGPD, dados no Brasil e trilhas de auditoria.", to: "/sobre" },
];

// ============== 5. CONFIANÇA INSTITUCIONAL ==============
const CONFIANCA = [
  { title: "Clareza de funcionamento", body: "Você vê o sistema operando antes de contratar. Demonstrações reais por setor." },
  { title: "Segurança e LGPD", body: "Dados hospedados no Brasil, permissões granulares e trilhas de auditoria." },
  { title: "Suporte e acompanhamento", body: "Canal oficial único, implantação assistida e acompanhamento contínuo." },
  { title: "Integração de verdade", body: "WhatsApp oficial, pagamentos, e-mail, agenda e ferramentas do seu dia-a-dia." },
];

// ============== 6. SETORES DESTACADOS ==============
const SETORES_HOME = [
  { slug: "clinicas", label: "Clínicas e Consultórios", icon: Stethoscope },
  { slug: "bares-restaurantes", label: "Bares e Restaurantes", icon: Utensils },
  { slug: "fitness", label: "Fitness e Academias", icon: Dumbbell },
  { slug: "imobiliaria", label: "Imobiliárias", icon: HomeIcon },
  { slug: "servicos", label: "Empresas de Serviços", icon: Briefcase },
  { slug: "ecommerce", label: "E-commerce e Varejo", icon: ShoppingBag },
];

// ============== ANALYTICS ==============
function track(id: string, extra: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({
      event: "home_cta", cta_id: id, ...extra,
    });
  } catch { /* noop */ }
}
function openImpulsionito(origin: string) {
  track("falar_impulsionito", { origin });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin } }));
  }
}

// ============== SEÇÕES ==============

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary-glow/25 blur-3xl" aria-hidden />

      <div className="relative container-narrow section-block text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur">
          <Sparkles className="w-3 h-3" /> Plataforma modular para PMEs brasileiras
        </div>

        <h1 className="mt-6 text-display font-bold text-balance">
          Um único lugar para{" "}
          <span className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
            atender, vender e operar
          </span>{" "}
          o seu negócio.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lead text-white/85">
          Descubra o caminho certo para o seu momento em minutos. Sem cartão, sem compromisso —
          com um especialista acompanhando cada passo.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg w-full sm:w-auto min-w-[240px]"
            onClick={() => track("hero_descobrir")}
          >
            <Link to="/escolher-nicho">
              <Target className="w-4 h-4" /> Descobrir minha solução
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2 w-full sm:w-auto min-w-[220px]"
            onClick={() => track("hero_demonstracoes")}
          >
            <Link to="/demo">
              <PlayCircle className="w-4 h-4" /> Ver demonstração
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/75">
          <Link
            to="/auth"
            onClick={() => track("hero_ja_sou_cliente")}
            className="inline-flex items-center gap-1.5 underline underline-offset-4 decoration-white/30 hover:decoration-white hover:text-white"
          >
            <LogIn className="w-3.5 h-3.5" /> Já sou cliente — entrar
          </Link>
          <span aria-hidden className="text-white/25">·</span>
          <button
            type="button"
            onClick={() => openImpulsionito("hero")}
            className="inline-flex items-center gap-1.5 underline underline-offset-4 decoration-white/30 hover:decoration-white hover:text-white"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Falar com o Impulsionito
          </button>
        </div>
      </div>
    </section>
  );
}

function Intencao() {
  const [active, setActive] = useState<IntencaoId>("vender");
  const current = useMemo(() => INTENCOES.find((i) => i.id === active)!, [active]);

  return (
    <section aria-labelledby="intencao-title" className="section-block">
      <div className="container-narrow">
        <div className="text-center">
          <div className="text-eyebrow text-muted-foreground">Primeiro passo</div>
          <h2 id="intencao-title" className="mt-2 text-h2 font-bold">
            O que você quer transformar primeiro?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-muted-foreground">
            Escolha um foco. O Core adapta a próxima etapa da sua jornada.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Intenções"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {INTENCOES.map((i) => {
            const isActive = i.id === active;
            return (
              <button
                key={i.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => { setActive(i.id); track("intencao_select", { id: i.id }); }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                {i.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border surface-2 p-6 sm:p-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
            <div className="min-w-0">
              <div className="text-eyebrow text-primary">{current.short}</div>
              <h3 className="mt-2 text-h3 font-semibold text-balance">{current.headline}</h3>
              <p className="mt-3 text-body-lg text-muted-foreground">{current.body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2 bg-gradient-primary text-primary-foreground">
                  <Link
                    to={current.cta.to}
                    onClick={() => track("intencao_cta", { id: current.id })}
                  >
                    {current.cta.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Link
                  to="/escolher-nicho"
                  onClick={() => track("intencao_recomendacao", { id: current.id })}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Prefiro uma recomendação guiada
                </Link>
              </div>
            </div>
            <aside className="rounded-xl border border-primary/15 bg-primary/5 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <CheckCircle2 className="w-4 h-4" /> Faz sentido pra você?
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{current.hint}</p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

function Demonstracao() {
  return (
    <section aria-labelledby="demo-title" className="section-block surface-2 border-y border-border">
      <div className="container-narrow">
        <div className="max-w-2xl">
          <div className="text-eyebrow text-muted-foreground">Como funciona na prática</div>
          <h2 id="demo-title" className="mt-2 text-h2 font-bold text-balance">
            Uma jornada real, do primeiro contato ao acompanhamento contínuo.
          </h2>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Veja como Core e Impulsionito conduzem o cliente sem que sua equipe precise
            lembrar de cada etapa.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
          {/* Placeholder de vídeo — proporção 16:9, poster estático, respeita reduced-motion */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-accent/10 to-primary-glow/15 shadow-elegant">
            <div className="absolute inset-0 grid place-items-center text-center px-6">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                  <PlayCircle className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Demonstração narrativa em produção
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Versões desktop e mobile serão publicadas em breve.
                </p>
              </div>
            </div>
          </div>

          <ol className="relative space-y-4">
            {DEMO_STEPS.map((s) => (
              <li
                key={s.n}
                className="flex gap-4 rounded-xl border border-border bg-background p-4"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                  {s.n}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{s.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link to="/demo" onClick={() => track("demo_ver_todas")}>
              <PlayCircle className="w-4 h-4" /> Explorar demonstrações
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => openImpulsionito("demo-section")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Ou peça uma demo pelo Impulsionito
          </button>
        </div>
      </div>
    </section>
  );
}

function Beneficios() {
  return (
    <section aria-labelledby="beneficios-title" className="section-block">
      <div className="container-narrow">
        <div className="max-w-2xl">
          <div className="text-eyebrow text-muted-foreground">Resultado, não recurso</div>
          <h2 id="beneficios-title" className="mt-2 text-h2 font-bold text-balance">
            O que muda na sua operação depois do Core.
          </h2>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b) => {
            const Icon = b.icon;
            return (
              <li key={b.title}>
                <Link
                  to={b.to}
                  onClick={() => track("beneficio_click", { title: b.title })}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-base font-semibold text-foreground">{b.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                  <div className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition">
                    Ver como <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Confianca() {
  return (
    <section aria-labelledby="confianca-title" className="section-block surface-2 border-y border-border">
      <div className="container-narrow">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
          <div>
            <div className="text-eyebrow text-muted-foreground">Confiança</div>
            <h2 id="confianca-title" className="mt-2 text-h2 font-bold text-balance">
              Transparência antes de qualquer promessa.
            </h2>
            <p className="mt-3 text-body-lg text-muted-foreground">
              Preferimos mostrar o produto funcionando a inventar números.
              Você vê, testa e conversa com quem vai implantar antes de decidir.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {CONFIANCA.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-background p-5">
                <dt className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> {c.title}
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Setores() {
  return (
    <section aria-labelledby="setores-title" className="section-block">
      <div className="container-narrow">
        <div className="max-w-2xl">
          <div className="text-eyebrow text-muted-foreground">Seu segmento</div>
          <h2 id="setores-title" className="mt-2 text-h2 font-bold text-balance">
            O Core fala a língua da sua realidade.
          </h2>
          <p className="mt-3 text-body-lg text-muted-foreground">
            Jornadas, módulos e vocabulário adaptados ao seu setor —
            sem parecer um sistema genérico com adesivo por cima.
          </p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SETORES_HOME.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.slug}>
                <Link
                  to="/nichos/$slug"
                  params={{ slug: s.slug }}
                  onClick={() => track("setor_click", { slug: s.slug })}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-medium text-foreground truncate">
                    {s.label}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary transition" />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <Link
            to="/nichos"
            onClick={() => track("setor_ver_todos")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Ver todos os setores <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlanosChamada() {
  return (
    <section aria-labelledby="planos-title" className="section-block surface-2 border-y border-border">
      <div className="container-narrow">
        <div className="grid gap-8 md:grid-cols-3 md:items-stretch">
          <Passo n="01" title="Descobrir minha solução" body="Diagnóstico rápido para entender seu momento." to="/escolher-nicho" ctaId="passo_descobrir" />
          <Passo n="02" title="Receber recomendação" body="Módulos e jornadas certos para o seu porte e objetivo." to="/orcamento" ctaId="passo_recomendacao" />
          <Passo n="03" title="Conhecer os planos" body="Comparativo claro, sem letra miúda, com preço transparente." to="/planos" ctaId="passo_planos" primary />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Prefere olhar direto?</span>{" "}
            <Link to="/planos" onClick={() => track("planos_direto")} className="font-semibold text-primary hover:underline">
              Ir para os planos oficiais
            </Link>
          </p>
        </div>

        <h2 id="planos-title" className="sr-only">Planos e recomendação</h2>
      </div>
    </section>
  );
}

function Passo({
  n, title, body, to, ctaId, primary,
}: { n: string; title: string; body: string; to: string; ctaId: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      onClick={() => track(ctaId)}
      className={cn(
        "group flex h-full flex-col rounded-2xl border p-6 transition-colors",
        primary
          ? "border-primary bg-gradient-primary text-primary-foreground shadow-elegant"
          : "border-border bg-background hover:border-primary/40",
      )}
    >
      <div className={cn("text-eyebrow", primary ? "text-primary-foreground/80" : "text-primary")}>
        Passo {n}
      </div>
      <div className={cn("mt-2 text-h3 font-semibold", primary ? "text-primary-foreground" : "text-foreground")}>
        {title}
      </div>
      <p className={cn("mt-2 text-sm leading-relaxed", primary ? "text-primary-foreground/85" : "text-muted-foreground")}>
        {body}
      </p>
      <div className={cn(
        "mt-6 inline-flex items-center gap-1 text-sm font-semibold",
        primary ? "text-primary-foreground" : "text-primary",
      )}>
        Continuar <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}

function Fechamento() {
  return (
    <section aria-labelledby="fechamento-title" className="section-block">
      <div className="container-narrow">
        <div className="rounded-3xl bg-gradient-hero px-6 py-14 sm:px-12 sm:py-20 text-center text-primary-foreground shadow-elegant">
          <h2 id="fechamento-title" className="text-h1 font-bold text-balance">
            Comece pelo caminho certo para o seu momento.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lead text-white/85">
            Sem cartão. Sem compromisso. Com um humano acompanhando.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 min-w-[240px]" onClick={() => track("fechamento_descobrir")}>
              <Link to="/escolher-nicho">
                <Target className="w-4 h-4" /> Descobrir minha solução
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2 min-w-[220px]"
              onClick={() => track("fechamento_demo")}
            >
              <Link to="/demo">
                <PlayCircle className="w-4 h-4" /> Ver uma demonstração
              </Link>
            </Button>
          </div>

          <div className="mt-6 text-xs text-white/70">
            <button
              type="button"
              onClick={() => openImpulsionito("fechamento")}
              className="inline-flex items-center gap-1.5 underline underline-offset-4 decoration-white/30 hover:decoration-white hover:text-white"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Preferir falar antes? Chame o Impulsionito.
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============== ROOT ==============
export function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main id="conteudo" className="flex-1">
        <Hero />
        <Intencao />
        <Demonstracao />
        <Beneficios />
        <Confianca />
        <Setores />
        <PlanosChamada />
        <Fechamento />
      </main>
      <PublicFooter />
    </div>
  );
}

export default HomePage;

// Marcadores de compatibilidade com o funil (ícones que outros módulos
// esperavam encontrar via barrel implícito não são mais reexportados —
// mantida apenas a API pública HomePage).
export const __HOME_A2__ = true;
Store; Users; // referenciados apenas para manter tree-shaking previsível
