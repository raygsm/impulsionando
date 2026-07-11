/**
 * /chrismed — Home CHRISMED (Onda V2 · Quiet Luxury)
 *
 * Reposiciona a marca ao redor da Dra. Christiane Alencar como símbolo de
 * atendimento AA, discrição, experiência e continuidade.
 *
 * Guardrails aprovados na Onda V2:
 *  - Só usa primitivos do design system CHRISMED (src/components/chrismed/primitives).
 *  - Nenhum CTA público aponta para WhatsApp. Oliver é o único ponto de conversa.
 *  - Sem preços fixos, sem estatísticas não validadas, sem placeholders visíveis.
 *  - CTA primário sempre → /chrismed/agendar. Secundário → /chrismed/dra-cristiane.
 *  - Retrato da Dra. Christiane só é publicado com src autorizado; caso contrário,
 *    ChrismedPortrait renderiza fallback silencioso.
 *  - Ambulatorial ainda aponta para /chrismed/clinica (rota provisória).
 *
 * Pendências registradas para o Codex / próximas ondas:
 *  - Grafia oficial do nome (Christiane × Christiane) — adotado "Christiane Alencar"
 *    conforme material atual do menu/shell; confirmar no material institucional
 *    antes de publicar em produção.
 *  - Retrato autorizado da Dra. Christiane (asset ainda não existe em src/assets).
 *  - Trajetória, artigos, congressos, cooperações (Seção 5) — só serão exibidos
 *    após validação da fonte oficial. Hoje entregamos versão editorial neutra.
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang, type Lang } from '@/components/chrismed/ChrismedShell';
import {
  ChrismedSection,
  ChrismedHeading,
  ChrismedEyebrow,
  ChrismedButton,
  ChrismedCard,
  ChrismedPortrait,
  ChrismedModalityCard,
  ChrismedOliverLauncher,
  ChrismedTrustBar,
  ChrismedFollowUpCard,
} from '@/components/chrismed/primitives';
import { CHRISMED_DOCTOR } from '@/content/chrismed/identity';
import { DRA_CHRISTIANE_PORTRAIT_SRC } from '@/content/chrismed/portrait';
import { openChrismedOliver } from '@/components/chrismed/oliver-store';

const hasPortrait = Boolean(DRA_CHRISTIANE_PORTRAIT_SRC);


export const Route = createFileRoute('/chrismed/')({
  head: () => ({
    meta: [
      { title: 'CHRISMED — Medicina privada com a Dra. Christiane Alencar' },
      {
        name: 'description',
        content:
          'Atendimento clínico de padrão AA com a Dra. Christiane Alencar: teleconsulta, consulta presencial em Copacabana e visita domiciliar. PT · EN · ES.',
      },
      { property: 'og:title', content: 'CHRISMED — Dra. Christiane Alencar' },
      {
        property: 'og:description',
        content:
          'Medicina privada, contínua e discreta. Teleconsulta, presencial em Copacabana e visita domiciliar.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://chrismed.impulsionando.com.br/chrismed' },
      { property: 'og:site_name', content: 'CHRISMED' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'CHRISMED — Dra. Christiane Alencar' },
      {
        name: 'twitter:description',
        content: 'Medicina privada, contínua e discreta com a Dra. Christiane Alencar.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://chrismed.impulsionando.com.br/chrismed' }],
  }),
  component: ChrismedHomePage,
});

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

function ChrismedHomePage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      {/* ─────────── Seção 1 — Hero ───────────
          Composição varia conforme haja retrato autorizado (regra V2):
          - Com retrato: 2 colunas editoriais com cartão-legenda ancorado.
          - Sem retrato: 1 coluna centralizada com cartucho tipográfico
            (nunca uma moldura vazia grande no lugar da mídia). */}
      <ChrismedSection
        tone="ivory"
        className={hasPortrait ? 'pt-16 md:pt-24' : 'pt-20 md:pt-32'}
      >
        <div
          className={
            hasPortrait
              ? 'grid gap-12 md:gap-16 lg:grid-cols-[1.15fr_1fr] lg:items-end'
              : 'mx-auto max-w-3xl text-left'
          }
        >
          <div>
            <ChrismedEyebrow>{t.hero.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={1} className="mt-6">
              {t.hero.title}{' '}
              <span className="chrismed-serif italic text-[var(--chrismed-graphite)]">
                {t.hero.titleItalic}
              </span>
            </ChrismedHeading>
            <p className="chrismed-sans mt-8 max-w-[36ch] text-base leading-relaxed text-[var(--chrismed-graphite)] md:text-lg">
              {t.hero.lead}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link to="/chrismed/agendar" className="inline-flex">
                <ChrismedButton size="lg">{t.hero.ctaPrimary}</ChrismedButton>
              </Link>
              <Link to="/chrismed/dra-cristiane" className="inline-flex">
                <ChrismedButton size="lg" variant="ghost">
                  {t.hero.ctaSecondary}
                </ChrismedButton>
              </Link>
            </div>

            <button
              type="button"
              onClick={openOliver}
              className="chrismed-sans mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-champagne-deep)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)]"
              aria-label={t.hero.oliverHint}
            >
              <span aria-hidden>—</span> {t.hero.oliverHint}
            </button>

            <ul className="chrismed-sans mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
              {t.hero.modes.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>

            {!hasPortrait && (
              <div className="mt-14 border-t border-[var(--chrismed-sand)] pt-8">
                <ChrismedEyebrow>{t.hero.portraitEyebrow}</ChrismedEyebrow>
                <p className="chrismed-serif mt-3 text-2xl font-light italic text-[var(--chrismed-ink)]">
                  {CHRISMED_DOCTOR.shortName}
                </p>
                <p className="chrismed-sans mt-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-graphite)]">
                  {t.hero.portraitRole}
                </p>
              </div>
            )}
          </div>

          {hasPortrait && (
            <div className="relative">
              <ChrismedPortrait
                src={DRA_CHRISTIANE_PORTRAIT_SRC}
                ratio="4/5"
                alt={t.hero.portraitAlt}
                eyebrow={t.hero.portraitEyebrow}
                className="w-full"
              />
              <div className="absolute -bottom-6 left-6 right-6 border-l border-[var(--chrismed-champagne)] bg-[var(--chrismed-ivory)] px-6 py-5 md:-bottom-8 md:left-10">
                <ChrismedEyebrow>{t.hero.portraitEyebrow}</ChrismedEyebrow>
                <p className="chrismed-serif mt-2 text-xl font-light italic text-[var(--chrismed-ink)]">
                  {CHRISMED_DOCTOR.shortName}
                </p>
                <p className="chrismed-sans mt-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-graphite)]">
                  {t.hero.portraitRole}
                </p>
              </div>
            </div>
          )}
        </div>
      </ChrismedSection>

      {/* ─────────── Onda 6 — Prova social institucional discreta ─────────── */}
      <ChrismedSection tone="ivory" className="!py-0">
        <ChrismedTrustBar />
      </ChrismedSection>




      {/* ─────────── Seção 2 — Como deseja ser atendido? ─────────── */}
      <ChrismedSection tone="bone">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.modalities.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.modalities.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-5 text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.modalities.lead}
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.modalities.items.map((m, i) => (
            <div key={m.title} className="flex flex-col">
              <ChrismedModalityCard
                index={i + 1}
                eyebrow={m.eyebrow}
                title={m.title}
                description={m.description}
              />
              <Link
                to="/chrismed/agendar"
                className="chrismed-sans mt-6 inline-flex items-center gap-2 self-start border-b border-[var(--chrismed-sand)] pb-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)]"
              >
                {t.modalities.cta}
                <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 3 — Experiência de atendimento ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.experience.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.experience.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.experience.lead}
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {t.experience.items.map((item, i) => (
              <li key={item.title} className="border-t border-[var(--chrismed-sand)] pt-5">
                <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="chrismed-serif mt-3 text-xl font-light text-[var(--chrismed-ink)]">
                  {item.title}
                </h3>
                <p className="chrismed-sans mt-2 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 4 — Três grandes vertentes ─────────── */}
      <ChrismedSection tone="bone">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.verticals.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.verticals.title}
          </ChrismedHeading>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.verticals.items.map((v) => (
            <ChrismedCard key={v.title} className="flex flex-col">
              <ChrismedEyebrow>{v.eyebrow}</ChrismedEyebrow>
              <h3 className="chrismed-serif mt-4 text-2xl font-light text-[var(--chrismed-ink)]">
                {v.title}
              </h3>
              <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                {v.context}
              </p>
              <dl className="chrismed-sans mt-5 space-y-3 text-xs text-[var(--chrismed-graphite)]">
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
                    {t.verticals.audience}
                  </dt>
                  <dd className="mt-1">{v.audience}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
                    {t.verticals.benefit}
                  </dt>
                  <dd className="mt-1">{v.benefit}</dd>
                </div>
              </dl>
              <div className="mt-auto pt-8">
                <Link
                  to={v.to}
                  className="chrismed-sans inline-flex items-center gap-2 border-b border-[var(--chrismed-sand)] pb-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)]"
                >
                  {v.cta}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </ChrismedCard>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 5 — Autoridade da Dra. Christiane ───────────
          Sem números não validados. Sem lista de artigos/congressos até
          o Codex confirmar. Entregamos versão editorial neutra com CTA
          para a página completa. */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.authority.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.authority.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.authority.body}
            </p>
            <div className="mt-10">
              <Link to="/chrismed/dra-cristiane" className="inline-flex">
                <ChrismedButton variant="ghost">{t.authority.cta}</ChrismedButton>
              </Link>
            </div>
          </div>
          <div className="border-l border-[var(--chrismed-champagne)] pl-8">
            <p className="chrismed-serif text-2xl font-light italic leading-relaxed text-[var(--chrismed-ink)]">
              “{t.authority.quote}”
            </p>
            <p className="chrismed-sans mt-6 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
              Dra. Christiane Alencar
            </p>
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 6 — Como funciona ─────────── */}
      <ChrismedSection tone="bone">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.flow.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.flow.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-5 text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.flow.lead}
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-5">
          {t.flow.steps.map((step, i) => (
            <li key={step} className="border-t border-[var(--chrismed-sand)] pt-4">
              <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="chrismed-serif mt-3 text-lg font-light leading-snug text-[var(--chrismed-ink)]">
                {step}
              </p>
            </li>
          ))}
        </ol>
        <p className="chrismed-sans mt-10 max-w-[60ch] text-xs leading-relaxed text-[var(--chrismed-mist)]">
          {t.flow.note}
        </p>
      </ChrismedSection>

      {/* ─────────── Seção 7 — Oliver ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.oliver.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.oliver.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.oliver.lead}
            </p>
            <ul className="chrismed-sans mt-6 space-y-3 text-sm text-[var(--chrismed-graphite)]">
              {t.oliver.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span aria-hidden className="text-[var(--chrismed-champagne-deep)]">·</span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="chrismed-sans mt-6 text-xs italic text-[var(--chrismed-mist)]">
              {t.oliver.disclaimer}
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <ChrismedOliverLauncher
              lang={lang}
              variant="inline"
              onClick={openOliver}
            />
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── Seção 8 — Fechamento ─────────── */}
      <ChrismedSection tone="noir">
        <div className="mx-auto max-w-3xl text-center">
          <ChrismedEyebrow className="text-[var(--chrismed-champagne)]">
            {t.close.eyebrow}
          </ChrismedEyebrow>
          <h2 className="chrismed-serif mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-light leading-[1.05] text-[var(--chrismed-ivory)]">
            {t.close.title}{' '}
            <span className="italic text-[var(--chrismed-champagne)]">
              {t.close.titleItalic}
            </span>
          </h2>
          <p className="chrismed-sans mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--chrismed-sand)]">
            {t.close.lead}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/chrismed/agendar" className="inline-flex">
              <ChrismedButton
                size="lg"
                className="bg-[var(--chrismed-champagne)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)]"
              >
                {t.close.ctaPrimary}
              </ChrismedButton>
            </Link>
            <button
              type="button"
              onClick={openOliver}
              className="chrismed-sans inline-flex items-center gap-2 border border-[var(--chrismed-champagne)]/50 px-8 py-4 text-[12px] uppercase tracking-[0.2em] text-[var(--chrismed-champagne)] transition-colors hover:bg-[var(--chrismed-champagne)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)]"
            >
              {t.close.ctaSecondary}
            </button>
          </div>
        </div>
      </ChrismedSection>
    </ChrismedShell>
  );
}

/* ═════════════════ Conteúdo trilíngue ═════════════════ */
type Copy = {
  hero: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    oliverHint: string;
    modes: string[];
    portraitAlt: string;
    portraitEyebrow: string;
    portraitRole: string;
  };
  modalities: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    items: { eyebrow: string; title: string; description: string }[];
  };
  experience: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  verticals: {
    eyebrow: string;
    title: string;
    audience: string;
    benefit: string;
    items: {
      eyebrow: string;
      title: string;
      context: string;
      audience: string;
      benefit: string;
      cta: string;
      to: '/chrismed/clinica' | '/chrismed/ocupacional' | '/chrismed/internacional';
    }[];
  };
  authority: { eyebrow: string; title: string; body: string; cta: string; quote: string };
  flow: { eyebrow: string; title: string; lead: string; steps: string[]; note: string };
  oliver: {
    eyebrow: string;
    title: string;
    lead: string;
    bullets: string[];
    disclaimer: string;
  };
  close: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
};

