/**
 * /chrismed/clinica — Medicina Ambulatorial (Onda V3.a · Quiet Luxury)
 *
 * Jornada dedicada à consulta particular com a Dra. Christiane Alencar.
 * Substitui integralmente a antiga página corporativa (arquivada em
 * src/content/chrismed/_archive/clinica-v2-corporate.tsx.txt).
 *
 * Guardrails V3.a:
 *  - Somente primitivos CHRISMED (src/components/chrismed/primitives).
 *  - Nenhum CTA público aponta ao WhatsApp; Oliver é o único ponto de conversa.
 *  - Sem preços fixos, sem promessas, sem placeholders visíveis.
 *  - Nenhuma orientação clínica: sem diagnóstico, prescrição, prognóstico
 *    ou afirmação de que uma modalidade é "sempre a melhor".
 *  - CTA primário → /chrismed/agendar. Secundário → evento
 *    `chrismed:oliver:open` (via ChrismedOliverLauncher / botão editorial).
 *  - Copy neutra: sem "em consolidação", "em desenvolvimento" ou linguagem
 *    técnica ao paciente.
 *
 * Pendências registradas para o Codex / próximas ondas:
 *  - Rota canônica futura recomendada: `/chrismed/medicina-ambulatorial`,
 *    com `/chrismed/clinica` preservada como redirect permanente. Não
 *    implementar 301 antes da validação do Codex (sitemap + canonical +
 *    links internos + prevenção de duplicate content).
 *  - Confirmar disponibilidade real por modalidade quando a agenda estiver
 *    contratada; hoje o texto descreve a jornada sem prometer horários.
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ChrismedShell, useLang, type Lang } from '@/components/chrismed/ChrismedShell';
import {
  ChrismedSection,
  ChrismedHeading,
  ChrismedEyebrow,
  ChrismedButton,
  ChrismedCard,
  ChrismedModalityCard,
  ChrismedOliverLauncher,
} from '@/components/chrismed/primitives';
import { CHRISMED_DOCTOR } from '@/content/chrismed/identity';
import { openChrismedOliver, setChrismedOliverContext } from '@/components/chrismed/oliver-store';

export const Route = createFileRoute('/chrismed/clinica')({
  head: () => ({
    meta: [
      {
        title:
          'Medicina Ambulatorial — CHRISMED · Dra. Christiane Alencar',
      },
      {
        name: 'description',
        content:
          'Consulta particular com a Dra. Christiane Alencar em três modalidades: teleconsulta, presencial em Copacabana e visita domiciliar. Atendimento clínico contínuo, discreto e organizado.',
      },
      {
        property: 'og:title',
        content: 'Medicina Ambulatorial — CHRISMED',
      },
      {
        property: 'og:description',
        content:
          'Teleconsulta, presencial em Copacabana e visita domiciliar com a Dra. Christiane Alencar.',
      },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:url',
        content: 'https://chrismed.impulsionando.com.br/chrismed/clinica',
      },
      { property: 'og:site_name', content: 'CHRISMED' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Medicina Ambulatorial — CHRISMED' },
      {
        name: 'twitter:description',
        content:
          'Consulta particular com a Dra. Christiane Alencar: teleconsulta, presencial em Copacabana e visita domiciliar.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://chrismed.impulsionando.com.br/chrismed/clinica',
      },
    ],
  }),
  component: ChrismedAmbulatorialPage,
});

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

function ChrismedAmbulatorialPage() {
  const lang = useLang();
  const t = COPY[lang];

  // Contexto do Oliver quando aberto a partir desta página. O backend do
  // Oliver não é alterado; apenas publicamos uma "dica" leve via evento.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail = {
      context: 'ambulatorial',
      greeting: t.oliver.contextGreeting,
      quickReplies: t.oliver.quickReplies,
    };
    setChrismedOliverContext(detail);
    window.dispatchEvent(
      new CustomEvent('chrismed:oliver:context', { detail }),
    );
  }, [t]);

  return (
    <ChrismedShell>
      {/* ─────────── 1 · Hero editorial ─────────── */}
      <ChrismedSection tone="ivory" className="pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-left">
          <ChrismedEyebrow>{t.hero.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={1} className="mt-6">
            {t.hero.title}{' '}
            <span className="chrismed-serif italic text-[var(--chrismed-graphite)]">
              {t.hero.titleItalic}
            </span>
          </ChrismedHeading>
          <p className="chrismed-sans mt-8 max-w-[46ch] text-base leading-relaxed text-[var(--chrismed-graphite)] md:text-lg">
            {t.hero.lead}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/chrismed/agendar" className="inline-flex">
              <ChrismedButton size="lg">{t.hero.ctaPrimary}</ChrismedButton>
            </Link>
            <ChrismedButton
              size="lg"
              variant="ghost"
              onClick={openOliver}
              aria-label={t.hero.ctaSecondary}
            >
              {t.hero.ctaSecondary}
            </ChrismedButton>
          </div>
          <ul className="chrismed-sans mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
            {t.hero.modes.map((m) => (
              <li key={m}>· {m}</li>
            ))}
          </ul>
        </div>
      </ChrismedSection>

      {/* ─────────── 2 · Para quem é o atendimento ─────────── */}
      <ChrismedSection tone="bone">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.audience.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.audience.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 max-w-[48ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.audience.lead}
            </p>
            <p className="chrismed-sans mt-6 max-w-[48ch] text-xs italic leading-relaxed text-[var(--chrismed-mist)]">
              {t.audience.note}
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {t.audience.items.map((item, i) => (
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

      {/* ─────────── 3 · Como funciona o cuidado ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.care.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.care.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.care.lead}
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.care.pillars.map((p) => (
            <ChrismedCard key={p.title}>
              <ChrismedEyebrow>{p.eyebrow}</ChrismedEyebrow>
              <h3 className="chrismed-serif mt-4 text-2xl font-light text-[var(--chrismed-ink)]">
                {p.title}
              </h3>
              <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                {p.body}
              </p>
            </ChrismedCard>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── 4 · Modalidades ─────────── */}
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
            <article key={m.title} className="flex flex-col">
              <ChrismedModalityCard
                index={i + 1}
                eyebrow={m.eyebrow}
                title={m.title}
                description={m.description}
              />
              <dl className="chrismed-sans mt-6 space-y-4 text-xs leading-relaxed text-[var(--chrismed-graphite)]">
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
                    {t.modalities.labels.audience}
                  </dt>
                  <dd className="mt-1">{m.audience}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
                    {t.modalities.labels.how}
                  </dt>
                  <dd className="mt-1">{m.how}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
                    {t.modalities.labels.where}
                  </dt>
                  <dd className="mt-1">{m.where}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
                    {t.modalities.labels.notice}
                  </dt>
                  <dd className="mt-1">{m.notice}</dd>
                </div>
              </dl>
              <div className="mt-auto pt-8">
                <Link
                  to="/chrismed/agendar"
                  className="chrismed-sans inline-flex items-center gap-2 border-b border-[var(--chrismed-sand)] pb-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)]"
                >
                  {t.modalities.next}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── 5 · O que esperar da consulta ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.expect.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.expect.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.expect.lead}
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {t.expect.items.map((item, i) => (
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

      {/* ─────────── 6 · Continuidade e acompanhamento ─────────── */}
      <ChrismedSection tone="bone">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.continuity.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.continuity.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.continuity.body}
            </p>
            <ul className="chrismed-sans mt-6 space-y-3 text-sm text-[var(--chrismed-graphite)]">
              {t.continuity.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span aria-hidden className="text-[var(--chrismed-champagne-deep)]">·</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l border-[var(--chrismed-champagne)] pl-8">
            <p className="chrismed-serif text-2xl font-light italic leading-relaxed text-[var(--chrismed-ink)]">
              “{t.continuity.quote}”
            </p>
            <p className="chrismed-sans mt-6 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
              {CHRISMED_DOCTOR.shortName}
            </p>
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── 7 · Como funciona o agendamento ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.flow.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.flow.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-5 text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.flow.lead}
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3 lg:grid-cols-6">
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

      {/* ─────────── 8 · Oliver contextual ─────────── */}
      <ChrismedSection tone="bone">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.oliver.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.oliver.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.oliver.contextGreeting}
            </p>
            <ul className="chrismed-sans mt-6 grid gap-2 sm:grid-cols-2">
              {t.oliver.quickReplies.map((q) => (
                <li
                  key={q}
                  className="border border-[var(--chrismed-sand)] px-4 py-2 text-xs text-[var(--chrismed-graphite)]"
                >
                  {q}
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

      {/* ─────────── 9 · CTA final ─────────── */}
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
            <ChrismedButton
              size="lg"
              variant="ghost"
              onClick={openOliver}
              className="border-[var(--chrismed-champagne)]/40 text-[var(--chrismed-ivory)] hover:bg-[var(--chrismed-ivory)]/5"
            >
              {t.close.ctaSecondary}
            </ChrismedButton>
          </div>
        </div>
      </ChrismedSection>
    </ChrismedShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COPY — PT · EN · ES
// Sem promessas clínicas, sem preços, sem linguagem técnica ao paciente.
// ─────────────────────────────────────────────────────────────────────────

type Copy = {
  hero: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    modes: string[];
  };
  audience: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    items: { title: string; body: string }[];
  };
  care: {
    eyebrow: string;
    title: string;
    lead: string;
    pillars: { eyebrow: string; title: string; body: string }[];
  };
  modalities: {
    eyebrow: string;
    title: string;
    lead: string;
    next: string;
    labels: { audience: string; how: string; where: string; notice: string };
    items: {
      eyebrow: string;
      title: string;
      description: string;
      audience: string;
      how: string;
      where: string;
      notice: string;
    }[];
  };
  expect: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  continuity: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    quote: string;
  };
  flow: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: string[];
    note: string;
  };
  oliver: {
    eyebrow: string;
    title: string;
    contextGreeting: string;
    quickReplies: string[];
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
      eyebrow: 'Medicina Ambulatorial',
      title: 'Um cuidado clínico',
      titleItalic: 'sereno, contínuo e feito para você.',
      lead: 'Consulta particular com a Dra. Christiane Alencar em três formatos — online, presencial em Copacabana ou domiciliar onde você estiver.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Falar com Oliver',
      modes: ['Teleconsulta', 'Presencial · Copacabana', 'Consulta domiciliar'],
    },
    audience: {
      eyebrow: 'Para quem é',
      title: 'Pensado para quem valoriza tempo, escuta e continuidade.',
      lead: 'A medicina ambulatorial da CHRISMED atende pessoas que buscam um espaço clínico organizado, discreto e disponível — sem filas, sem pressa e com acompanhamento entre consultas.',
      note: 'Este espaço é uma orientação inicial. A avaliação médica é sempre individual.',
      items: [
        {
          title: 'Acompanhamento contínuo',
          body: 'Quem deseja um médico de referência para conduzir cuidados regulares e revisões periódicas.',
        },
        {
          title: 'Segunda opinião serena',
          body: 'Para revisar um plano em curso e organizar decisões clínicas com mais clareza.',
        },
        {
          title: 'Retorno após atendimento',
          body: 'Continuidade estruturada após alta hospitalar, exames recentes ou outra especialidade.',
        },
        {
          title: 'Famílias e visitantes',
          body: 'Residentes no Rio, brasileiros no exterior e visitantes internacionais em passagem pela cidade.',
        },
      ],
    },
    care: {
      eyebrow: 'Como funciona o cuidado',
      title: 'Três princípios que sustentam cada atendimento.',
      lead: 'Não trabalhamos com consultas avulsas soltas. Cada encontro está ancorado em uma prática de escuta, organização e continuidade.',
      pillars: [
        {
          eyebrow: '01',
          title: 'Escuta clínica ampla',
          body: 'Tempo dedicado para entender contexto, sintomas, hábitos e história — antes de qualquer conduta.',
        },
        {
          eyebrow: '02',
          title: 'Organização do plano',
          body: 'Registro claro, orientações escritas e passos definidos entre consultas, exames e retornos.',
        },
        {
          eyebrow: '03',
          title: 'Continuidade discreta',
          body: 'Um canal único para dúvidas administrativas e acompanhamento entre atendimentos, sem exposição.',
        },
      ],
    },
    modalities: {
      eyebrow: 'Modalidades',
      title: 'Escolha o formato que faz mais sentido para o seu momento.',
      lead: 'Nenhuma modalidade é "melhor" em si — cada uma responde melhor a um contexto. Oliver pode ajudar a decidir, mas a definição final é sempre sua e do quadro clínico.',
      next: 'Agendar nesta modalidade',
      labels: {
        audience: 'Costuma ser adequada para',
        how: 'Como ocorre',
        where: 'Onde acontece',
        notice: 'O que saber antes',
      },
      items: [
        {
          eyebrow: '01',
          title: 'Teleconsulta',
          description:
            'Atendimento clínico por vídeo, em ambiente privado, sem deslocamento.',
          audience:
            'Situações que não exigem exame físico presencial, revisão de exames, orientações e acompanhamento.',
          how: 'Consulta por videochamada em plataforma segura, com registro e orientações escritas ao final.',
          where: 'De qualquer lugar com internet estável e um ambiente reservado.',
          notice:
            'Alguns quadros podem exigir avaliação presencial complementar — isso é combinado durante a consulta.',
        },
        {
          eyebrow: '02',
          title: 'Presencial em Copacabana',
          description:
            'Consulta presencial em ambiente discreto, no coração do Rio de Janeiro.',
          audience:
            'Primeira avaliação detalhada, exame físico ou acompanhamento presencial regular.',
          how: 'Atendimento privado, com tempo dedicado e organização do plano ao final.',
          where: 'Espaço clínico em Copacabana, com fácil acesso e privacidade preservada.',
          notice:
            'A agenda presencial tem disponibilidade específica; Oliver ajuda a identificar o próximo horário adequado.',
        },
        {
          eyebrow: '03',
          title: 'Consulta domiciliar',
          description:
            'Atendimento domiciliar onde você estiver, com discrição.',
          audience:
            'Restrição de mobilidade, recuperação recente, cuidado a familiares ou preferência pelo próprio ambiente.',
          how: 'Consulta presencial no local confirmado, com estrutura clínica portátil e tempo dedicado.',
          where: 'Rio de Janeiro e regiões atendidas — confirmadas antes do agendamento.',
          notice:
            'Alguns exames ou procedimentos podem exigir complemento em ambiente clínico; isso é indicado no plano.',
        },
      ],
    },
    expect: {
      eyebrow: 'O que esperar da consulta',
      title: 'Um encontro clínico que respeita seu tempo e sua história.',
      lead: 'A consulta é conduzida sem pressa, com registro cuidadoso e orientações claras — para que você saia com um plano compreensível, não apenas com uma prescrição.',
      items: [
        {
          title: 'Antes',
          body: 'Confirmação, orientações de preparo quando necessárias e espaço para adiantar informações relevantes.',
        },
        {
          title: 'Durante',
          body: 'Escuta ampla, exame quando indicado e discussão aberta das opções de conduta.',
        },
        {
          title: 'Fechamento',
          body: 'Resumo do plano, orientações escritas e definição dos próximos passos com prazos.',
        },
        {
          title: 'Depois',
          body: 'Canal administrativo para dúvidas de rotina, encaminhamentos e organização de retornos.',
        },
      ],
    },
    continuity: {
      eyebrow: 'Continuidade e acompanhamento',
      title: 'Uma consulta que não termina quando a porta se fecha.',
      body: 'A CHRISMED se diferencia por manter linha de cuidado entre os atendimentos. Você não recomeça a história a cada visita — o histórico, os exames e as orientações caminham juntos.',
      bullets: [
        'Registro clínico organizado e acessível ao médico assistente.',
        'Canal administrativo único para dúvidas, retornos e agendamentos.',
        'Integração cuidadosa entre teleconsulta, presencial e domiciliar.',
        'Orientações claras antes e depois de cada consulta.',
      ],
      quote:
        'Cuidar bem é lembrar do paciente entre uma consulta e outra, não apenas no dia do atendimento.',
    },
    flow: {
      eyebrow: 'Agendamento',
      title: 'Como funciona o agendamento.',
      lead: 'Uma jornada simples, pensada para respeitar seu tempo e proteger sua privacidade.',
      steps: [
        'Escolher a modalidade',
        'Consultar disponibilidade',
        'Selecionar o horário',
        'Confirmar seus dados',
        'Concluir o atendimento conforme as opções disponíveis',
        'Receber orientações',
      ],
      note: 'Formas de pagamento e opções específicas de cada modalidade são apresentadas durante o agendamento. Nenhum dado sensível é solicitado fora desse fluxo.',
    },
    oliver: {
      eyebrow: 'Oliver',
      title: 'Ajuda a escolher o formato — sem substituir a consulta.',
      contextGreeting:
        'Posso ajudar você a escolher entre teleconsulta, atendimento presencial em Copacabana ou consulta domiciliar.',
      quickReplies: [
        'Quero agendar',
        'Teleconsulta',
        'Presencial em Copacabana',
        'Consulta domiciliar',
        'Tenho uma dúvida',
        'Falar com a equipe',
      ],
      disclaimer:
        'Oliver oferece apoio administrativo. Não diagnostica, não prescreve e não substitui avaliação médica.',
    },
    close: {
      eyebrow: 'Próximo passo',
      title: 'Quando quiser começar,',
      titleItalic: 'estamos prontos para receber você.',
      lead: 'Escolha a modalidade que mais se aproxima do seu momento. Se preferir, converse antes com Oliver — ele ajuda a organizar.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Falar com Oliver',
    },
  },
  en: {
    hero: {
      eyebrow: 'Outpatient Medicine',
      title: 'Clinical care that is',
      titleItalic: 'calm, continuous and made for you.',
      lead: 'Private consultation with Dr. Christiane Alencar in three formats — meeting you where you feel most comfortable: online, in person in Copacabana or at your home.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Talk to Oliver',
      modes: ['Teleconsultation', 'In person · Copacabana', 'Home visit'],
    },
    audience: {
      eyebrow: 'Who it is for',
      title: 'Designed for people who value time, listening and continuity.',
      lead: 'CHRISMED outpatient medicine welcomes people looking for a discreet, organized and available clinical space — with no queues, no rush and follow-up between visits.',
      note: 'This is initial guidance only. Medical evaluation is always individual.',
      items: [
        { title: 'Ongoing follow-up', body: 'A reference physician to guide regular care and periodic reviews.' },
        { title: 'Calm second opinion', body: 'A structured review of an ongoing plan, to organize clinical decisions.' },
        { title: 'After another visit', body: 'Structured continuity after hospital discharge, recent exams or another specialty.' },
        { title: 'Families and visitors', body: 'Rio residents, Brazilians abroad and international visitors passing through the city.' },
      ],
    },
    care: {
      eyebrow: 'How care works',
      title: 'Three principles behind every visit.',
      lead: 'We do not offer disconnected one-off consultations. Every encounter is grounded in listening, organization and continuity.',
      pillars: [
        { eyebrow: '01', title: 'Broad clinical listening', body: 'Time to understand context, symptoms, habits and history — before any decision.' },
        { eyebrow: '02', title: 'Organized plan', body: 'Clear notes, written guidance and defined steps between visits, exams and follow-ups.' },
        { eyebrow: '03', title: 'Discreet continuity', body: 'A single channel for administrative questions and follow-up between visits, with privacy.' },
      ],
    },
    modalities: {
      eyebrow: 'Modalities',
      title: 'Choose the format that fits your moment.',
      lead: 'No modality is inherently "better" — each one suits a different context. Oliver can help you decide, but the final choice is always yours and the clinical picture.',
      next: 'Book in this modality',
      labels: {
        audience: 'Usually suitable for',
        how: 'How it happens',
        where: 'Where it happens',
        notice: 'What to know beforehand',
      },
      items: [
        {
          eyebrow: '01',
          title: 'Teleconsultation',
          description: 'Clinical care by video, in a private setting, with no commute.',
          audience: 'Situations that do not require in-person physical exam, exam reviews, guidance and follow-up.',
          how: 'Video consultation on a secure platform, with notes and written guidance at the end.',
          where: 'Anywhere with a stable connection and a private space.',
          notice: 'Some situations may require a complementary in-person visit — this is discussed during the call.',
        },
        {
          eyebrow: '02',
          title: 'In person · Copacabana',
          description: 'In-person consultation in a discreet space in the heart of Rio de Janeiro.',
          audience: 'A detailed first evaluation, physical exam or regular in-person follow-up.',
          how: 'Private care, unhurried, with the plan organized at the end.',
          where: 'Clinical space in Copacabana, easy to reach and privacy-preserving.',
          notice: 'In-person availability is limited; Oliver helps identify the next suitable slot.',
        },
        {
          eyebrow: '03',
          title: 'Home visit',
          description: 'Care wherever you are, with discretion.',
          audience: 'Limited mobility, recent recovery, care for family members or preference for your own space.',
          how: 'In-person consultation at home with portable clinical structure and dedicated time.',
          where: 'Rio de Janeiro and served areas — confirmed before booking.',
          notice: 'Some exams or procedures may require complementary clinical setting; this is noted in the plan.',
        },
      ],
    },
    expect: {
      eyebrow: 'What to expect',
      title: 'A clinical encounter that respects your time and your history.',
      lead: 'The visit is unhurried, carefully documented and closed with clear guidance — so you leave with an understandable plan, not just a prescription.',
      items: [
        { title: 'Before', body: 'Confirmation, preparation guidance when needed and space to share relevant information.' },
        { title: 'During', body: 'Broad listening, exam when indicated and open discussion of the options.' },
        { title: 'Closing', body: 'Plan summary, written guidance and next steps with timelines.' },
        { title: 'After', body: 'An administrative channel for routine questions, referrals and follow-up scheduling.' },
      ],
    },
    continuity: {
      eyebrow: 'Continuity and follow-up',
      title: 'A visit that does not end when the door closes.',
      body: 'CHRISMED stands apart by keeping a line of care between visits. You do not start your story over each time — history, exams and guidance travel together.',
      bullets: [
        'Organized clinical record available to the attending physician.',
        'Single administrative channel for questions, follow-ups and bookings.',
        'Careful integration between teleconsultation, in-person and home care.',
        'Clear guidance before and after every visit.',
      ],
      quote:
        'Caring well means remembering the patient between visits, not only on the day of the appointment.',
    },
    flow: {
      eyebrow: 'Booking',
      title: 'How booking works.',
      lead: 'A simple journey, designed to respect your time and protect your privacy.',
      steps: [
        'Choose the modality',
        'Check availability',
        'Select a time',
        'Confirm your details',
        'Complete the booking with the available options',
        'Receive guidance',
      ],
      note: 'Payment methods and options specific to each modality are shown during booking. No sensitive data is requested outside this flow.',
    },
    oliver: {
      eyebrow: 'Oliver',
      title: 'Helps you choose the format — never replaces the visit.',
      contextGreeting:
        'I can help you choose between teleconsultation, in-person care in Copacabana or a home visit.',
      quickReplies: [
        'I want to book',
        'Teleconsultation',
        'In person · Copacabana',
        'Home visit',
        'I have a question',
        'Talk to the team',
      ],
      disclaimer:
        'Oliver offers administrative support. He does not diagnose, prescribe or replace medical evaluation.',
    },
    close: {
      eyebrow: 'Next step',
      title: 'Whenever you are ready,',
      titleItalic: 'we are ready to welcome you.',
      lead: 'Pick the modality closest to your moment. If you prefer, talk with Oliver first — he helps organize things.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Talk to Oliver',
    },
  },
  es: {
    hero: {
      eyebrow: 'Medicina Ambulatoria',
      title: 'Un cuidado clínico',
      titleItalic: 'sereno, continuo y pensado para usted.',
      lead: 'Consulta particular con la Dra. Christiane Alencar en tres formatos — en línea, presencial en Copacabana o a domicilio donde usted esté.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Hablar con Oliver',
      modes: ['Teleconsulta', 'Presencial · Copacabana', 'Consulta a domicilio'],
    },
    audience: {
      eyebrow: 'Para quién es',
      title: 'Pensado para quienes valoran tiempo, escucha y continuidad.',
      lead: 'La medicina ambulatoria de CHRISMED recibe a personas que buscan un espacio clínico organizado, discreto y disponible — sin filas, sin prisa y con seguimiento entre consultas.',
      note: 'Esta es una orientación inicial. La evaluación médica es siempre individual.',
      items: [
        { title: 'Seguimiento continuo', body: 'Un médico de referencia para conducir cuidados regulares y revisiones periódicas.' },
        { title: 'Segunda opinión serena', body: 'Revisar un plan en curso y organizar decisiones clínicas con más claridad.' },
        { title: 'Después de otra atención', body: 'Continuidad estructurada tras alta hospitalaria, exámenes recientes u otra especialidad.' },
        { title: 'Familias y visitantes', body: 'Residentes en Río, brasileños en el exterior y visitantes internacionales de paso por la ciudad.' },
      ],
    },
    care: {
      eyebrow: 'Cómo funciona el cuidado',
      title: 'Tres principios que sostienen cada atención.',
      lead: 'No trabajamos con consultas sueltas. Cada encuentro está sostenido en escucha, organización y continuidad.',
      pillars: [
        { eyebrow: '01', title: 'Escucha clínica amplia', body: 'Tiempo dedicado a entender contexto, síntomas, hábitos e historia — antes de cualquier conducta.' },
        { eyebrow: '02', title: 'Plan organizado', body: 'Registro claro, orientaciones escritas y pasos definidos entre consultas, exámenes y retornos.' },
        { eyebrow: '03', title: 'Continuidad discreta', body: 'Un canal único para dudas administrativas y seguimiento entre atenciones, sin exposición.' },
      ],
    },
    modalities: {
      eyebrow: 'Modalidades',
      title: 'Elija el formato que hace más sentido para su momento.',
      lead: 'Ninguna modalidad es "mejor" en sí — cada una responde a un contexto distinto. Oliver puede ayudar a decidir, pero la elección final es siempre suya y del cuadro clínico.',
      next: 'Agendar en esta modalidad',
      labels: {
        audience: 'Suele ser adecuada para',
        how: 'Cómo ocurre',
        where: 'Dónde ocurre',
        notice: 'Qué saber antes',
      },
      items: [
        {
          eyebrow: '01',
          title: 'Teleconsulta',
          description: 'Atención clínica por video, en ambiente privado, sin desplazamiento.',
          audience: 'Situaciones que no exigen examen físico presencial, revisión de exámenes, orientaciones y seguimiento.',
          how: 'Consulta por videollamada en plataforma segura, con registro y orientaciones escritas al final.',
          where: 'Desde cualquier lugar con conexión estable y un espacio reservado.',
          notice: 'Algunos cuadros pueden requerir evaluación presencial complementaria — se conversa durante la consulta.',
        },
        {
          eyebrow: '02',
          title: 'Presencial en Copacabana',
          description: 'Consulta presencial en un espacio discreto, en el corazón de Río de Janeiro.',
          audience: 'Primera evaluación detallada, examen físico o seguimiento presencial regular.',
          how: 'Atención privada, con tiempo dedicado y organización del plan al final.',
          where: 'Espacio clínico en Copacabana, con fácil acceso y privacidad preservada.',
          notice: 'La agenda presencial tiene disponibilidad específica; Oliver ayuda a identificar el próximo horario adecuado.',
        },
        {
          eyebrow: '03',
          title: 'Consulta a domicilio',
          description: 'Atención donde usted esté, con discreción.',
          audience: 'Restricción de movilidad, recuperación reciente, cuidado de familiares o preferencia por el propio ambiente.',
          how: 'Consulta presencial en el lugar confirmado, con estructura clínica portátil y tiempo dedicado.',
          where: 'Río de Janeiro y regiones atendidas — confirmadas antes del agendamiento.',
          notice: 'Algunos exámenes o procedimientos pueden requerir complemento en ambiente clínico; se indica en el plan.',
        },
      ],
    },
    expect: {
      eyebrow: 'Qué esperar de la consulta',
      title: 'Un encuentro clínico que respeta su tiempo y su historia.',
      lead: 'La consulta es sin prisa, con registro cuidadoso y orientaciones claras — para salir con un plan comprensible, no solo con una prescripción.',
      items: [
        { title: 'Antes', body: 'Confirmación, orientaciones de preparación cuando necesarias y espacio para adelantar información relevante.' },
        { title: 'Durante', body: 'Escucha amplia, examen cuando esté indicado y discusión abierta de las opciones.' },
        { title: 'Cierre', body: 'Resumen del plan, orientaciones escritas y definición de los próximos pasos con plazos.' },
        { title: 'Después', body: 'Canal administrativo para dudas de rutina, derivaciones y organización de retornos.' },
      ],
    },
    continuity: {
      eyebrow: 'Continuidad y seguimiento',
      title: 'Una consulta que no termina al cerrar la puerta.',
      body: 'CHRISMED se distingue por mantener una línea de cuidado entre atenciones. Usted no recomienza la historia en cada visita — historial, exámenes y orientaciones caminan juntos.',
      bullets: [
        'Registro clínico organizado y accesible al médico tratante.',
        'Canal administrativo único para dudas, retornos y agendamientos.',
        'Integración cuidadosa entre teleconsulta, presencial y a domicilio.',
        'Orientaciones claras antes y después de cada consulta.',
      ],
      quote:
        'Cuidar bien es recordar al paciente entre una consulta y otra, no solo el día de la atención.',
    },
    flow: {
      eyebrow: 'Agendamiento',
      title: 'Cómo funciona el agendamiento.',
      lead: 'Un recorrido simple, pensado para respetar su tiempo y proteger su privacidad.',
      steps: [
        'Elegir la modalidad',
        'Consultar disponibilidad',
        'Seleccionar el horario',
        'Confirmar sus datos',
        'Concluir el agendamiento con las opciones disponibles',
        'Recibir orientaciones',
      ],
      note: 'Las formas de pago y las opciones específicas de cada modalidad se presentan durante el agendamiento. No se solicitan datos sensibles fuera de ese flujo.',
    },
    oliver: {
      eyebrow: 'Oliver',
      title: 'Ayuda a elegir el formato — nunca sustituye la consulta.',
      contextGreeting:
        'Puedo ayudarle a elegir entre teleconsulta, atención presencial en Copacabana o consulta a domicilio.',
      quickReplies: [
        'Quiero agendar',
        'Teleconsulta',
        'Presencial en Copacabana',
        'Consulta a domicilio',
        'Tengo una duda',
        'Hablar con el equipo',
      ],
      disclaimer:
        'Oliver ofrece apoyo administrativo. No diagnostica, no prescribe y no sustituye evaluación médica.',
    },
    close: {
      eyebrow: 'Próximo paso',
      title: 'Cuando quiera comenzar,',
      titleItalic: 'estamos listos para recibirla.',
      lead: 'Elija la modalidad más cercana a su momento. Si lo prefiere, converse antes con Oliver — él ayuda a organizar.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Hablar con Oliver',
    },
  },
};
