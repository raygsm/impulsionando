import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Activity, HeartPulse } from 'lucide-react';

export const Route = createFileRoute('/chrismed/especialidades')({
  head: () => ({
    meta: [
      { title: 'Especialidades — Dra. Christiane Alencar · CHRISMED' },
      { name: 'description', content: 'Gastroenterologia, Hepatologia e Clínica Médica com a Dra. Christiane Alencar. Conheça o escopo de atendimento disponível na CHRISMED.' },
      { property: 'og:title', content: 'Especialidades · CHRISMED' },
      { property: 'og:description', content: 'Gastroenterologia, Hepatologia e Clínica Médica com a Dra. Christiane Alencar.' },
    ],
  }),
  component: EspecialidadesPage,
});

const ICONS = { gastro: Activity, hepato: HeartPulse, clinica: Stethoscope } as const;

function EspecialidadesPage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] mb-5 uppercase tracking-[0.18em] text-[10px]">{t.eyebrow}</Badge>
          <h1 className="chrismed-serif text-4xl md:text-6xl text-[var(--chrismed-ink)] leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-[var(--chrismed-graphite)] max-w-2xl">{t.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)]">
              <Link to="/chrismed/agendar">{t.cta1}</Link>
            </Button>
            <Button asChild variant="outline" className="border-[var(--chrismed-forest)] bg-white text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)]">
              <Link to="/chrismed/contato">{t.cta2}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-5">
          {t.items.map((s) => {
            const Icon = ICONS[s.icon as keyof typeof ICONS];
            return (
              <article key={s.title} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7">
                <div className="h-11 w-11 rounded-full bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-5 chrismed-serif text-xl text-[var(--chrismed-ink)]">{s.title}</h2>
                <p className="mt-2 text-sm text-[var(--chrismed-graphite)] leading-relaxed">{s.body}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-10 rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-6 text-sm leading-6 text-[var(--chrismed-graphite)]">
          {t.footnote}
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Especialidades',
    title: 'Três especialidades, uma avaliação clínica integrada.',
    lead: 'A Dra. Christiane Alencar atua em Gastroenterologia, Hepatologia e Clínica Médica. A consulta é conduzida de forma integrada, sem obrigar o paciente a escolher previamente uma especialidade quando a queixa ainda não está definida.',
    cta1: 'Agendar consulta',
    cta2: 'Falar com a equipe',
    footnote: 'A CHRISMED é uma plataforma multiprofissional em expansão. Outros profissionais só devem aparecer como disponíveis quando estiverem cadastrados, aprovados, ativos e com agenda real publicada no sistema.',
    items: [
      { icon: 'gastro', title: 'Gastroenterologia', body: 'Avaliação clínica de sintomas e condições relacionadas ao aparelho digestivo, com investigação e acompanhamento conforme indicação médica.' },
      { icon: 'hepato', title: 'Hepatologia', body: 'Avaliação e acompanhamento de alterações relacionadas ao fígado e condições hepatológicas, conforme necessidade clínica individual.' },
      { icon: 'clinica', title: 'Clínica Médica', body: 'Visão ampla do paciente adulto, integração de sintomas, exames, comorbidades e definição dos próximos passos do cuidado.' },
    ],
  },
  en: {
    eyebrow: 'Specialties',
    title: 'Three specialties, one integrated clinical assessment.',
    lead: 'Dra. Christiane Alencar practices Gastroenterology, Hepatology and Internal Medicine. The consultation is integrated, so patients do not have to choose a specialty in advance when the clinical complaint is still unclear.',
    cta1: 'Book a consultation',
    cta2: 'Talk to our team',
    footnote: 'CHRISMED is an expanding multi-professional platform. Other professionals should only be shown as available after they are registered, approved, active and have real published availability in the system.',
    items: [
      { icon: 'gastro', title: 'Gastroenterology', body: 'Clinical assessment of symptoms and conditions related to the digestive system, with investigation and follow-up when medically indicated.' },
      { icon: 'hepato', title: 'Hepatology', body: 'Assessment and follow-up of liver-related findings and hepatology conditions according to each patient’s clinical needs.' },
      { icon: 'clinica', title: 'Internal Medicine', body: 'Broad adult clinical care integrating symptoms, test results, comorbidities and the next steps of care.' },
    ],
  },
  es: {
    eyebrow: 'Especialidades',
    title: 'Tres especialidades, una evaluación clínica integrada.',
    lead: 'La Dra. Christiane Alencar actúa en Gastroenterología, Hepatología y Clínica Médica. La consulta es integrada, sin exigir que el paciente elija previamente una especialidad cuando la queja aún no está definida.',
    cta1: 'Agendar consulta',
    cta2: 'Hablar con el equipo',
    footnote: 'CHRISMED es una plataforma multiprofesional en expansión. Otros profesionales solo deben mostrarse como disponibles cuando estén registrados, aprobados, activos y con agenda real publicada en el sistema.',
    items: [
      { icon: 'gastro', title: 'Gastroenterología', body: 'Evaluación clínica de síntomas y condiciones relacionadas con el aparato digestivo, con investigación y seguimiento según indicación médica.' },
      { icon: 'hepato', title: 'Hepatología', body: 'Evaluación y seguimiento de alteraciones relacionadas con el hígado y condiciones hepatológicas según la necesidad clínica individual.' },
      { icon: 'clinica', title: 'Clínica Médica', body: 'Visión amplia del paciente adulto, integración de síntomas, exámenes, comorbilidades y definición de los próximos pasos del cuidado.' },
    ],
  },
} as const;