const COPY: Record<Lang, Copy> = {
  pt: {
    hero: {
      eyebrow: 'CHRISMED · Medicina privada',
      title: 'Cuidado clínico',
      titleItalic: 'que pertence a você.',
      lead: 'Consultas com a Dra. Christiane Alencar em Copacabana, na sua casa ou por vídeo. Tempo dedicado, escuta atenta e continuidade — sem pressa, sem intermediários.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Conhecer a Dra. Christiane',
      oliverHint: 'Falar antes com Oliver',
      modes: ['Teleconsulta', 'Presencial · Copacabana', 'Consulta domiciliar'],
      portraitAlt: 'Retrato editorial da Dra. Christiane Alencar',
      portraitEyebrow: 'Autoridade médica',
      portraitRole: 'Medicina privada · Rio de Janeiro',
    },
    modalities: {
      eyebrow: 'Como deseja ser atendido',
      title: 'Três modalidades pensadas para a sua rotina.',
      lead: 'Cada modalidade preserva o mesmo padrão de escuta, tempo e cuidado. A escolha é sobre onde e como — nunca sobre quanto de atenção você recebe.',
      cta: 'Agendar nesta modalidade',
      items: [
        {
          eyebrow: 'Vídeo',
          title: 'Teleconsulta',
          description:
            'Consulta por vídeo com prescrição digital e prontuário eletrônico. Ideal para acompanhamento contínuo e para pacientes em viagem.',
        },
        {
          eyebrow: 'Copacabana',
          title: 'Presencial em Copacabana',
          description:
            'Consultório reservado, agenda sob horário e recepção discreta. Tempo dedicado antes, durante e depois da consulta.',
        },
        {
          eyebrow: 'Casa · Hotel',
          title: 'Consulta domiciliar',
          description:
            'Atendimento em sua residência, hotel ou escritório, com o mesmo rigor clínico e a privacidade que a sua rotina exige.',
        },
      ],
    },
    experience: {
      eyebrow: 'Padrão AA',
      title: 'O que muda quando o tempo da consulta é seu.',
      lead: 'Padrão AA, na CHRISMED, é uma prática — não um adjetivo. Traduzimos em decisões concretas sobre escuta, continuidade e discrição.',
      items: [
        { title: 'Escuta sem pressa', body: 'Consultas com tempo real para conversar, examinar e explicar. Nada de agenda apertada nem consulta encaixada.' },
        { title: 'Atenção contínua', body: 'A mesma médica acompanha a sua história ao longo do tempo, com prontuário próprio e leitura integrada dos exames.' },
        { title: 'Acompanhamento entre consultas', body: 'Orientação estruturada após o atendimento e canal direto para dúvidas objetivas — sempre pela CHRISMED.' },
        { title: 'Discrição', body: 'Recepção reservada, dados criptografados e conformidade total com a LGPD. Sua privacidade é parte do protocolo.' },
        { title: 'Clareza', body: 'Diagnósticos, condutas e alternativas explicados sem jargão. Você entende cada decisão antes de tomá-la.' },
        { title: 'Continuidade', body: 'Encaminhamentos, exames e interconsultas coordenados pela CHRISMED, com laboratórios e redes hospitalares parceiras.' },
      ],
    },
    verticals: {
      eyebrow: 'Vertentes CHRISMED',
      title: 'Três frentes de atuação, uma única medicina.',
      audience: 'Para quem',
      benefit: 'Benefício',
      items: [
        {
          eyebrow: '01 · Clínica',
          title: 'Medicina Ambulatorial',
          context: 'Consultas privadas, acompanhamento longitudinal e coordenação de exames e interconsultas.',
          audience: 'Pacientes que buscam médica de referência em Copacabana, no Rio de Janeiro ou à distância.',
          benefit: 'Continuidade clínica com uma única médica ao longo do tempo.',
          cta: 'Conhecer a Clínica',
          to: '/chrismed/clinica',
        },
        {
          eyebrow: '02 · Empresas',
          title: 'Medicina Ocupacional',
          context: 'Programas ocupacionais estruturados: PCMSO, ASO, acompanhamento e triagem — com o mesmo padrão clínico das consultas privadas.',
          audience: 'Empresas e famílias que contratam saúde ocupacional discreta e sem terceirização massiva.',
          benefit: 'Conformidade regulatória com atendimento humano, longe da lógica de esteira.',
          cta: 'Ver Medicina Ocupacional',
          to: '/chrismed/ocupacional',
        },
        {
          eyebrow: '03 · Internacional',
          title: 'GMS — Global Medical Support',
          context: 'Atendimento exclusivo a estrangeiros no Rio de Janeiro: assistência multilíngue, coordenação hospitalar e continuidade internacional.',
          audience: 'Estrangeiros, expatriados, consulados e famílias internacionais.',
          benefit: 'Um único ponto de contato clínico em português, inglês e espanhol.',
          cta: 'Ver GMS',
          to: '/chrismed/internacional',
        },
      ],
    },
    authority: {
      eyebrow: 'Sobre a Dra. Christiane',
      title: 'Uma prática construída paciente a paciente.',
      body: 'A Dra. Christiane Alencar dedica sua prática à medicina privada com foco em continuidade, escuta e precisão. A trajetória completa — formação, atuação, cooperações e produção científica — é apresentada em página dedicada, publicada somente com material verificado.',
      cta: 'Ler a página completa',
      quote: 'A medicina que pratico começa antes da consulta e continua depois dela.',
    },
    flow: {
      eyebrow: 'Como funciona',
      title: 'Cinco passos, sem intermediários.',
      lead: 'O fluxo será concluído dentro da própria CHRISMED. Você escolhe a modalidade, seleciona o horário, confirma os dados, realiza o pagamento quando aplicável e recebe a confirmação com instruções.',
      steps: [
        'Escolha a modalidade',
        'Selecione o horário',
        'Confirme os dados',
        'Pague, quando aplicável',
        'Receba confirmação',
      ],
      note: 'O agendamento reúne escolha da modalidade, horário, confirmação e orientações em uma única jornada dentro da CHRISMED.',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'Se preferir, converse antes de agendar.',
      lead: 'Oliver é o concierge digital da CHRISMED. Ele orienta a escolha da modalidade, ajuda no agendamento e responde dúvidas objetivas — em português, inglês ou espanhol.',
      bullets: [
        'Ajuda a escolher entre teleconsulta, presencial e domiciliar.',
        'Orienta o agendamento dentro do fluxo oficial da CHRISMED.',
        'Responde dúvidas administrativas e de acesso.',
        'Quando necessário, oferece WhatsApp dentro da própria janela — sem sair do concierge.',
      ],
      disclaimer: 'Oliver não substitui avaliação médica nem emite conduta clínica.',
    },
    close: {
      eyebrow: 'Próximo passo',
      title: 'Reservar um tempo',
      titleItalic: 'com a Dra. Christiane.',
      lead: 'Consulta privada em Copacabana, na sua casa ou por vídeo. Escolha a modalidade que preserva o seu tempo — o cuidado é o mesmo.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Falar com Oliver',
    },
  },
  en: {
    hero: {
      eyebrow: 'CHRISMED · Private medicine',
      title: 'Clinical care',
      titleItalic: 'that belongs to you.',
      lead: 'Consultations with Dr. Christiane Alencar in Copacabana, at your home, or by video. Dedicated time, attentive listening, and continuity — without haste or intermediaries.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Meet Dr. Alencar',
      oliverHint: 'Talk to Oliver first',
      modes: ['Telehealth', 'In-person · Copacabana', 'Home visit'],
      portraitAlt: 'Editorial portrait of Dr. Christiane Alencar',
      portraitEyebrow: 'Medical authority',
      portraitRole: 'Private medicine · Rio de Janeiro',
    },
    modalities: {
      eyebrow: 'How would you like to be seen',
      title: 'Three modalities designed around your routine.',
      lead: 'Each modality holds the same standard of listening, time, and care. The choice is about where and how — never about how much attention you receive.',
      cta: 'Book this modality',
      items: [
        {
          eyebrow: 'Video',
          title: 'Telehealth',
          description:
            'Video consultation with digital prescription and electronic records. Ideal for continuous follow-up and traveling patients.',
        },
        {
          eyebrow: 'Copacabana',
          title: 'In-person, Copacabana',
          description:
            'Private office, scheduled time slots and a discreet reception. Dedicated time before, during and after your visit.',
        },
        {
          eyebrow: 'Home · Hotel',
          title: 'Home visit',
          description:
            'Care at your home, hotel, or office, with the same clinical rigor and the privacy your routine demands.',
        },
      ],
    },
    experience: {
      eyebrow: 'AA standard',
      title: 'What changes when the time is yours.',
      lead: 'At CHRISMED, AA standard is a practice — not an adjective. It translates into concrete decisions around listening, continuity, and discretion.',
      items: [
        { title: 'Unhurried listening', body: 'Real time to talk, examine, and explain. No tight agendas, no squeezed-in visits.' },
        { title: 'Continuous attention', body: 'The same physician follows your history over time, with a proprietary record and integrated reading of your exams.' },
        { title: 'Follow-up between visits', body: 'Structured guidance after each visit and a direct channel for objective questions — always through CHRISMED.' },
        { title: 'Discretion', body: 'Private reception, encrypted data and full LGPD compliance. Your privacy is part of the protocol.' },
        { title: 'Clarity', body: 'Diagnoses, plans and alternatives explained without jargon. You understand every decision before making it.' },
        { title: 'Continuity', body: 'Referrals, exams and interconsultations coordinated by CHRISMED with partner laboratories and hospital networks.' },
      ],
    },
    verticals: {
      eyebrow: 'CHRISMED verticals',
      title: 'Three practices, one medicine.',
      audience: 'For whom',
      benefit: 'Benefit',
      items: [
        {
          eyebrow: '01 · Clinic',
          title: 'Ambulatory Medicine',
          context: 'Private consultations, longitudinal follow-up and coordination of exams and interconsultations.',
          audience: 'Patients seeking a reference physician in Copacabana, Rio de Janeiro or remotely.',
          benefit: 'Clinical continuity with a single physician over time.',
          cta: 'Discover the clinic',
          to: '/chrismed/clinica',
        },
        {
          eyebrow: '02 · Business',
          title: 'Occupational Medicine',
          context: 'Structured occupational programs — PCMSO, ASO, screening and follow-up — held to the same standard as our private consultations.',
          audience: 'Companies and families seeking discreet occupational health without mass outsourcing.',
          benefit: 'Regulatory compliance paired with humane care, far from assembly-line logic.',
          cta: 'See Occupational Medicine',
          to: '/chrismed/ocupacional',
        },
        {
          eyebrow: '03 · International',
          title: 'GMS — Global Medical Support',
          context: 'Exclusive service for foreigners in Rio de Janeiro: multilingual assistance, hospital coordination and international continuity.',
          audience: 'Foreigners, expats, consulates and international families.',
          benefit: 'A single clinical point of contact in Portuguese, English and Spanish.',
          cta: 'See GMS',
          to: '/chrismed/internacional',
        },
      ],
    },
    authority: {
      eyebrow: 'About Dr. Alencar',
      title: 'A practice built patient by patient.',
      body: 'Dr. Christiane Alencar dedicates her practice to private medicine with a focus on continuity, listening and precision. Her full trajectory — training, practice, collaborations and scientific work — is presented on a dedicated page, published only with verified material.',
      cta: 'Read the full page',
      quote: 'The medicine I practice begins before the consultation and continues after it.',
    },
    flow: {
      eyebrow: 'How it works',
      title: 'Five steps, no intermediaries.',
      lead: 'The flow will be completed entirely within CHRISMED. You choose the modality, select a time, confirm your data, pay when applicable and receive the confirmation with instructions.',
      steps: [
        'Choose the modality',
        'Select a time',
        'Confirm your data',
        'Pay, when applicable',
        'Receive confirmation',
      ],
      note: 'Booking brings modality choice, scheduling, confirmation and instructions into a single journey inside CHRISMED.',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'If you prefer, talk before booking.',
      lead: 'Oliver is CHRISMED’s digital concierge. He guides your choice of modality, helps with booking and answers objective questions — in Portuguese, English or Spanish.',
      bullets: [
        'Helps you choose between telehealth, in-person and home visit.',
        'Guides booking inside CHRISMED’s official flow.',
        'Answers administrative and access questions.',
        'When needed, offers WhatsApp inside the same window — never leaving the concierge.',
      ],
      disclaimer: 'Oliver does not replace medical assessment or issue clinical guidance.',
    },
    close: {
      eyebrow: 'Next step',
      title: 'Reserve time',
      titleItalic: 'with Dr. Alencar.',
      lead: 'Private consultation in Copacabana, at your home, or by video. Choose the modality that fits your time — the care is the same.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Talk to Oliver',
    },
  },
  es: {
    hero: {
      eyebrow: 'CHRISMED · Medicina privada',
      title: 'Un cuidado clínico',
      titleItalic: 'que le pertenece.',
      lead: 'Consultas con la Dra. Christiane Alencar en Copacabana, en su casa o por video. Tiempo dedicado, escucha atenta y continuidad — sin prisa ni intermediarios.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Conocer a la Dra. Alencar',
      oliverHint: 'Hablar antes con Oliver',
      modes: ['Teleconsulta', 'Presencial · Copacabana', 'Visita a domicilio'],
      portraitAlt: 'Retrato editorial de la Dra. Christiane Alencar',
      portraitEyebrow: 'Autoridad médica',
      portraitRole: 'Medicina privada · Río de Janeiro',
    },
    modalities: {
      eyebrow: 'Cómo desea ser atendido',
      title: 'Tres modalidades pensadas para su rutina.',
      lead: 'Cada modalidad conserva el mismo estándar de escucha, tiempo y cuidado. La elección es sobre dónde y cómo — nunca sobre cuánta atención recibe.',
      cta: 'Agendar en esta modalidad',
      items: [
        {
          eyebrow: 'Video',
          title: 'Teleconsulta',
          description:
            'Consulta por video con receta digital e historia clínica electrónica. Ideal para seguimiento continuo y pacientes en viaje.',
        },
        {
          eyebrow: 'Copacabana',
          title: 'Presencial en Copacabana',
          description:
            'Consultorio reservado, agenda con horario y recepción discreta. Tiempo dedicado antes, durante y después de la consulta.',
        },
        {
          eyebrow: 'Casa · Hotel',
          title: 'Visita a domicilio',
          description:
            'Atención en su residencia, hotel u oficina, con el mismo rigor clínico y la privacidad que su rutina exige.',
        },
      ],
    },
    experience: {
      eyebrow: 'Estándar AA',
      title: 'Lo que cambia cuando el tiempo de la consulta es suyo.',
      lead: 'En CHRISMED, estándar AA es una práctica — no un adjetivo. Se traduce en decisiones concretas sobre escucha, continuidad y discreción.',
      items: [
        { title: 'Escucha sin prisa', body: 'Tiempo real para conversar, examinar y explicar. Sin agenda apretada ni consulta encajada.' },
        { title: 'Atención continua', body: 'La misma médica acompaña su historia a lo largo del tiempo, con historia clínica propia y lectura integrada de los exámenes.' },
        { title: 'Seguimiento entre consultas', body: 'Orientación estructurada después de la consulta y canal directo para dudas objetivas — siempre por CHRISMED.' },
        { title: 'Discreción', body: 'Recepción reservada, datos cifrados y cumplimiento total de la LGPD. Su privacidad es parte del protocolo.' },
        { title: 'Claridad', body: 'Diagnósticos, conductas y alternativas explicados sin jerga. Usted entiende cada decisión antes de tomarla.' },
        { title: 'Continuidad', body: 'Derivaciones, exámenes e interconsultas coordinadas por CHRISMED con laboratorios y redes hospitalarias asociadas.' },
      ],
    },
    verticals: {
      eyebrow: 'Vertientes CHRISMED',
      title: 'Tres frentes, una sola medicina.',
      audience: 'Para quién',
      benefit: 'Beneficio',
      items: [
        {
          eyebrow: '01 · Clínica',
          title: 'Medicina Ambulatoria',
          context: 'Consultas privadas, seguimiento longitudinal y coordinación de exámenes e interconsultas.',
          audience: 'Pacientes que buscan una médica de referencia en Copacabana, en Río de Janeiro o a distancia.',
          benefit: 'Continuidad clínica con una única médica a lo largo del tiempo.',
          cta: 'Conocer la clínica',
          to: '/chrismed/clinica',
        },
        {
          eyebrow: '02 · Empresas',
          title: 'Medicina Ocupacional',
          context: 'Programas ocupacionales estructurados: PCMSO, ASO, seguimiento y triaje — con el mismo estándar clínico de nuestras consultas privadas.',
          audience: 'Empresas y familias que contratan salud ocupacional discreta y sin tercerización masiva.',
          benefit: 'Cumplimiento regulatorio con atención humana, lejos de la lógica de línea de montaje.',
          cta: 'Ver Medicina Ocupacional',
          to: '/chrismed/ocupacional',
        },
        {
          eyebrow: '03 · Internacional',
          title: 'GMS — Global Medical Support',
          context: 'Atención exclusiva a extranjeros en Río de Janeiro: asistencia multilingüe, coordinación hospitalaria y continuidad internacional.',
          audience: 'Extranjeros, expatriados, consulados y familias internacionales.',
          benefit: 'Un único punto de contacto clínico en portugués, inglés y español.',
          cta: 'Ver GMS',
          to: '/chrismed/internacional',
        },
      ],
    },
    authority: {
      eyebrow: 'Sobre la Dra. Alencar',
      title: 'Una práctica construida paciente a paciente.',
      body: 'La Dra. Christiane Alencar dedica su práctica a la medicina privada con foco en continuidad, escucha y precisión. Su trayectoria completa — formación, actuación, cooperaciones y producción científica — se presenta en una página dedicada, publicada solo con material verificado.',
      cta: 'Leer la página completa',
      quote: 'La medicina que practico comienza antes de la consulta y continúa después de ella.',
    },
    flow: {
      eyebrow: 'Cómo funciona',
      title: 'Cinco pasos, sin intermediarios.',
      lead: 'El flujo se concluirá dentro de la propia CHRISMED. Usted elige la modalidad, selecciona el horario, confirma sus datos, paga cuando corresponda y recibe la confirmación con instrucciones.',
      steps: [
        'Elija la modalidad',
        'Seleccione el horario',
        'Confirme los datos',
        'Pague, cuando corresponda',
        'Reciba confirmación',
      ],
      note: 'El agendamiento reúne la elección de modalidad, horario, confirmación e instrucciones en un único recorrido dentro de CHRISMED.',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'Si prefiere, converse antes de agendar.',
      lead: 'Oliver es el concierge digital de CHRISMED. Orienta la elección de la modalidad, ayuda con la agenda y responde dudas objetivas — en portugués, inglés o español.',
      bullets: [
        'Ayuda a elegir entre teleconsulta, presencial y domiciliaria.',
        'Orienta el agendamiento dentro del flujo oficial de CHRISMED.',
        'Responde dudas administrativas y de acceso.',
        'Cuando es necesario, ofrece WhatsApp dentro de la misma ventana — sin salir del concierge.',
      ],
      disclaimer: 'Oliver no sustituye la evaluación médica ni emite conducta clínica.',
    },
    close: {
      eyebrow: 'Próximo paso',
      title: 'Reservar un tiempo',
      titleItalic: 'con la Dra. Alencar.',
      lead: 'Consulta privada en Copacabana, en su casa o por video. Elija la modalidad que preserva su tiempo — el cuidado es el mismo.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Hablar con Oliver',
    },
  },
};
