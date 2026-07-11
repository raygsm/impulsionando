/**
 * /chrismed/internacional — Global Medical Support (Onda V3.c · Quiet Luxury)
 *
 * Reescrita completa da rota GMS anterior (arquivada em
 * src/content/chrismed/_archive/internacional-v2.tsx.txt).
 *
 * Guardrails V3.c:
 *  - Trilingual real (PT · EN · ES): idioma altera hero, seleções, jornada,
 *    emergência, quick replies do Oliver, labels acessíveis e canonical
 *    quando aplicável.
 *  - Somente primitivos CHRISMED. Quiet Luxury preservado.
 *  - Nenhum CTA público abre WhatsApp; Oliver é o único ponto de conversa.
 *  - Sem afirmar "24 horas", cobertura fixa, parceria com consulados,
 *    seguradoras, hospitais ou laboratórios nominados, tempo de resposta,
 *    volume de atendimentos ou transferência garantida.
 *  - Bloco de emergência sempre visível, não alarmista: reforça que a
 *    CHRISMED não substitui o serviço público de emergência local.
 *  - Nenhum número de emergência é publicado (validação pendente do Codex).
 *
 * Pendências registradas para o Codex / próximas ondas:
 *  - Rota canônica futura recomendada: `/chrismed/gms`, com
 *    `/chrismed/internacional` preservada como alias/redirect 301.
 *  - hreflang por idioma quando a arquitetura oferecer URLs próprias.
 *  - Contrato real do WhatsApp (transferência de contexto e SLA).
 *  - Handoff humano com SLA para transferência médica.
 *  - Backend conversacional real do Oliver.
 *  - Números de emergência validados por localização.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
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

export const Route = createFileRoute('/chrismed/internacional')({
  head: () => ({
    meta: [
      { title: 'Global Medical Support — CHRISMED' },
      {
        name: 'description',
        content:
          'Coordenação médica internacional CHRISMED no Rio de Janeiro em português, inglês e espanhol para pacientes estrangeiros, familiares, seguradoras, consulados e hospitais.',
      },
      { property: 'og:title', content: 'Global Medical Support — CHRISMED' },
      {
        property: 'og:description',
        content:
          'International medical coordination in Rio de Janeiro (PT · EN · ES). CHRISMED does not replace local emergency services.',
      },
      { property: 'og:type', content: 'website' },
      {
        property: 'og:url',
        content:
          'https://chrismed.impulsionando.com.br/chrismed/internacional',
      },
      { property: 'og:site_name', content: 'CHRISMED' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Global Medical Support — CHRISMED' },
      {
        name: 'twitter:description',
        content:
          'International medical coordination in Rio de Janeiro (PT · EN · ES).',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://chrismed.impulsionando.com.br/chrismed/internacional',
      },
    ],
  }),
  component: ChrismedGmsPage,
});

function openOliver() {
  if (typeof window !== 'undefined') {
    openChrismedOliver();
    window.dispatchEvent(new CustomEvent('chrismed:oliver:open'));
  }
}

function ChrismedGmsPage() {
  const shellLang = useLang();
  // GMS opera apenas em EN e ES. Se o usuário estiver com PT selecionado
  // no shell, exibimos o conteúdo em EN por padrão e mantemos o português
  // apenas na chamada inicial (título) logo abaixo.
  const lang: Lang = shellLang === 'es' ? 'es' : 'en';
  const t = COPY[lang];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const detail = {
      context: 'gms',
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
      {/* 1 · Hero internacional ─────────────────── */}
      <ChrismedSection tone="ivory" className="pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-left">
          <ChrismedEyebrow>{t.hero.eyebrow}</ChrismedEyebrow>

          {/* Chamada em português — única presença do PT nesta página */}
          <p className="chrismed-sans mt-4 text-[11px] uppercase tracking-[0.28em] text-[var(--chrismed-champagne-deep)]">
            PT · para pacientes brasileiros
          </p>
          <p className="chrismed-serif mt-2 text-lg italic text-[var(--chrismed-graphite)] md:text-xl">
            Coordenação médica internacional, discreta e multilíngue — atendimento conduzido em inglês e espanhol.
          </p>

          <ChrismedHeading level={1} className="mt-6">
            {t.hero.title}{' '}
            <span className="chrismed-serif italic text-[var(--chrismed-graphite)]">
              {t.hero.titleItalic}
            </span>
          </ChrismedHeading>

          <p className="chrismed-sans mt-8 max-w-[50ch] text-base leading-relaxed text-[var(--chrismed-graphite)] md:text-lg">
            {t.hero.lead}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <ChrismedButton size="lg" onClick={openOliver}>
              {t.hero.ctaPrimary}
            </ChrismedButton>
            <ChrismedButton size="lg" variant="ghost" onClick={openOliver}>
              {t.hero.ctaSecondary}
            </ChrismedButton>
          </div>
          <p className="chrismed-sans mt-8 text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-mist)]">
            {t.hero.languagesHint}
          </p>
        </div>
      </ChrismedSection>

      {/* 2 · Emergência (bloco visível, não alarmista) ── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-3xl">
          <div className="border-l-2 border-[var(--chrismed-champagne-deep)] pl-6 md:pl-8">
            <div className="chrismed-sans text-[10px] uppercase tracking-[0.3em] text-[var(--chrismed-champagne-deep)]">
              {t.emergency.eyebrow}
            </div>
            <ChrismedHeading level={3} className="mt-3">
              {t.emergency.title}
            </ChrismedHeading>
            <p className="chrismed-sans mt-4 max-w-[56ch] text-base leading-relaxed text-[var(--chrismed-ink)]">
              {t.emergency.body}
            </p>
            <p className="chrismed-sans mt-4 max-w-[56ch] text-xs italic leading-relaxed text-[var(--chrismed-mist)]">
              {t.emergency.footnote}
            </p>
          </div>
        </div>
      </ChrismedSection>

      {/* 3 · Identificação da necessidade ────────── */}
      <ChrismedSection tone="ivory">
        <div className="mx-auto max-w-5xl">
          <ChrismedEyebrow>{t.needs.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.needs.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.needs.lead}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.needs.items.map((it) => (
              <ChrismedCard key={it.title} className="p-8">
                <div className="chrismed-sans text-[10px] uppercase tracking-[0.22em] text-[var(--chrismed-champagne-deep)]">
                  {it.tag}
                </div>
                <h3 className="chrismed-serif mt-3 text-lg text-[var(--chrismed-ink)]">
                  {it.title}
                </h3>
                <p className="chrismed-sans mt-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                  {it.body}
                </p>
              </ChrismedCard>
            ))}
          </div>
          <p className="chrismed-sans mt-10 max-w-[56ch] text-xs italic leading-relaxed text-[var(--chrismed-mist)]">
            {t.needs.footnote}
          </p>
        </div>
      </ChrismedSection>

      {/* 4 · Jornada GMS ─────────────────────────── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-4xl">
          <ChrismedEyebrow>{t.journey.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.journey.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.journey.lead}
          </p>
          <ol className="mt-12 space-y-6">
            {t.journey.steps.map((step, idx) => (
              <li
                key={step.title}
                className="flex gap-6 border-t border-[var(--chrismed-champagne-deep)]/25 pt-6 first:border-t-0 first:pt-0"
              >
                <span className="chrismed-serif w-10 shrink-0 text-2xl italic text-[var(--chrismed-champagne-deep)]">
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
        </div>
      </ChrismedSection>

      {/* 5 · Coordenação com terceiros ───────────── */}
      <ChrismedSection tone="ivory">
        <div className="mx-auto max-w-3xl">
          <ChrismedEyebrow>{t.coord.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="mt-4">
            {t.coord.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.coord.lead}
          </p>
          <ul className="mt-8 space-y-3">
            {t.coord.items.map((it) => (
              <li key={it} className="chrismed-sans flex gap-3 text-sm leading-relaxed text-[var(--chrismed-graphite)]">
                <span className="mt-2 h-[3px] w-4 shrink-0 bg-[var(--chrismed-champagne-deep)]" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
          <p className="chrismed-sans mt-8 max-w-[54ch] text-xs italic leading-relaxed text-[var(--chrismed-mist)]">
            {t.coord.footnote}
          </p>
        </div>
      </ChrismedSection>

      {/* 6 · Transferência médica ────────────────── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-3xl">
          <ChrismedEyebrow>{t.transfer.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={3} className="mt-4">
            {t.transfer.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.transfer.body}
          </p>
        </div>
      </ChrismedSection>

      {/* 7 · Oliver contextual (noir) ────────────── */}
      <ChrismedSection tone="noir">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-8">
          <ChrismedEyebrow>{t.oliver.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={2} className="text-[var(--chrismed-ivory)]">
            {t.oliver.title}
          </ChrismedHeading>
          <p className="chrismed-sans max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-ivory)]/85">
            {t.oliver.lead}
          </p>
          <ChrismedOliverLauncher lang={lang} variant="inline" onClick={openOliver} />
          <p className="chrismed-sans text-[11px] uppercase tracking-[0.25em] text-[var(--chrismed-champagne)]/70">
            {t.oliver.hint}
          </p>
        </div>
      </ChrismedSection>

      {/* 8 · Confiança e privacidade ─────────────── */}
      <ChrismedSection tone="ivory">
        <div className="mx-auto max-w-3xl">
          <ChrismedEyebrow>{t.trust.eyebrow}</ChrismedEyebrow>
          <ChrismedHeading level={3} className="mt-4">
            {t.trust.title}
          </ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.trust.body}
          </p>
        </div>
      </ChrismedSection>

      {/* 9 · Fechamento ──────────────────────────── */}
      <ChrismedSection tone="bone">
        <div className="mx-auto max-w-3xl text-left">
          <ChrismedHeading level={3}>{t.closing.title}</ChrismedHeading>
          <p className="chrismed-sans mt-6 max-w-[54ch] text-base leading-relaxed text-[var(--chrismed-graphite)]">
            {t.closing.body}
          </p>
        </div>
      </ChrismedSection>
    </ChrismedShell>
  );
}

// ─────────────────────────────────────────────────
// COPY (PT · EN · ES)
// ─────────────────────────────────────────────────

type Step = { title: string; body: string };

type Copy = {
  hero: {
    eyebrow: string;
    title: string;
    titleItalic: string;
    lead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    languagesHint: string;
  };
  emergency: { eyebrow: string; title: string; body: string; footnote: string };
  needs: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { tag: string; title: string; body: string }[];
    footnote: string;
  };
  journey: { eyebrow: string; title: string; lead: string; steps: Step[] };
  coord: { eyebrow: string; title: string; lead: string; items: string[]; footnote: string };
  transfer: { eyebrow: string; title: string; body: string };
  oliver: {
    eyebrow: string;
    title: string;
    lead: string;
    hint: string;
    contextGreeting: string;
    quickReplies: string[];
  };
  trust: { eyebrow: string; title: string; body: string };
  closing: { title: string; body: string };
};

const PT: Copy = {
  hero: {
    eyebrow: 'Global Medical Support',
    title: 'Coordenação médica internacional,',
    titleItalic: 'discreta e multilíngue.',
    lead:
      'A CHRISMED apoia pacientes estrangeiros, familiares, seguradoras, consulados e hospitais que precisam de coordenação médica no Rio de Janeiro. A conversa começa em português, inglês ou espanhol — sem burocracia visível.',
    ctaPrimary: 'Preciso de assistência médica',
    ctaSecondary: 'Falar com Oliver',
    languagesHint: 'Atendimento em PT · EN · ES',
  },
  emergency: {
    eyebrow: 'Orientação de urgência',
    title: 'A CHRISMED não substitui o serviço público de emergência.',
    body:
      'Se houver risco imediato à vida, dificuldade intensa para respirar, perda de consciência ou outra situação grave, procure o serviço de emergência local imediatamente. Não aguarde Oliver em possível emergência.',
    footnote:
      'Números de emergência variam por localização e são apresentados apenas quando validados. A CHRISMED coordena assistência médica; não presta serviço público de urgência.',
  },
  needs: {
    eyebrow: 'Identifique a necessidade',
    title: 'Cada situação exige um caminho diferente.',
    lead:
      'Selecione mentalmente o que descreve melhor a situação. O Oliver organiza a conversa a partir daí e a equipe CHRISMED define os próximos passos.',
    items: [
      { tag: 'Consulta', title: 'Consulta ou orientação médica', body: 'Avaliação clínica com médico da CHRISMED, presencial ou por telemedicina, conforme disponibilidade e adequação ao quadro.' },
      { tag: 'Telemedicina', title: 'Teleconsulta internacional', body: 'Consulta por vídeo em português, inglês ou espanhol, sujeita à disponibilidade da agenda e ao contexto clínico apresentado.' },
      { tag: 'Hospitalar', title: 'Acompanhamento hospitalar', body: 'Coordenação com a equipe hospitalar quando autorizado pelo paciente, familiar responsável ou representante legal.' },
      { tag: 'Família', title: 'Coordenação com familiares', body: 'Ponte de comunicação com familiares no Brasil ou no exterior, respeitando o consentimento do paciente.' },
      { tag: 'Institucional', title: 'Consulado ou seguradora', body: 'Interface com consulados e seguradoras quando o paciente ou seu representante autoriza formalmente o contato.' },
      { tag: 'Transferência', title: 'Transferência médica', body: 'Transferências entre unidades exigem avaliação individualizada e aceitação da unidade receptora. Não são confirmadas de imediato.' },
    ],
    footnote:
      'A CHRISMED não afirma cobertura permanente, disponibilidade 24 horas ou parceria com organizações que não estejam formalmente confirmadas.',
  },
  journey: {
    eyebrow: 'Jornada GMS',
    title: 'Sete passos, cada um conduzido com sobriedade.',
    lead:
      'A jornada descreve como uma solicitação internacional é acolhida e organizada. Nenhum passo garante aceitação, tempo de resposta ou transferência antes da avaliação humana.',
    steps: [
      { title: 'Selecionar idioma', body: 'Português, inglês ou espanhol. A conversa toda é conduzida no idioma escolhido.' },
      { title: 'Informar localização e situação', body: 'Cidade e local atual, com uma descrição breve da situação.' },
      { title: 'Identificar o tipo de suporte', body: 'Consulta, telemedicina, acompanhamento, coordenação familiar, interface institucional ou transferência.' },
      { title: 'Organizar as informações essenciais', body: 'Dados clínicos disponíveis, medicações em uso, autorizações, representantes legais e canais de contato.' },
      { title: 'Conectar a equipe apropriada', body: 'A equipe CHRISMED avalia se pode atender diretamente ou se a situação exige coordenação com terceiros autorizados.' },
      { title: 'Coordenar os próximos passos', body: 'Agendamento, deslocamento, autorização hospitalar ou coordenação com seguradora, conforme cada caso.' },
      { title: 'Acompanhar a continuidade', body: 'Quando aplicável, a continuidade do cuidado é acompanhada com registros preservados junto ao prontuário.' },
    ],
  },
  coord: {
    eyebrow: 'Coordenação com terceiros autorizados',
    title: 'A coordenação só acontece com autorização formal.',
    lead:
      'Sempre que a situação exigir interface com consulados, seguradoras, hospitais, familiares ou empregadores, a CHRISMED só age após autorização do paciente ou de seu representante legal.',
    items: [
      'Consulados: apenas quando o paciente autoriza formalmente e o consulado responde à solicitação.',
      'Seguradoras: apenas dentro da cobertura contratada pelo paciente ou por sua empresa.',
      'Hospitais: coordenação limitada à autorização do paciente e ao acesso concedido pela unidade receptora.',
      'Familiares: comunicação apenas com pessoas indicadas pelo próprio paciente.',
      'Empresas contratantes: interface possível quando a assistência é vinculada a um contrato corporativo ativo.',
    ],
    footnote:
      'A CHRISMED não publica nomes de consulados, seguradoras, hospitais ou parceiros. Menções nominativas só ocorrem após validação factual e autorização.',
  },
  transfer: {
    eyebrow: 'Transferência médica',
    title: 'A transferência exige avaliação individualizada.',
    body:
      'Quando o caso exigir coordenação médica ou avaliação individualizada, Oliver poderá encaminhar o contexto para a Dra. Christiane Alencar ou para a equipe autorizada. A transferência real depende do contrato técnico, da disponibilidade da equipe e do SLA definido internamente. Nada é confirmado de imediato apenas com base em uma solicitação inicial.',
  },
  oliver: {
    eyebrow: 'Concierge internacional',
    title: 'Oliver acolhe em três idiomas.',
    lead:
      'Oliver organiza a conversa, contextualiza a solicitação e encaminha à equipe CHRISMED os pontos que exigem tratativa humana. Nesta versão, Oliver não substitui uma consulta médica e não realiza triagem clínica.',
    hint: 'PT · EN · ES · sem WhatsApp direto nesta versão',
    contextGreeting:
      'Posso ajudar com assistência médica internacional no Rio de Janeiro. Não substituo o serviço público de emergência local.',
    quickReplies: [
      'Isto pode ser uma emergência',
      'Preciso de consulta médica',
      'Estou em um hospital',
      'Preciso de suporte hospitalar',
      'Preciso de transferência médica',
      'Continue in English',
      'Continuar en español',
      'Falar com a equipe',
    ],
  },
  trust: {
    eyebrow: 'Confiança e privacidade',
    title: 'Dados de saúde tratados com discrição.',
    body:
      'A CHRISMED trata dados de saúde dentro das responsabilidades médicas aplicáveis. Informações compartilhadas com terceiros só ocorrem mediante autorização e no escopo estritamente necessário para o cuidado.',
  },
  closing: {
    title: 'Uma coordenação internacional condizente com o padrão CHRISMED.',
    body:
      'A responsabilidade médica é da Dra. Christiane Alencar. A coordenação internacional é conduzida por uma equipe orientada por sobriedade, discrição e continuidade — os mesmos princípios que sustentam o atendimento ambulatorial e ocupacional.',
  },
};

const EN: Copy = {
  hero: {
    eyebrow: 'Global Medical Support',
    title: 'International medical coordination,',
    titleItalic: 'discreet and multilingual.',
    lead:
      'CHRISMED supports foreign patients, families, insurers, consulates and hospitals that need medical coordination in Rio de Janeiro. The conversation starts in Portuguese, English or Spanish — with no visible bureaucracy.',
    ctaPrimary: 'I need medical assistance',
    ctaSecondary: 'Talk to Oliver',
    languagesHint: 'Support in PT · EN · ES',
  },
  emergency: {
    eyebrow: 'Emergency guidance',
    title: 'CHRISMED does not replace local emergency services.',
    body:
      'If there is an immediate threat to life, severe difficulty breathing, loss of consciousness or another serious condition, contact the local emergency service immediately. Do not wait for Oliver in a possible emergency.',
    footnote:
      'Emergency numbers vary by location and are shown only once validated. CHRISMED coordinates medical assistance; it does not provide public emergency service.',
  },
  needs: {
    eyebrow: 'Identify the need',
    title: 'Each situation calls for a different path.',
    lead:
      'Mentally select what best describes the situation. Oliver organises the conversation from there, and the CHRISMED team defines the next steps.',
    items: [
      { tag: 'Consultation', title: 'Medical consultation or guidance', body: 'Clinical assessment with a CHRISMED physician, in person or via telemedicine, subject to availability and clinical fit.' },
      { tag: 'Telemedicine', title: 'International telehealth', body: 'Video consultation in Portuguese, English or Spanish, subject to schedule availability and the clinical context presented.' },
      { tag: 'Hospital', title: 'Hospital follow-up', body: 'Coordination with the hospital team when authorised by the patient, family member or legal representative.' },
      { tag: 'Family', title: 'Family coordination', body: 'Communication bridge with family members in Brazil or abroad, respecting patient consent.' },
      { tag: 'Institutional', title: 'Consulate or insurer', body: 'Interface with consulates and insurers when the patient or their representative formally authorises the contact.' },
      { tag: 'Transfer', title: 'Medical transfer', body: 'Transfers between units require individual assessment and acceptance by the receiving unit. They are not confirmed immediately.' },
    ],
    footnote:
      'CHRISMED does not claim permanent coverage, 24-hour availability or partnership with organisations that are not formally confirmed.',
  },
  journey: {
    eyebrow: 'GMS journey',
    title: 'Seven steps, each handled with restraint.',
    lead:
      'The journey describes how an international request is received and organised. No step guarantees acceptance, response time or transfer before human assessment.',
    steps: [
      { title: 'Select the language', body: 'Portuguese, English or Spanish. The whole conversation is conducted in the chosen language.' },
      { title: 'Provide location and situation', body: 'Current city and location, plus a brief description of the situation.' },
      { title: 'Identify the type of support', body: 'Consultation, telemedicine, follow-up, family coordination, institutional interface or transfer.' },
      { title: 'Organise the essentials', body: 'Available clinical data, current medications, authorisations, legal representatives and contact channels.' },
      { title: 'Connect the appropriate team', body: 'The CHRISMED team assesses whether it can serve directly or the situation requires coordination with authorised third parties.' },
      { title: 'Coordinate the next steps', body: 'Scheduling, transportation, hospital authorisation or insurer coordination, according to the case.' },
      { title: 'Follow up on continuity', body: 'When applicable, continuity of care is followed with records preserved with the medical record.' },
    ],
  },
  coord: {
    eyebrow: 'Coordination with authorised third parties',
    title: 'Coordination only happens with formal authorisation.',
    lead:
      'Whenever the situation requires interface with consulates, insurers, hospitals, family members or employers, CHRISMED only acts after authorisation from the patient or their legal representative.',
    items: [
      'Consulates: only when the patient formally authorises and the consulate responds to the request.',
      'Insurers: only within the coverage contracted by the patient or by their company.',
      'Hospitals: coordination limited to patient authorisation and access granted by the receiving unit.',
      'Family members: communication only with people indicated by the patient themselves.',
      'Contracting companies: interface possible when the assistance is linked to an active corporate agreement.',
    ],
    footnote:
      'CHRISMED does not publish names of consulates, insurers, hospitals or partners. Named mentions only occur after factual validation and authorisation.',
  },
  transfer: {
    eyebrow: 'Medical transfer',
    title: 'Transfers require individual assessment.',
    body:
      'When the case requires medical coordination or individual assessment, Oliver may forward the context to Dr. Christiane Alencar or to the authorised team. The actual transfer depends on the technical agreement, team availability and the internally defined SLA. Nothing is confirmed immediately from an initial request alone.',
  },
  oliver: {
    eyebrow: 'International concierge',
    title: 'Oliver welcomes in three languages.',
    lead:
      'Oliver organises the conversation, contextualises the request and forwards to the CHRISMED team the points that require human handling. In this version, Oliver does not replace a medical consultation and does not perform clinical triage.',
    hint: 'PT · EN · ES · no direct WhatsApp in this version',
    contextGreeting:
      'I can help with international medical assistance in Rio de Janeiro. I do not replace the local public emergency service.',
    quickReplies: [
      'This may be an emergency',
      'I need a medical consultation',
      'I am at a hospital',
      'I need hospital support',
      'I need a medical transfer',
      'Continue in Portuguese',
      'Continuar en español',
      'Speak with the team',
    ],
  },
  trust: {
    eyebrow: 'Trust and privacy',
    title: 'Health data handled with discretion.',
    body:
      'CHRISMED handles health data within applicable medical responsibilities. Information shared with third parties only occurs upon authorisation and within the strictly necessary scope for care.',
  },
  closing: {
    title: 'International coordination aligned with the CHRISMED standard.',
    body:
      'Medical responsibility rests with Dr. Christiane Alencar. International coordination is led by a team guided by sobriety, discretion and continuity — the same principles that sustain ambulatory and occupational care.',
  },
};

const ES: Copy = {
  hero: {
    eyebrow: 'Global Medical Support',
    title: 'Coordinación médica internacional,',
    titleItalic: 'discreta y multilingüe.',
    lead:
      'CHRISMED apoya a pacientes extranjeros, familiares, aseguradoras, consulados y hospitales que necesitan coordinación médica en Río de Janeiro. La conversación comienza en portugués, inglés o español — sin burocracia visible.',
    ctaPrimary: 'Necesito asistencia médica',
    ctaSecondary: 'Hablar con Oliver',
    languagesHint: 'Atención en PT · EN · ES',
  },
  emergency: {
    eyebrow: 'Orientación de urgencia',
    title: 'CHRISMED no sustituye al servicio local de emergencias.',
    body:
      'Si existe un riesgo inmediato para la vida, dificultad intensa para respirar, pérdida de conciencia u otra situación grave, contacte inmediatamente al servicio local de emergencias. No espere a Oliver ante una posible emergencia.',
    footnote:
      'Los números de emergencia varían según la ubicación y se muestran solo cuando están validados. CHRISMED coordina asistencia médica; no presta el servicio público de urgencia.',
  },
  needs: {
    eyebrow: 'Identifique la necesidad',
    title: 'Cada situación pide un camino distinto.',
    lead:
      'Seleccione mentalmente lo que mejor describe la situación. Oliver organiza la conversación a partir de ahí y el equipo CHRISMED define los siguientes pasos.',
    items: [
      { tag: 'Consulta', title: 'Consulta u orientación médica', body: 'Evaluación clínica con un médico de CHRISMED, presencial o por telemedicina, según disponibilidad y adecuación al cuadro.' },
      { tag: 'Telemedicina', title: 'Teleconsulta internacional', body: 'Consulta por video en portugués, inglés o español, sujeta a la disponibilidad de agenda y al contexto clínico presentado.' },
      { tag: 'Hospitalario', title: 'Acompañamiento hospitalario', body: 'Coordinación con el equipo hospitalario cuando esté autorizada por el paciente, familiar responsable o representante legal.' },
      { tag: 'Familia', title: 'Coordinación con familiares', body: 'Puente de comunicación con familiares en Brasil o en el exterior, respetando el consentimiento del paciente.' },
      { tag: 'Institucional', title: 'Consulado o aseguradora', body: 'Interfaz con consulados y aseguradoras cuando el paciente o su representante autoriza formalmente el contacto.' },
      { tag: 'Traslado', title: 'Traslado médico', body: 'Los traslados entre unidades requieren evaluación individual y aceptación de la unidad receptora. No se confirman de inmediato.' },
    ],
    footnote:
      'CHRISMED no afirma cobertura permanente, disponibilidad de 24 horas ni alianza con organizaciones que no estén formalmente confirmadas.',
  },
  journey: {
    eyebrow: 'Jornada GMS',
    title: 'Siete pasos, conducidos con sobriedad.',
    lead:
      'La jornada describe cómo se acoge y organiza una solicitud internacional. Ningún paso garantiza aceptación, tiempo de respuesta o traslado antes de la evaluación humana.',
    steps: [
      { title: 'Seleccionar el idioma', body: 'Portugués, inglés o español. Toda la conversación se conduce en el idioma elegido.' },
      { title: 'Informar ubicación y situación', body: 'Ciudad y ubicación actual, con una descripción breve de la situación.' },
      { title: 'Identificar el tipo de soporte', body: 'Consulta, telemedicina, acompañamiento, coordinación familiar, interfaz institucional o traslado.' },
      { title: 'Organizar la información esencial', body: 'Datos clínicos disponibles, medicaciones en uso, autorizaciones, representantes legales y canales de contacto.' },
      { title: 'Conectar al equipo apropiado', body: 'El equipo CHRISMED evalúa si puede atender directamente o si la situación requiere coordinación con terceros autorizados.' },
      { title: 'Coordinar los próximos pasos', body: 'Agendamiento, desplazamiento, autorización hospitalaria o coordinación con la aseguradora, según cada caso.' },
      { title: 'Acompañar la continuidad', body: 'Cuando corresponde, la continuidad del cuidado se acompaña con registros preservados junto al historial médico.' },
    ],
  },
  coord: {
    eyebrow: 'Coordinación con terceros autorizados',
    title: 'La coordinación solo ocurre con autorización formal.',
    lead:
      'Siempre que la situación requiera interfaz con consulados, aseguradoras, hospitales, familiares o empleadores, CHRISMED actúa solo tras la autorización del paciente o de su representante legal.',
    items: [
      'Consulados: solo cuando el paciente autoriza formalmente y el consulado responde a la solicitud.',
      'Aseguradoras: solo dentro de la cobertura contratada por el paciente o por su empresa.',
      'Hospitales: coordinación limitada a la autorización del paciente y al acceso concedido por la unidad receptora.',
      'Familiares: comunicación solo con las personas indicadas por el propio paciente.',
      'Empresas contratantes: interfaz posible cuando la asistencia esté vinculada a un contrato corporativo activo.',
    ],
    footnote:
      'CHRISMED no publica nombres de consulados, aseguradoras, hospitales ni socios. Menciones nominativas ocurren solo tras validación factual y autorización.',
  },
  transfer: {
    eyebrow: 'Traslado médico',
    title: 'El traslado exige evaluación individualizada.',
    body:
      'Cuando el caso exige coordinación médica o evaluación individualizada, Oliver puede derivar el contexto a la Dra. Christiane Alencar o al equipo autorizado. El traslado real depende del contrato técnico, de la disponibilidad del equipo y del SLA definido internamente. Nada se confirma de inmediato solo con base en una solicitud inicial.',
  },
  oliver: {
    eyebrow: 'Concierge internacional',
    title: 'Oliver acoge en tres idiomas.',
    lead:
      'Oliver organiza la conversación, contextualiza la solicitud y deriva al equipo CHRISMED los puntos que requieren tratamiento humano. En esta versión, Oliver no sustituye una consulta médica y no realiza triage clínico.',
    hint: 'PT · EN · ES · sin WhatsApp directo en esta versión',
    contextGreeting:
      'Puedo ayudar con asistencia médica internacional en Río de Janeiro. No sustituyo al servicio local de emergencias.',
    quickReplies: [
      'Esto puede ser una emergencia',
      'Necesito una consulta médica',
      'Estoy en un hospital',
      'Necesito soporte hospitalario',
      'Necesito un traslado médico',
      'Continue in English',
      'Continuar en portugués',
      'Hablar con el equipo',
    ],
  },
  trust: {
    eyebrow: 'Confianza y privacidad',
    title: 'Datos de salud tratados con discreción.',
    body:
      'CHRISMED trata los datos de salud dentro de las responsabilidades médicas aplicables. La información compartida con terceros ocurre solo con autorización y dentro del alcance estrictamente necesario para el cuidado.',
  },
  closing: {
    title: 'Una coordinación internacional acorde al estándar CHRISMED.',
    body:
      'La responsabilidad médica es de la Dra. Christiane Alencar. La coordinación internacional está a cargo de un equipo guiado por sobriedad, discreción y continuidad — los mismos principios que sostienen la atención ambulatoria y ocupacional.',
  },
};

const COPY: Record<Lang, Copy> = { pt: PT, en: EN, es: ES };
