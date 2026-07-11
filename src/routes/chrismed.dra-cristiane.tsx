/**
 * /chrismed/dra-cristiane — Página editorial da Dra. Christiane Alencar
 * (Onda V2 · Quiet Luxury).
 *
 * Reconstrução completa aplicando o design system aprovado.
 *
 * REGRAS APROVADAS PARA A V2 (aplicadas aqui):
 *  - Grafia oficial: "Dra. Christiane Alencar" (consistente com o menu/shell).
 *    Pendência: confirmar contra material institucional antes da publicação
 *    em produção (o texto "Christiane" mencionado no histórico será ajustado
 *    em massa se a fonte validada divergir).
 *  - Retrato só é publicado com src autorizado. Enquanto não houver asset,
 *    ChrismedPortrait mostra fallback silencioso — nunca rosto genérico.
 *  - Blocos sem conteúdo validado (artigos, congressos, cooperações) ficam
 *    OCULTOS. Nada de "{{a_configurar}}", "em breve", números fake ou
 *    superlativos médicos.
 *  - Nenhum CTA público aponta ao WhatsApp. Oliver é o único ponto de conversa.
 *  - Sem "Saiba mais" genérico. Sem múltiplos CTAs primários por seção.
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
  ChrismedOliverLauncher,
} from '@/components/chrismed/primitives';

import { DRA_CHRISTIANE_PORTRAIT_SRC } from '@/content/chrismed/portrait';
import { openChrismedOliver } from '@/components/chrismed/oliver-store';

const hasPortrait = Boolean(DRA_CHRISTIANE_PORTRAIT_SRC);


/**
 * Conteúdos validados (formação, artigos, congressos, cooperações).
 * Enquanto os arrays estiverem vazios, as seções correspondentes ficam
 * ocultas. Preencher SOMENTE com material verificado pelo Codex/cliente.
 */
type ValidatedContent = {
  credentials: string[];
  areasOfPractice: string[];
  articles: string[];
  events: string[];
  cooperations: string[];
};
const VALIDATED: ValidatedContent = {
  credentials: [],
  areasOfPractice: [],
  articles: [],
  events: [],
  cooperations: [],
};

export const Route = createFileRoute('/chrismed/dra-cristiane')({
  head: () => ({
    meta: [
      { title: 'Dra. Christiane Alencar — Medicina privada · CHRISMED' },
      {
        name: 'description',
        content:
          'Trajetória, filosofia e prática clínica da Dra. Christiane Alencar. Medicina privada, contínua e discreta em Copacabana, Rio de Janeiro. PT · EN · ES.',
      },
      { property: 'og:title', content: 'Dra. Christiane Alencar — CHRISMED' },
      {
        property: 'og:description',
        content:
          'Medicina privada com continuidade, escuta e precisão. Teleconsulta, presencial em Copacabana e visita domiciliar.',
      },
      { property: 'og:type', content: 'profile' },
      {
        property: 'og:url',
        content: 'https://chrismed.impulsionando.com.br/chrismed/dra-cristiane',
      },
      { property: 'og:site_name', content: 'CHRISMED' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Dra. Christiane Alencar — CHRISMED' },
      {
        name: 'twitter:description',
        content: 'Medicina privada, contínua e discreta.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://chrismed.impulsionando.com.br/chrismed/dra-cristiane',
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Physician',
          name: 'Dra. Christiane Alencar',
          medicalSpecialty: ['GeneralPractice', 'InternalMedicine'],
          areaServed: ['Rio de Janeiro', 'International'],
          availableService: [
            'Teleconsulta',
            'Home visit',
            'In-office consultation (Copacabana)',
          ],
          knowsLanguage: ['Portuguese', 'English', 'Spanish'],
        }),
      },
    ],
  }),
  component: DraCristianePage,
});

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

