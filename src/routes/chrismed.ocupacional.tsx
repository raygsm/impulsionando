/**
 * /chrismed/ocupacional — Medicina Ocupacional (Onda V3.b · Quiet Luxury)
 *
 * Reescrita completa da rota corporativa antiga (arquivada em
 * src/content/chrismed/_archive/ocupacional-v2-corporate.tsx.txt).
 *
 * Guardrails V3.b:
 *  - Somente primitivos CHRISMED (src/components/chrismed/primitives).
 *  - Dois públicos claramente distintos: EMPRESAS e COLABORADORES,
 *    controlados por um seletor acessível (role="tablist").
 *  - Nenhum CTA público aponta ao WhatsApp; Oliver é o único canal.
 *  - Serviços publicados apenas os confirmados: admissional, periódico,
 *    retorno ao trabalho, mudança de função, demissional (ASO).
 *    PCMSO, NR-1, "gestão completa", "painel de conformidade",
 *    "arquivamento digital" — OCULTOS até validação factual.
 *  - Sem preço, sem "a partir de", sem placeholder — orientar consulta
 *    das condições durante o agendamento.
 *  - CTA "Agendar ASO" → /chrismed/agendar SEM query param, pois o
 *    validateSearch de /chrismed/agendar aceita apenas
 *    presencial | telemedicina | domiciliar | retorno. Não existe
 *    modalidade "ocupacional" na rota atual — extensão do enum é
 *    dependência do Codex.
 *  - CTA "Atendimento para empresas" → abre Oliver contextual (empresarial),
 *    enquanto não houver fluxo corporativo funcional.
 *  - Copy operacional em modo condicional: "poderá ser organizada…",
 *    "quando disponível e autorizado…". Nada afirma cadastro em lote,
 *    importação, dashboard ou agenda corporativa como já ativos.
 *
 * Pendências registradas para o Codex / próximas ondas:
 *  - Rota canônica futura recomendada: `/chrismed/medicina-ocupacional`,
 *    com `/chrismed/ocupacional` preservada como alias/redirect. NÃO
 *    implementar 301 antes da validação do Codex (canonical, sitemap,
 *    links internos, prevenção de duplicate content).
 *  - Extensão de `searchSchema` em /chrismed/agendar para aceitar
 *    modalidade "ocupacional" quando houver oferta cadastrada.
 *  - Fluxo corporativo real (cadastro de unidades, importação de
 *    colaboradores, agendamento em lote, dashboard de pendências,
 *    documentos autorizados) — hoje descritos apenas como jornada
 *    possível; execução depende de contratos técnicos do Codex.
 *  - Preço do ASO: fonte dinâmica validada pelo Codex.
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState, useRef, type KeyboardEvent } from 'react';
import { ChrismedShell, useLang, type Lang } from '@/components/chrismed/ChrismedShell';
import {
  ChrismedSection,
  ChrismedHeading,
  ChrismedEyebrow,
  ChrismedButton,
  ChrismedCard,
  ChrismedOliverLauncher,
} from '@/components/chrismed/primitives';
import {
  openChrismedOliver,
  setChrismedOliverContext,
} from '@/components/chrismed/oliver-store';

export const Route = createFileRoute('/chrismed/ocupacional')({
  head: () => ({
    meta: [
      {
        title: 'Medicina Ocupacional — CHRISMED',
      },
      {
        name: 'description',
        content:
          'Atendimento ocupacional CHRISMED para empresas e colaboradores: ASO, exames admissional, periódico, retorno ao trabalho, mudança de função e demissional. Jornada organizada, discreta e acompanhada.',
      },
      { property: 'og:title', content: 'Medicina Ocupacional — CHRISMED' },
      {
        property: 'og:description',
        content:
          'ASO e exames ocupacionais em uma jornada clara para empresas e colaboradores.',
      },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:url',
        content:
          'https://chrismed.impulsionando.com.br/chrismed/ocupacional',
      },
      { property: 'og:site_name', content: 'CHRISMED' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Medicina Ocupacional — CHRISMED' },
      {
        name: 'twitter:description',
        content:
          'Atendimento ocupacional CHRISMED para empresas e colaboradores.',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://chrismed.impulsionando.com.br/chrismed/ocupacional',
      },
    ],
  }),
  component: ChrismedOcupacionalPage,
});

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

type Audience = 'empresa' | 'colaborador';

function ChrismedOcupacionalPage() {
  const lang = useLang();
  const t = COPY[lang];
  const [audience, setAudience] = useState<Audience>('empresa');
  const empresaBtnRef = useRef<HTMLButtonElement>(null);
  const colaboradorBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail = {
      context: 'ocupacional',
      greeting: t.oliver.contextGreeting,
      quickReplies: t.oliver.quickReplies,
    };
    setChrismedOliverContext(detail);
    window.dispatchEvent(
      new CustomEvent('chrismed:oliver:context', { detail }),
    );
  }, [t]);

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next: Audience = audience === 'empresa' ? 'colaborador' : 'empresa';
      setAudience(next);
      (next === 'empresa' ? empresaBtnRef : colaboradorBtnRef).current?.focus();
    }
  }

  const journey = audience === 'empresa' ? t.journeyCompany : t.journeyEmployee;

  return (
    <ChrismedShell>
      {/* 1 · Hero editorial ─────────────────────── */}
      <ChrismedSection className="pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-left">
          <ChrismedEyebrow>{t.hero.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={1} className="mt-6">
            {t.hero.title}{' '}
            <span className="chrismed-serif italic text-[var(--chrismed-graphite)]">
              {t.hero.titleItalic}
            </span>
          </ChrismedHeading>
          <p className="chrismed-sans mt-8 max-w-[48ch] text-base leading-relaxed text-[var(--chrismed-graphite)] md:text-lg">
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
            {t.hero.tags.map((m) => (
              <li key={m}>· {m}</li>
            ))}
          </ul>
        </div>
      </ChrismedSection>

      {/* 2 · Seletor de público ────────────────── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-3xl">
          <ChrismedEyebrow>{t.selector.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.selector.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[48ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.selector.lead}
          </p>

          <div
            role="tablist"
            aria-label={t.selector.aria}
            className="mt-8 inline-flex flex-col gap-2 rounded-sm border border-[var(--chrismed-champagne-deep)]/40 bg-[var(--chrismed-ivory)] p-1.5 sm:flex-row"
          >
            <button
              ref={empresaBtnRef}
              role="tab"
              type="button"
              id="chrismed-oc-tab-empresa"
              aria-controls="chrismed-oc-panel"
              aria-selected={audience === 'empresa'}
              tabIndex={audience === 'empresa' ? 0 : -1}
              onClick={() => setAudience('empresa')}
              onKeyDown={onTabKey}
              className={
                'chrismed-sans px-5 py-3 text-[11px] uppercase tracking-[0.22em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)] ' +
                (audience === 'empresa'
                  ? 'bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]'
                  : 'text-[var(--chrismed-graphite)] hover:text-[var(--chrismed-ink)]')
              }
            >
              {t.selector.empresa}
            </button>
            <button
              ref={colaboradorBtnRef}
              role="tab"
              type="button"
              id="chrismed-oc-tab-colaborador"
              aria-controls="chrismed-oc-panel"
              aria-selected={audience === 'colaborador'}
              tabIndex={audience === 'colaborador' ? 0 : -1}
              onClick={() => setAudience('colaborador')}
              onKeyDown={onTabKey}
              className={
                'chrismed-sans px-5 py-3 text-[11px] uppercase tracking-[0.22em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)] ' +
                (audience === 'colaborador'
                  ? 'bg-[var(--chrismed-ink)] text-[var(--chrismed-ivory)]'
                  : 'text-[var(--chrismed-graphite)] hover:text-[var(--chrismed-ink)]')
              }
            >
              {t.selector.colaborador}
            </button>
          </div>
        </div>
      </ChrismedSection>

      {/* 3-4 · Jornada (empresa | colaborador) ─── */}
      <ChrismedSection
       
        id="chrismed-oc-panel"
        aria-labelledby={
          audience === 'empresa'
            ? 'chrismed-oc-tab-empresa'
            : 'chrismed-oc-tab-colaborador'
        }
      >
        <div className="mx-auto max-w-4xl">
          <ChrismedEyebrow>{journey.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {journey.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {journey.lead}
          </p>

          <ol className="mt-12 space-y-6">
            {journey.steps.map((step, idx) => (
              <li key={step.title} className="flex gap-6 border-t border-[var(--chrismed-champagne-deep)]/25 pt-6 first:border-t-0 first:pt-0">
                <span className="chrismed-serif shrink-0 text-2xl italic text-[var(--chrismed-champagne-deep)] w-10">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="chrismed-serif text-xl text-[var(--chrismed-ink)]">
                    {step.title}
                  </h3>
                  <p className="chrismed-sans mt-2 max-w-[56ch] text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {audience === 'empresa' ? (
              <ChrismedButton size="lg" onClick={openOliver}>
                {t.journeyCompany.cta}
              </ChrismedButton>
            ) : (
              <Link to="/chrismed/agendar" className="inline-flex">
                <ChrismedButton size="lg">{t.journeyEmployee.cta}</ChrismedButton>
              </Link>
            )}
            <ChrismedButton size="lg" variant="ghost" onClick={openOliver}>
              {t.journeyShared.oliverCta}
            </ChrismedButton>
          </div>
        </div>
      </ChrismedSection>

      {/* 5 · Serviços ocupacionais confirmados ─── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-5xl">
          <ChrismedEyebrow>{t.services.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.services.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.services.lead}
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.services.items.map((item) => (
              <ChrismedCard key={item.title} className="p-8">
                <div className="chrismed-sans text-[10px] uppercase tracking-[0.22em] text-[var(--chrismed-champagne-deep)]">
                  {item.tag}
                </div>
                <h3 className="chrismed-serif mt-3 text-xl text-[var(--chrismed-ink)]">
                  {item.title}
                </h3>
                <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                  {item.body}
                </p>
              </ChrismedCard>
            ))}
          </div>

          <p className="chrismed-sans mt-10 max-w-[56ch] text-xs italic leading-relaxed text-[var(--chrismed-mist)]">
            {t.services.footnote}
          </p>
        </div>
      </ChrismedSection>

      {/* 6 · Como funciona o agendamento ────────── */}
      <ChrismedSection>
        <div className="mx-auto max-w-4xl">
          <ChrismedEyebrow>{t.scheduling.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.scheduling.title}
          </ChrismedHeading>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {t.scheduling.steps.map((s, i) => (
              <div key={s.title}>
                <div className="chrismed-serif text-3xl italic text-[var(--chrismed-champagne-deep)]">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="chrismed-serif mt-3 text-lg text-[var(--chrismed-ink)]">
                  {s.title}
                </h3>
                <p className="chrismed-sans mt-2 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ChrismedSection>

      {/* 7 · Documentos e acompanhamento ────────── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-3xl">
          <ChrismedEyebrow>{t.docs.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.docs.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.docs.lead}
          </p>
          <ul className="mt-8 space-y-3">
            {t.docs.items.map((it) => (
              <li key={it} className="chrismed-sans flex gap-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                <span className="mt-2 h-[3px] w-4 shrink-0 bg-[var(--chrismed-champagne-deep)]" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
          <p className="chrismed-sans mt-8 max-w-[52ch] text-xs italic leading-relaxed text-[var(--chrismed-mist)]">
            {t.docs.footnote}
          </p>
        </div>
      </ChrismedSection>

      {/* 8 · Oliver contextual ──────────────────── */}
      <ChrismedSection tone="noir">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-8">
          <ChrismedEyebrow>{t.oliver.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2}>
            {t.oliver.title}
          </ChrismedHeading>
          <p className="chrismed-sans max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-ivory)]/85">
            {t.oliver.lead}
          </p>
          <ChrismedOliverLauncher lang={lang} variant="inline" onClick={openOliver} />
        </div>
      </ChrismedSection>

      {/* 9 · Fechamento editorial ───────────────── */}
      <ChrismedSection>
        <div className="mx-auto max-w-3xl text-left">
          <ChrismedHeading level={3}>{t.closing.title}</ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[52ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.closing.body}
          </p>
          <div className="mt-8">
            <Link
              to="/chrismed/dra-cristiane"
              className="chrismed-sans text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-champagne-deep)] underline-offset-8 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chrismed-champagne)]"
            >
              {t.closing.link}
            </Link>
          </div>
        </div>
      </ChrismedSection>
    </ChrismedShell>
  );
}

// ─────────────────────────────────────────────────
// COPY (PT · EN · ES)
// ─────────────────────────────────────────────────

type Step = { title: string; body: string };

type CopyShape = {
  hero: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    tags: string[];
  };
  selector: {
    eyebrow: string;
    title: string;
    lead: string;
    aria: string;
    empresa: string;
    colaborador: string;
  };
  journeyCompany: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Step[];
    cta: string;
  };
  journeyEmployee: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Step[];
    cta: string;
  };
  journeyShared: { oliverCta: string };
  services: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { tag: string; title: string; body: string }[];
    footnote: string;
  };
  scheduling: { eyebrow: string; title: string; steps: Step[] };
  docs: { eyebrow: string; title: string; lead: string; items: string[]; footnote: string };
  oliver: {
    eyebrow: string;
    title: string;
    lead: string;
    contextGreeting: string;
    quickReplies: string[];
  };
  closing: { title: string; body: string; link: string };
};

const PT: CopyShape = {
  hero: {
    eyebrow: 'Medicina Ocupacional',
    title: 'Saúde ocupacional organizada,',
    titleItalic: 'discreta e acompanhada.',
    lead:
      'Um atendimento ocupacional pensado para empresas que valorizam responsabilidade e para colaboradores que merecem clareza. Cada etapa é conduzida com sobriedade, sem burocracia visível.',
    ctaPrimary: 'Agendar ASO',
    ctaSecondary: 'Atendimento para empresas',
    tags: ['ASO', 'Admissional', 'Periódico', 'Retorno ao trabalho', 'Mudança de função', 'Demissional'],
  },
  selector: {
    eyebrow: 'Escolha seu ponto de entrada',
    title: 'A jornada muda conforme quem chega.',
    lead:
      'Empresas conduzem a implantação e o acompanhamento do quadro. Colaboradores encontram orientação de exame, agendamento e documentos autorizados. Selecione abaixo para ver a jornada correspondente.',
    aria: 'Selecionar público',
    empresa: 'Sou uma empresa',
    colaborador: 'Sou colaborador',
  },
  journeyCompany: {
    eyebrow: 'Jornada para empresas',
    title: 'Uma implantação ocupacional condizente com o porte da operação.',
    lead:
      'A operação poderá ser organizada em uma jornada única, com etapas conduzidas pela equipe CHRISMED conforme o perfil da empresa. As funcionalidades listadas descrevem o desenho da jornada, não uma automação já em produção.',
    steps: [
      { title: 'Compreender os serviços', body: 'A equipe CHRISMED apresenta os exames confirmados, as modalidades disponíveis e as responsabilidades envolvidas antes da contratação.' },
      { title: 'Informar empresa, unidades e demanda', body: 'Razão social, unidades atendidas e volume esperado. A partir desses dados a implantação é dimensionada.' },
      { title: 'Cadastrar ou importar colaboradores', body: 'A operação poderá organizar o quadro por unidade, cargo e periodicidade. A forma exata (cadastro manual ou importação) é definida na implantação, conforme o perfil da empresa.' },
      { title: 'Organizar agendamentos individuais ou em lote', body: 'Os agendamentos poderão ser conduzidos individualmente ou em blocos, conforme a operação. A equipe CHRISMED orienta a melhor abordagem.' },
      { title: 'Acompanhar pendências', body: 'Convocações, reagendamentos e status por colaborador poderão ser acompanhados pela equipe responsável da empresa, quando disponível e autorizado.' },
      { title: 'Acompanhar atendimentos', body: 'Histórico de comparecimento e observações operacionais ficam registrados junto ao prontuário ocupacional.' },
      { title: 'Acessar documentos autorizados', body: 'ASOs e documentos correlatos ficam disponíveis para a empresa quando autorizados pelo colaborador e pela responsabilidade médica.' },
      { title: 'Falar com Oliver', body: 'Oliver acompanha a jornada corporativa e encaminha para a equipe CHRISMED os pontos que exigem tratativa humana.' },
    ],
    cta: 'Iniciar atendimento empresarial com Oliver',
  },
  journeyEmployee: {
    eyebrow: 'Jornada para colaboradores',
    title: 'Do exame indicado ao documento — sem ruído.',
    lead:
      'Se sua empresa já é cliente CHRISMED, a jornada é acompanhada do início ao fim. Se ainda não é, o Oliver orienta os próximos passos.',
    steps: [
      { title: 'Identificar o tipo de exame', body: 'Admissional, periódico, retorno ao trabalho, mudança de função ou demissional. O tipo é indicado pela empresa e confirmado no agendamento.' },
      { title: 'Consultar ou iniciar agendamento', body: 'A CHRISMED apresenta horários e instruções compatíveis com o tipo de exame indicado.' },
      { title: 'Receber instruções', body: 'Preparo, documentos e local do atendimento são enviados antes da data agendada.' },
      { title: 'Confirmar presença', body: 'A confirmação prévia reduz reagendamentos e organiza a agenda ocupacional.' },
      { title: 'Remarcar ou cancelar quando permitido', body: 'Alterações são possíveis dentro das regras acordadas com a empresa contratante e a agenda CHRISMED.' },
      { title: 'Acessar documentos autorizados', body: 'ASOs e comprovantes ficam disponíveis quando disponível e autorizado, conforme a responsabilidade médica e o consentimento do colaborador.' },
      { title: 'Falar com Oliver', body: 'Dúvidas sobre exame, preparo ou agendamento são acolhidas pelo Oliver, que encaminha à equipe CHRISMED quando necessário.' },
    ],
    cta: 'Ir para o agendamento',
  },
  journeyShared: { oliverCta: 'Falar com Oliver' },
  services: {
    eyebrow: 'Serviços ocupacionais confirmados',
    title: 'O escopo publicado é apenas o que a CHRISMED confirma hoje.',
    lead:
      'Cada modalidade responde a um momento específico da relação de trabalho. Nenhum item é apresentado como "obrigação legal" ou "programa" nesta versão — as condições e a preparação são apresentadas durante o agendamento.',
    items: [
      { tag: 'ASO', title: 'Atestado de Saúde Ocupacional', body: 'Emissão do ASO após avaliação médica, conforme a modalidade indicada pela empresa.' },
      { tag: 'Ingresso', title: 'Exame admissional', body: 'Avaliação médica prévia ao início das atividades, conforme o cargo e as informações fornecidas pela empresa.' },
      { tag: 'Acompanhamento', title: 'Exame periódico', body: 'Avaliação médica ao longo do vínculo de trabalho, conforme a periodicidade acordada com a empresa.' },
      { tag: 'Retorno', title: 'Retorno ao trabalho', body: 'Avaliação médica após afastamento, considerando o motivo do afastamento e a função a ser retomada.' },
      { tag: 'Mudança', title: 'Mudança de função', body: 'Avaliação médica quando o colaborador passa a exercer nova função, considerando as exigências do novo cargo.' },
      { tag: 'Encerramento', title: 'Exame demissional', body: 'Avaliação médica no encerramento do vínculo de trabalho, com emissão do ASO correspondente.' },
    ],
    footnote:
      'Valores, prazos e condições são apresentados durante o agendamento. Esta página não publica preço fixo do ASO enquanto a fonte de dados dinâmica não estiver validada.',
  },
  scheduling: {
    eyebrow: 'Como funciona o agendamento',
    title: 'Três passos, sem burocracia visível.',
    steps: [
      { title: 'Solicitação', body: 'Empresa ou colaborador inicia a solicitação pelo canal CHRISMED, indicando o tipo de exame.' },
      { title: 'Confirmação', body: 'A CHRISMED confirma horário, local e preparo compatíveis com a modalidade indicada.' },
      { title: 'Atendimento e documentação', body: 'O atendimento é realizado e a documentação é organizada e disponibilizada quando autorizado.' },
    ],
  },
  docs: {
    eyebrow: 'Documentos e acompanhamento',
    title: 'Documentação organizada, acesso responsável.',
    lead:
      'O ASO e documentos correlatos ficam vinculados ao atendimento e são disponibilizados dentro das regras médicas e do consentimento do colaborador.',
    items: [
      'ASO emitido após avaliação médica.',
      'Instruções de preparo e local enviadas antes da data agendada.',
      'Histórico de atendimentos ocupacionais preservado junto ao prontuário.',
      'Acesso da empresa a documentos autorizados, quando disponível e autorizado.',
    ],
    footnote:
      'A CHRISMED trata os dados de saúde ocupacional dentro das responsabilidades médicas aplicáveis. Integrações de portal e trocas automatizadas de arquivos são apresentadas apenas quando efetivamente disponíveis.',
  },
  oliver: {
    eyebrow: 'Concierge',
    title: 'Oliver acompanha empresas e colaboradores.',
    lead:
      'Do primeiro contato até o encaminhamento final, o Oliver organiza a conversa, contextualiza a solicitação e encaminha à equipe CHRISMED os pontos que exigem tratativa humana.',
    contextGreeting:
      'Posso ajudar com ASO, exames ocupacionais ou atendimento para sua empresa.',
    quickReplies: [
      'Sou uma empresa',
      'Sou colaborador',
      'Agendar ASO',
      'Consultar orientações',
      'Falar com a equipe',
    ],
  },
  closing: {
    title: 'Uma medicina ocupacional condizente com o padrão CHRISMED.',
    body:
      'A responsabilidade médica é da Dra. Christiane Alencar. A operação ocupacional é conduzida por uma equipe orientada por sobriedade, discrição e continuidade — os mesmos princípios que sustentam o atendimento ambulatorial.',
    link: 'Conheça a Dra. Christiane Alencar',
  },
};

const EN: CopyShape = {
  hero: {
    eyebrow: 'Occupational Medicine',
    title: 'Occupational health,',
    titleItalic: 'orderly and discreet.',
    lead:
      'Occupational care designed for responsible companies and clear-headed employees. Every step is handled with restraint — with no visible bureaucracy.',
    ctaPrimary: 'Book an ASO',
    ctaSecondary: 'Care for companies',
    tags: ['ASO', 'Pre-hire', 'Periodic', 'Return-to-work', 'Role change', 'Exit'],
  },
  selector: {
    eyebrow: 'Choose your entry point',
    title: 'The journey adapts to who arrives.',
    lead:
      'Companies lead the rollout and workforce follow-up. Employees find guidance on the exam, scheduling and authorised documents. Select below to see the matching journey.',
    aria: 'Select audience',
    empresa: 'I represent a company',
    colaborador: 'I am an employee',
  },
  journeyCompany: {
    eyebrow: 'Company journey',
    title: 'A rollout aligned with the size of the operation.',
    lead:
      'The operation may be organised as a single journey with steps conducted by the CHRISMED team according to the company profile. The steps described the intended journey; they are not a live automation.',
    steps: [
      { title: 'Understand the services', body: 'The CHRISMED team presents the confirmed exams, available modalities and shared responsibilities before contracting.' },
      { title: 'Provide company, sites and demand', body: 'Legal name, sites served and expected volume. The rollout is sized from these inputs.' },
      { title: 'Register or import employees', body: 'The workforce may be organised by site, role and periodicity. The exact method (manual or import) is defined during rollout.' },
      { title: 'Schedule individually or in batches', body: 'Bookings may be conducted one by one or in blocks. The CHRISMED team advises the best approach.' },
      { title: 'Follow-up on pending items', body: 'Notices, reschedules and status per employee may be followed by the responsible team, when available and authorised.' },
      { title: 'Follow-up on care', body: 'Attendance history and operational notes are kept alongside the occupational record.' },
      { title: 'Access authorised documents', body: 'ASOs and related documents are made available to the company when authorised by the employee and the medical responsibility.' },
      { title: 'Talk to Oliver', body: 'Oliver accompanies the corporate journey and forwards to the CHRISMED team any matter requiring human handling.' },
    ],
    cta: 'Start corporate care with Oliver',
  },
  journeyEmployee: {
    eyebrow: 'Employee journey',
    title: 'From the indicated exam to the document — no friction.',
    lead:
      'If your company is already a CHRISMED client, the journey is guided end to end. If not, Oliver points to the next steps.',
    steps: [
      { title: 'Identify the exam', body: 'Pre-hire, periodic, return-to-work, role change or exit. The type is indicated by the company and confirmed at booking.' },
      { title: 'Consult or start scheduling', body: 'CHRISMED presents times and instructions compatible with the indicated exam.' },
      { title: 'Receive instructions', body: 'Preparation, documents and location are sent ahead of the booked date.' },
      { title: 'Confirm attendance', body: 'Prior confirmation reduces reschedules and keeps the occupational agenda orderly.' },
      { title: 'Reschedule or cancel when allowed', body: 'Changes are possible within the rules agreed with the contracting company and the CHRISMED agenda.' },
      { title: 'Access authorised documents', body: 'ASOs and receipts are available when available and authorised, according to medical responsibility and employee consent.' },
      { title: 'Talk to Oliver', body: 'Questions about exam, preparation or scheduling are handled by Oliver, who forwards to the CHRISMED team when needed.' },
    ],
    cta: 'Go to booking',
  },
  journeyShared: { oliverCta: 'Talk to Oliver' },
  services: {
    eyebrow: 'Confirmed occupational services',
    title: 'The published scope is only what CHRISMED confirms today.',
    lead:
      'Each modality responds to a specific moment of the work relationship. No item is presented as a "legal obligation" or "program" in this version — conditions and preparation are presented at booking.',
    items: [
      { tag: 'ASO', title: 'Occupational Health Certificate', body: 'The ASO is issued after medical assessment, according to the modality indicated by the company.' },
      { tag: 'Entry', title: 'Pre-hire exam', body: 'Medical assessment prior to starting activities, according to the role and information provided by the company.' },
      { tag: 'Follow-up', title: 'Periodic exam', body: 'Medical assessment along the employment relationship, at the periodicity agreed with the company.' },
      { tag: 'Return', title: 'Return-to-work', body: 'Medical assessment after leave, considering the reason for leave and the role to be resumed.' },
      { tag: 'Change', title: 'Role change', body: 'Medical assessment when the employee moves to a new role, considering the new role requirements.' },
      { tag: 'Exit', title: 'Exit exam', body: 'Medical assessment at the end of the employment relationship, with the corresponding ASO.' },
    ],
    footnote:
      'Prices, terms and conditions are presented at booking. This page does not publish a fixed ASO price while the dynamic data source is not validated.',
  },
  scheduling: {
    eyebrow: 'How booking works',
    title: 'Three steps, no visible bureaucracy.',
    steps: [
      { title: 'Request', body: 'The company or employee starts the request through the CHRISMED channel, indicating the exam type.' },
      { title: 'Confirmation', body: 'CHRISMED confirms time, location and preparation compatible with the indicated modality.' },
      { title: 'Care and documentation', body: 'Care is delivered and documentation is organised and made available when authorised.' },
    ],
  },
  docs: {
    eyebrow: 'Documents and follow-up',
    title: 'Orderly documentation, responsible access.',
    lead:
      'The ASO and related documents are linked to the care event and made available within medical rules and employee consent.',
    items: [
      'ASO issued after medical assessment.',
      'Preparation instructions and location sent ahead of the booked date.',
      'Occupational care history preserved with the medical record.',
      'Company access to authorised documents, when available and authorised.',
    ],
    footnote:
      'CHRISMED handles occupational health data within applicable medical responsibilities. Portal integrations and automated file exchanges are presented only when actually available.',
  },
  oliver: {
    eyebrow: 'Concierge',
    title: 'Oliver accompanies companies and employees.',
    lead:
      'From the first contact to the final referral, Oliver organises the conversation, contextualises the request and forwards to the CHRISMED team any matter requiring human handling.',
    contextGreeting:
      'I can help with ASO, occupational exams or care for your company.',
    quickReplies: [
      'I represent a company',
      'I am an employee',
      'Book an ASO',
      'Consult guidance',
      'Talk to the team',
    ],
  },
  closing: {
    title: 'Occupational medicine aligned with the CHRISMED standard.',
    body:
      'Medical responsibility rests with Dr. Christiane Alencar. Occupational operations are led by a team guided by sobriety, discretion and continuity — the same principles that sustain ambulatory care.',
    link: 'Meet Dr. Christiane Alencar',
  },
};

const ES: CopyShape = {
  hero: {
    eyebrow: 'Medicina Ocupacional',
    title: 'Salud ocupacional organizada,',
    titleItalic: 'discreta y acompañada.',
    lead:
      'Atención ocupacional pensada para empresas responsables y colaboradores que merecen claridad. Cada etapa se conduce con sobriedad, sin burocracia visible.',
    ctaPrimary: 'Agendar ASO',
    ctaSecondary: 'Atención para empresas',
    tags: ['ASO', 'Preocupacional', 'Periódico', 'Reintegro', 'Cambio de función', 'Egreso'],
  },
  selector: {
    eyebrow: 'Elija su punto de entrada',
    title: 'La jornada cambia según quién llega.',
    lead:
      'Las empresas lideran la implantación y el seguimiento del cuadro. Los colaboradores encuentran orientación de examen, agendamiento y documentos autorizados. Seleccione abajo para ver la jornada correspondiente.',
    aria: 'Seleccionar público',
    empresa: 'Represento una empresa',
    colaborador: 'Soy colaborador',
  },
  journeyCompany: {
    eyebrow: 'Jornada para empresas',
    title: 'Una implantación alineada al tamaño de la operación.',
    lead:
      'La operación podrá organizarse en una jornada única, con etapas conducidas por el equipo CHRISMED según el perfil de la empresa. Las etapas describen la jornada prevista, no una automatización en producción.',
    steps: [
      { title: 'Comprender los servicios', body: 'El equipo CHRISMED presenta los exámenes confirmados, las modalidades disponibles y las responsabilidades antes de la contratación.' },
      { title: 'Informar empresa, sedes y demanda', body: 'Razón social, sedes atendidas y volumen esperado. A partir de esos datos se dimensiona la implantación.' },
      { title: 'Registrar o importar colaboradores', body: 'El cuadro podrá organizarse por sede, cargo y periodicidad. La forma exacta (registro manual o importación) se define en la implantación.' },
      { title: 'Organizar agendamientos individuales o en lote', body: 'Los agendamientos podrán conducirse uno a uno o en bloques. El equipo CHRISMED orienta el mejor abordaje.' },
      { title: 'Acompañar pendencias', body: 'Convocatorias, reagendamientos y estado por colaborador podrán ser acompañados por el equipo responsable de la empresa, cuando esté disponible y autorizado.' },
      { title: 'Acompañar atenciones', body: 'El historial de asistencia y notas operativas se registran junto al historial ocupacional.' },
      { title: 'Acceder a documentos autorizados', body: 'ASOs y documentos relacionados se entregan a la empresa cuando estén autorizados por el colaborador y por la responsabilidad médica.' },
      { title: 'Hablar con Oliver', body: 'Oliver acompaña la jornada corporativa y deriva al equipo CHRISMED los puntos que requieren tratamiento humano.' },
    ],
    cta: 'Iniciar atención empresarial con Oliver',
  },
  journeyEmployee: {
    eyebrow: 'Jornada para colaboradores',
    title: 'Del examen indicado al documento — sin ruido.',
    lead:
      'Si su empresa ya es cliente CHRISMED, la jornada se acompaña de principio a fin. Si aún no lo es, Oliver indica los próximos pasos.',
    steps: [
      { title: 'Identificar el tipo de examen', body: 'Preocupacional, periódico, reintegro, cambio de función o egreso. El tipo lo indica la empresa y se confirma en el agendamiento.' },
      { title: 'Consultar o iniciar agendamiento', body: 'CHRISMED presenta horarios e instrucciones compatibles con el examen indicado.' },
      { title: 'Recibir instrucciones', body: 'La preparación, los documentos y el lugar se envían antes de la fecha agendada.' },
      { title: 'Confirmar asistencia', body: 'La confirmación previa reduce reagendamientos y ordena la agenda ocupacional.' },
      { title: 'Reagendar o cancelar cuando esté permitido', body: 'Los cambios son posibles dentro de las reglas acordadas con la empresa contratante y la agenda CHRISMED.' },
      { title: 'Acceder a documentos autorizados', body: 'ASOs y comprobantes están disponibles cuando esté disponible y autorizado, según responsabilidad médica y consentimiento.' },
      { title: 'Hablar con Oliver', body: 'Dudas sobre examen, preparación o agendamiento son atendidas por Oliver, que deriva al equipo CHRISMED cuando corresponde.' },
    ],
    cta: 'Ir al agendamiento',
  },
  journeyShared: { oliverCta: 'Hablar con Oliver' },
  services: {
    eyebrow: 'Servicios ocupacionales confirmados',
    title: 'El alcance publicado es solo lo que CHRISMED confirma hoy.',
    lead:
      'Cada modalidad responde a un momento específico de la relación laboral. Ningún ítem se presenta como "obligación legal" o "programa" en esta versión — las condiciones y la preparación se presentan durante el agendamiento.',
    items: [
      { tag: 'ASO', title: 'Certificado de Salud Ocupacional', body: 'El ASO se emite tras la evaluación médica, según la modalidad indicada por la empresa.' },
      { tag: 'Ingreso', title: 'Examen preocupacional', body: 'Evaluación médica previa al inicio de actividades, según el cargo y la información de la empresa.' },
      { tag: 'Seguimiento', title: 'Examen periódico', body: 'Evaluación médica durante el vínculo laboral, con la periodicidad acordada con la empresa.' },
      { tag: 'Reintegro', title: 'Reintegro al trabajo', body: 'Evaluación médica tras un periodo de ausencia, considerando el motivo y la función a retomar.' },
      { tag: 'Cambio', title: 'Cambio de función', body: 'Evaluación médica cuando el colaborador asume una nueva función, considerando las exigencias del cargo.' },
      { tag: 'Egreso', title: 'Examen de egreso', body: 'Evaluación médica al cierre del vínculo laboral, con la emisión del ASO correspondiente.' },
    ],
    footnote:
      'Valores, plazos y condiciones se presentan durante el agendamiento. Esta página no publica precio fijo del ASO mientras la fuente de datos dinámica no esté validada.',
  },
  scheduling: {
    eyebrow: 'Cómo funciona el agendamiento',
    title: 'Tres pasos, sin burocracia visible.',
    steps: [
      { title: 'Solicitud', body: 'La empresa o el colaborador inicia la solicitud por el canal CHRISMED, indicando el tipo de examen.' },
      { title: 'Confirmación', body: 'CHRISMED confirma horario, lugar y preparación compatibles con la modalidad indicada.' },
      { title: 'Atención y documentación', body: 'La atención se realiza y la documentación se organiza y entrega cuando esté autorizado.' },
    ],
  },
  docs: {
    eyebrow: 'Documentos y acompañamiento',
    title: 'Documentación organizada, acceso responsable.',
    lead:
      'El ASO y los documentos relacionados quedan vinculados a la atención y se entregan dentro de las reglas médicas y del consentimiento del colaborador.',
    items: [
      'ASO emitido tras evaluación médica.',
      'Instrucciones de preparación y lugar enviadas antes de la fecha agendada.',
      'Historial de atenciones ocupacionales preservado junto al historial médico.',
      'Acceso de la empresa a documentos autorizados, cuando esté disponible y autorizado.',
    ],
    footnote:
      'CHRISMED trata los datos de salud ocupacional dentro de las responsabilidades médicas aplicables. Integraciones de portal e intercambios automatizados de archivos se presentan solo cuando están efectivamente disponibles.',
  },
  oliver: {
    eyebrow: 'Concierge',
    title: 'Oliver acompaña a empresas y colaboradores.',
    lead:
      'Del primer contacto a la derivación final, Oliver organiza la conversación, contextualiza la solicitud y deriva al equipo CHRISMED los puntos que requieren tratamiento humano.',
    contextGreeting:
      'Puedo ayudar con ASO, exámenes ocupacionales o atención para su empresa.',
    quickReplies: [
      'Represento una empresa',
      'Soy colaborador',
      'Agendar ASO',
      'Consultar orientaciones',
      'Hablar con el equipo',
    ],
  },
  closing: {
    title: 'Una medicina ocupacional acorde al estándar CHRISMED.',
    body:
      'La responsabilidad médica es de la Dra. Christiane Alencar. La operación ocupacional está a cargo de un equipo guiado por sobriedad, discreción y continuidad — los mismos principios que sostienen la atención ambulatoria.',
    link: 'Conozca a la Dra. Christiane Alencar',
  },
};

const COPY: Record<Lang, CopyShape> = { pt: PT, en: EN, es: ES };