function DraCristianePage() {
  const lang = useLang();
  const t = COPY[lang];

  return (
    <ChrismedShell>
      {/* ─────────── 1. Hero editorial ───────────

          Composição varia se houver retrato autorizado (regra V2:
          nunca renderizar caixa vazia com aparência de mídia ausente). */}
      <ChrismedSection tone="ivory" className={hasPortrait ? 'pt-16 md:pt-24' : 'pt-20 md:pt-32'}>
        <div
          className={
            hasPortrait
              ? 'grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-20'
              : 'mx-auto max-w-3xl'
          }
        >
          <div>
            <ChrismedEyebrow>{t.hero.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={1} className="mt-6">
              Dra. Christiane{' '}
              <span className="chrismed-serif italic text-[var(--chrismed-graphite)]">
                Alencar.
              </span>
            </ChrismedHeading>
            <p className="chrismed-serif mt-6 text-xl font-light italic leading-snug text-[var(--chrismed-graphite)] md:text-2xl">
              {t.hero.positioning}
            </p>
            <p className="chrismed-sans mt-6 max-w-[46ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.hero.lead}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link to="/chrismed/agendar" className="inline-flex">
                <ChrismedButton size="lg">{t.hero.ctaPrimary}</ChrismedButton>
              </Link>
              <button
                type="button"
                onClick={openOliver}
                className="chrismed-sans inline-flex items-center justify-center gap-2 border border-[var(--chrismed-sand)] px-8 py-4 text-[12px] uppercase tracking-[0.2em] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)]"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
            {!hasPortrait && (
              <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-[var(--chrismed-sand)] pt-6 text-[var(--chrismed-mist)]">
                <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em]">
                  CHRISMED · Rio de Janeiro
                </span>
                <span aria-hidden className="text-[var(--chrismed-sand)]">·</span>
                <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em]">
                  PT · EN · ES
                </span>
              </div>
            )}
          </div>

          {hasPortrait && (
            <div className="relative">
              <ChrismedPortrait
                src={DRA_CHRISTIANE_PORTRAIT_SRC}
                alt={t.hero.portraitAlt}
                ratio="4/5"
                eyebrow={t.hero.eyebrow}
              />
              <div className="mt-6 flex items-center justify-between border-t border-[var(--chrismed-sand)] pt-4">
                <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
                  CHRISMED · Rio de Janeiro
                </span>
                <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
                  PT · EN · ES
                </span>
              </div>
            </div>
          )}
        </div>
      </ChrismedSection>


      {/* ─────────── 2. Trajetória ─────────── */}
      <ChrismedSection tone="bone">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.trajectory.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.trajectory.title}
            </ChrismedHeading>
          </div>
          <div className="space-y-6 text-[var(--chrismed-graphite)]">
            {t.trajectory.paragraphs.map((p, i) => (
              <p key={i} className="chrismed-sans text-base leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── 3. Filosofia de atendimento ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="max-w-3xl">
          <ChrismedEyebrow>{t.philosophy.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.philosophy.title}
          </ChrismedHeading>
        </div>
        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {t.philosophy.pillars.map((pillar, i) => (
            <div key={pillar.title} className="border-t border-[var(--chrismed-sand)] pt-5">
              <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="chrismed-serif mt-3 text-xl font-light text-[var(--chrismed-ink)]">
                {pillar.title}
              </h3>
              <p className="chrismed-sans mt-2 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── 4. Formação e credenciais (oculta se vazio) ─────────── */}
      {VALIDATED.credentials.length > 0 && (
        <ChrismedSection tone="bone">
          <div className="max-w-2xl">
            <ChrismedEyebrow>{t.credentials.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.credentials.title}
            </ChrismedHeading>
          </div>
          <ul className="chrismed-sans mt-10 grid gap-3 text-sm text-[var(--chrismed-graphite)] md:grid-cols-2">
            {VALIDATED.credentials.map((c) => (
              <li key={c} className="border-l border-[var(--chrismed-champagne)] pl-4">
                {c}
              </li>
            ))}
          </ul>
        </ChrismedSection>
      )}

      {/* ─────────── 5. Experiência clínica ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.practice.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.practice.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.practice.lead}
            </p>
          </div>
          <ul className="space-y-8">
            {t.practice.items.map((item, i) => (
              <li key={item.title} className="border-t border-[var(--chrismed-sand)] pt-5">
                <div className="flex items-baseline gap-4">
                  <span className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="chrismed-serif text-xl font-light text-[var(--chrismed-ink)]">
                    {item.title}
                  </h3>
                </div>
                <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ChrismedSection>

      {/* ─────────── 6. Áreas de atuação (oculta se vazio) ─────────── */}
      {VALIDATED.areasOfPractice.length > 0 && (
        <ChrismedSection tone="bone">
          <div className="max-w-2xl">
            <ChrismedEyebrow>{t.areas.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.areas.title}
            </ChrismedHeading>
          </div>
          <ul className="chrismed-sans mt-10 grid gap-3 text-sm text-[var(--chrismed-graphite)] md:grid-cols-2 lg:grid-cols-3">
            {VALIDATED.areasOfPractice.map((a) => (
              <li key={a} className="border-l border-[var(--chrismed-champagne)] pl-4">
                {a}
              </li>
            ))}
          </ul>
        </ChrismedSection>
      )}

      {/* ─────────── 7. Artigos e produção científica (oculta se vazio) ─────────── */}
      {VALIDATED.articles.length > 0 && (
        <ChrismedSection tone="ivory">
          <div className="max-w-2xl">
            <ChrismedEyebrow>{t.articles.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.articles.title}
            </ChrismedHeading>
          </div>
          <ol className="mt-10 space-y-6">
            {VALIDATED.articles.map((a, i) => (
              <li
                key={i}
                className="chrismed-sans border-t border-[var(--chrismed-sand)] pt-4 text-sm text-[var(--chrismed-graphite)]"
              >
                <span className="mr-3 text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-mist)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </ChrismedSection>
      )}

      {/* ─────────── 8. Congressos, seminários e simpósios (oculta se vazio) ─────────── */}
      {VALIDATED.events.length > 0 && (
        <ChrismedSection tone="bone">
          <div className="max-w-2xl">
            <ChrismedEyebrow>{t.events.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.events.title}
            </ChrismedHeading>
          </div>
          <ul className="chrismed-sans mt-10 grid gap-3 text-sm text-[var(--chrismed-graphite)] md:grid-cols-2">
            {VALIDATED.events.map((e) => (
              <li key={e} className="border-l border-[var(--chrismed-champagne)] pl-4">
                {e}
              </li>
            ))}
          </ul>
        </ChrismedSection>
      )}

      {/* ─────────── 9. Cooperações e atividades institucionais (oculta se vazio) ─────────── */}
      {VALIDATED.cooperations.length > 0 && (
        <ChrismedSection tone="ivory">
          <div className="max-w-2xl">
            <ChrismedEyebrow>{t.cooperations.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.cooperations.title}
            </ChrismedHeading>
          </div>
          <ul className="chrismed-sans mt-10 grid gap-3 text-sm text-[var(--chrismed-graphite)] md:grid-cols-2">
            {VALIDATED.cooperations.map((c) => (
              <li key={c} className="border-l border-[var(--chrismed-champagne)] pl-4">
                {c}
              </li>
            ))}
          </ul>
        </ChrismedSection>
      )}

      {/* ─────────── 10. Modalidades de atendimento ─────────── */}
      <ChrismedSection tone="bone">
        <div className="max-w-2xl">
          <ChrismedEyebrow>{t.modalities.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.modalities.title}
          </ChrismedHeading>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.modalities.items.map((m) => (
            <ChrismedCard key={m.title} className="flex flex-col">
              <ChrismedEyebrow>{m.eyebrow}</ChrismedEyebrow>
              <h3 className="chrismed-serif mt-4 text-xl font-light text-[var(--chrismed-ink)]">
                {m.title}
              </h3>
              <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                {m.body}
              </p>
              <div className="mt-auto pt-8">
                <Link
                  to="/chrismed/agendar"
                  className="chrismed-sans inline-flex items-center gap-2 border-b border-[var(--chrismed-sand)] pb-1 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-ink)] transition-colors hover:border-[var(--chrismed-champagne-deep)]"
                >
                  {t.modalities.cta}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </ChrismedCard>
          ))}
        </div>
      </ChrismedSection>

      {/* ─────────── 11. Agenda ─────────── */}
      <ChrismedSection tone="ivory">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.schedule.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.schedule.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.schedule.body}
            </p>
            <p className="chrismed-sans mt-3 text-xs italic text-[var(--chrismed-mist)]">
              {t.schedule.note}
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Link to="/chrismed/agendar" className="inline-flex">
              <ChrismedButton size="lg">{t.schedule.cta}</ChrismedButton>
            </Link>
          </div>
        </div>
      </ChrismedSection>

      {/* ─────────── 12. Oliver ─────────── */}
      <ChrismedSection tone="bone">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <ChrismedEyebrow>{t.oliver.eyebrow}</ChrismedEyebrow>
            <ChrismedHeading level={2} className="mt-4">
              {t.oliver.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-6 text-base leading-relaxed text-[var(--chrismed-graphite)]">
              {t.oliver.body}
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

      {/* ─────────── 13. CTA final ─────────── */}
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
    positioning: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    portraitAlt: string;
  };
  trajectory: { eyebrow: string; title: string; paragraphs: string[] };
  philosophy: { eyebrow: string; title: string; pillars: { title: string; body: string }[] };
  credentials: { eyebrow: string; title: string };
  practice: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  areas: { eyebrow: string; title: string };
  articles: { eyebrow: string; title: string };
  events: { eyebrow: string; title: string };
  cooperations: { eyebrow: string; title: string };
  modalities: {
    eyebrow: string;
    title: string;
    cta: string;
    items: { eyebrow: string; title: string; body: string }[];
  };
  schedule: { eyebrow: string; title: string; body: string; note: string; cta: string };
  oliver: { eyebrow: string; title: string; body: string };
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
      eyebrow: 'Autoridade médica · CHRISMED',
      positioning: 'Medicina privada com continuidade, escuta e precisão.',
      lead: 'Consultas em Copacabana, em sua residência ou por vídeo. Uma única médica, a mesma escuta, e o tempo necessário para cuidar bem.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Falar com Oliver',
      portraitAlt: 'Retrato editorial da Dra. Christiane Alencar',
    },
    trajectory: {
      eyebrow: 'Trajetória',
      title: 'Uma prática construída em torno do paciente.',
      paragraphs: [
        'A Dra. Christiane Alencar dedica sua prática à medicina privada, com foco em acompanhamento contínuo, escuta atenta e coordenação clínica.',
        'A rotina combina consultas presenciais em Copacabana, atendimento domiciliar em residências e hotéis do Rio de Janeiro e teleconsulta para pacientes em viagem ou fora da cidade.',
        'A trajetória completa — formação, atuação hospitalar, produção científica e cooperações institucionais — é publicada apenas com material verificado. Os blocos correspondentes aparecerão nesta página assim que forem consolidados.',
      ],
    },
    philosophy: {
      eyebrow: 'Filosofia',
      title: 'A medicina que pratico começa antes da consulta.',
      pillars: [
        { title: 'Continuidade', body: 'Uma médica de referência ao longo do tempo, com prontuário próprio e leitura integrada de cada exame.' },
        { title: 'Escuta', body: 'Consultas com tempo real para conversar, examinar e decidir juntos. Sem agenda apertada.' },
        { title: 'Precisão', body: 'Decisões clínicas fundamentadas, discutidas com clareza e sem jargão.' },
        { title: 'Discrição', body: 'Recepção reservada, dados protegidos e conformidade total com a LGPD.' },
        { title: 'Coordenação', body: 'Encaminhamentos, exames e interconsultas conduzidos pela CHRISMED — nunca terceirizados ao paciente.' },
        { title: 'Presença internacional', body: 'Atendimento em português, inglês e espanhol para pacientes brasileiros e estrangeiros.' },
      ],
    },
    credentials: {
      eyebrow: 'Formação e credenciais',
      title: 'Formação verificada e credenciais oficiais.',
    },
    practice: {
      eyebrow: 'Experiência clínica',
      title: 'Uma prática consolidada em três frentes complementares.',
      lead: 'A experiência da Dra. Christiane articula consulta privada, acompanhamento hospitalar e coordenação internacional — sempre com a mesma médica no centro do cuidado.',
      items: [
        { title: 'Consulta privada', body: 'Acompanhamento longitudinal de adultos, com foco em continuidade e prevenção. Consultas em Copacabana, à distância e a domicílio.' },
        { title: 'Acompanhamento hospitalar', body: 'Coordenação clínica em internações e procedimentos em redes hospitalares parceiras, mantendo o paciente sob a mesma referência médica.' },
        { title: 'Pacientes internacionais', body: 'Atendimento a estrangeiros no Rio de Janeiro em três idiomas, com continuidade quando o paciente retorna ao país de origem.' },
      ],
    },
    areas: { eyebrow: 'Áreas de atuação', title: 'Áreas oficiais de atuação.' },
    articles: { eyebrow: 'Produção científica', title: 'Artigos e publicações.' },
    events: { eyebrow: 'Congressos e simpósios', title: 'Participações verificadas.' },
    cooperations: { eyebrow: 'Cooperações', title: 'Atividades institucionais.' },
    modalities: {
      eyebrow: 'Modalidades',
      title: 'Três formas de consultar a mesma médica.',
      cta: 'Agendar nesta modalidade',
      items: [
        { eyebrow: 'Vídeo', title: 'Teleconsulta', body: 'Consulta por vídeo com prescrição digital e prontuário eletrônico.' },
        { eyebrow: 'Copacabana', title: 'Presencial', body: 'Consultório discreto, agenda sob horário, recepção reservada.' },
        { eyebrow: 'Casa · Hotel', title: 'Consulta domiciliar', body: 'Atendimento na sua residência, hotel ou escritório no Rio de Janeiro.' },
      ],
    },
    schedule: {
      eyebrow: 'Agenda',
      title: 'Reserve o tempo que a consulta pede.',
      body: 'O agendamento é conduzido inteiramente dentro da CHRISMED: escolha da modalidade, seleção do horário, confirmação dos dados e pagamento quando aplicável.',
      note: 'Consulte as opções disponíveis na página de agendamento.',
      cta: 'Abrir agenda',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'Se preferir, converse antes.',
      body: 'Oliver é o concierge digital da CHRISMED. Orienta a escolha da modalidade, ajuda no agendamento e responde dúvidas objetivas em português, inglês ou espanhol. Não substitui avaliação médica.',
    },
    close: {
      eyebrow: 'Próximo passo',
      title: 'Reservar um tempo',
      titleItalic: 'com a Dra. Christiane.',
      lead: 'Consulta privada em Copacabana, na sua casa ou por vídeo. Um único ponto de contato para todo o cuidado.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Falar com Oliver',
    },
  },
  en: {
    hero: {
      eyebrow: 'Medical authority · CHRISMED',
      positioning: 'Private medicine with continuity, listening, and precision.',
      lead: 'Consultations in Copacabana, at your home, or by video. One physician, the same attention, and the time it takes to care well.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Talk to Oliver',
      portraitAlt: 'Editorial portrait of Dr. Christiane Alencar',
    },
    trajectory: {
      eyebrow: 'Trajectory',
      title: 'A practice built around the patient.',
      paragraphs: [
        'Dr. Christiane Alencar dedicates her practice to private medicine, focused on continuous follow-up, attentive listening and clinical coordination.',
        'Her routine combines in-office consultations in Copacabana, home visits at residences and hotels in Rio de Janeiro, and telehealth for patients on travel or abroad.',
        'The full trajectory — training, hospital practice, scientific work and institutional collaborations — is published only with verified material. The corresponding sections will appear here once consolidated.',
      ],
    },
    philosophy: {
      eyebrow: 'Philosophy',
      title: 'The medicine I practice begins before the consultation.',
      pillars: [
        { title: 'Continuity', body: 'A reference physician over time, with proprietary records and integrated reading of every exam.' },
        { title: 'Listening', body: 'Consultations with real time to talk, examine and decide together. No tight agendas.' },
        { title: 'Precision', body: 'Grounded clinical decisions, discussed with clarity and without jargon.' },
        { title: 'Discretion', body: 'Private reception, protected data and full LGPD compliance.' },
        { title: 'Coordination', body: 'Referrals, exams and interconsultations conducted by CHRISMED — never outsourced to the patient.' },
        { title: 'International presence', body: 'Care in Portuguese, English and Spanish for Brazilian and international patients.' },
      ],
    },
    credentials: { eyebrow: 'Training & credentials', title: 'Verified training and official credentials.' },
    practice: {
      eyebrow: 'Clinical experience',
      title: 'A practice consolidated across three complementary fronts.',
      lead: 'Dr. Alencar’s experience articulates private consultation, hospital follow-up and international coordination — always with the same physician at the center of care.',
      items: [
        { title: 'Private consultation', body: 'Longitudinal follow-up of adults, focused on continuity and prevention. Consultations in Copacabana, remotely and at home.' },
        { title: 'Hospital follow-up', body: 'Clinical coordination for admissions and procedures in partner hospital networks, keeping the patient under the same physician reference.' },
        { title: 'International patients', body: 'Care for foreigners in Rio de Janeiro in three languages, with continuity when the patient returns home.' },
      ],
    },
    areas: { eyebrow: 'Areas of practice', title: 'Official areas of practice.' },
    articles: { eyebrow: 'Scientific work', title: 'Articles and publications.' },
    events: { eyebrow: 'Congresses & symposia', title: 'Verified participations.' },
    cooperations: { eyebrow: 'Cooperations', title: 'Institutional activities.' },
    modalities: {
      eyebrow: 'Modalities',
      title: 'Three ways to see the same physician.',
      cta: 'Book this modality',
      items: [
        { eyebrow: 'Video', title: 'Telehealth', body: 'Video consultation with digital prescription and electronic records.' },
        { eyebrow: 'Copacabana', title: 'In-person', body: 'Discreet office, scheduled time slots, private reception.' },
        { eyebrow: 'Home · Hotel', title: 'Home visit', body: 'Care at your home, hotel or office in Rio de Janeiro.' },
      ],
    },
    schedule: {
      eyebrow: 'Schedule',
      title: 'Reserve the time the consultation deserves.',
      body: 'Booking is handled entirely within CHRISMED: modality selection, time slot, data confirmation and payment when applicable.',
      note: 'Check the available options on the booking page.',
      cta: 'Open schedule',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'If you prefer, talk first.',
      body: 'Oliver is CHRISMED’s digital concierge. He guides your choice of modality, helps with booking, and answers objective questions in Portuguese, English or Spanish. He does not replace medical assessment.',
    },
    close: {
      eyebrow: 'Next step',
      title: 'Reserve time',
      titleItalic: 'with Dr. Alencar.',
      lead: 'Private consultation in Copacabana, at your home, or by video. A single point of contact for the entire care.',
      ctaPrimary: 'Book a consultation',
      ctaSecondary: 'Talk to Oliver',
    },
  },
  es: {
    hero: {
      eyebrow: 'Autoridad médica · CHRISMED',
      positioning: 'Medicina privada con continuidad, escucha y precisión.',
      lead: 'Consultas en Copacabana, en su residencia o por video. Una única médica, la misma atención y el tiempo necesario para cuidar bien.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Hablar con Oliver',
      portraitAlt: 'Retrato editorial de la Dra. Christiane Alencar',
    },
    trajectory: {
      eyebrow: 'Trayectoria',
      title: 'Una práctica construida en torno al paciente.',
      paragraphs: [
        'La Dra. Christiane Alencar dedica su práctica a la medicina privada, con foco en seguimiento continuo, escucha atenta y coordinación clínica.',
        'La rutina combina consultas presenciales en Copacabana, atención domiciliaria en residencias y hoteles de Río de Janeiro, y teleconsulta para pacientes en viaje o fuera de la ciudad.',
        'La trayectoria completa — formación, actuación hospitalaria, producción científica y cooperaciones institucionales — se publica solo con material verificado. Los bloques correspondientes aparecerán aquí cuando estén consolidados.',
      ],
    },
    philosophy: {
      eyebrow: 'Filosofía',
      title: 'La medicina que practico comienza antes de la consulta.',
      pillars: [
        { title: 'Continuidad', body: 'Una médica de referencia a lo largo del tiempo, con historia clínica propia y lectura integrada de cada examen.' },
        { title: 'Escucha', body: 'Consultas con tiempo real para conversar, examinar y decidir juntos. Sin agenda apretada.' },
        { title: 'Precisión', body: 'Decisiones clínicas fundamentadas, discutidas con claridad y sin jerga.' },
        { title: 'Discreción', body: 'Recepción reservada, datos protegidos y cumplimiento total de la LGPD.' },
        { title: 'Coordinación', body: 'Derivaciones, exámenes e interconsultas conducidas por CHRISMED — nunca tercerizadas al paciente.' },
        { title: 'Presencia internacional', body: 'Atención en portugués, inglés y español para pacientes brasileños y extranjeros.' },
      ],
    },
    credentials: { eyebrow: 'Formación y credenciales', title: 'Formación verificada y credenciales oficiales.' },
    practice: {
      eyebrow: 'Experiencia clínica',
      title: 'Una práctica consolidada en tres frentes complementarios.',
      lead: 'La experiencia de la Dra. Alencar articula consulta privada, seguimiento hospitalario y coordinación internacional — siempre con la misma médica en el centro del cuidado.',
      items: [
        { title: 'Consulta privada', body: 'Seguimiento longitudinal de adultos, con foco en continuidad y prevención. Consultas en Copacabana, a distancia y a domicilio.' },
        { title: 'Seguimiento hospitalario', body: 'Coordinación clínica en internaciones y procedimientos en redes hospitalarias asociadas, manteniendo al paciente bajo la misma referencia médica.' },
        { title: 'Pacientes internacionales', body: 'Atención a extranjeros en Río de Janeiro en tres idiomas, con continuidad cuando el paciente regresa a su país.' },
      ],
    },
    areas: { eyebrow: 'Áreas de actuación', title: 'Áreas oficiales de actuación.' },
    articles: { eyebrow: 'Producción científica', title: 'Artículos y publicaciones.' },
    events: { eyebrow: 'Congresos y simposios', title: 'Participaciones verificadas.' },
    cooperations: { eyebrow: 'Cooperaciones', title: 'Actividades institucionales.' },
    modalities: {
      eyebrow: 'Modalidades',
      title: 'Tres formas de consultar a la misma médica.',
      cta: 'Agendar en esta modalidad',
      items: [
        { eyebrow: 'Video', title: 'Teleconsulta', body: 'Consulta por video con receta digital e historia clínica electrónica.' },
        { eyebrow: 'Copacabana', title: 'Presencial', body: 'Consultorio discreto, agenda con horario, recepción reservada.' },
        { eyebrow: 'Casa · Hotel', title: 'Visita a domicilio', body: 'Atención en su residencia, hotel u oficina en Río de Janeiro.' },
      ],
    },
    schedule: {
      eyebrow: 'Agenda',
      title: 'Reserve el tiempo que la consulta pide.',
      body: 'El agendamiento se conduce por completo dentro de CHRISMED: elección de modalidad, selección de horario, confirmación de datos y pago cuando corresponda.',
      note: 'Consulte las opciones disponibles en la página de agendamiento.',
      cta: 'Abrir agenda',
    },
    oliver: {
      eyebrow: 'Oliver · Concierge',
      title: 'Si prefiere, converse antes.',
      body: 'Oliver es el concierge digital de CHRISMED. Orienta la elección de la modalidad, ayuda con el agendamiento y responde dudas objetivas en portugués, inglés o español. No sustituye la evaluación médica.',
    },
    close: {
      eyebrow: 'Próximo paso',
      title: 'Reservar un tiempo',
      titleItalic: 'con la Dra. Alencar.',
      lead: 'Consulta privada en Copacabana, en su casa o por video. Un único punto de contacto para todo el cuidado.',
      ctaPrimary: 'Agendar consulta',
      ctaSecondary: 'Hablar con Oliver',
    },
  },
};
