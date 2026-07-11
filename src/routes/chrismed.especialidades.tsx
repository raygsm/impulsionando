import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HeartPulse, Stethoscope, Baby, Brain, Activity, Users, Pill, ShieldCheck,
  Syringe, ClipboardList,
} from 'lucide-react';

export const Route = createFileRoute('/chrismed/especialidades')({
  head: () => ({
    meta: [
      { title: 'Especialidades clínicas — CrisMed' },
      { name: 'description', content: 'Clínica médica, cardiologia, medicina interna, geriatria, pediatria de acompanhamento, saúde da mulher, medicina do viajante e mais — na rede curada CrisMed.' },
      { property: 'og:title', content: 'Especialidades · CrisMed' },
      { property: 'og:description', content: 'Rede médica curada em torno da Dra. Cristiane Alencar.' },
    ],
  }),
  component: EspecialidadesPage,
});

const ICONS = { heart: HeartPulse, stetho: Stethoscope, baby: Baby, brain: Brain, activity: Activity, users: Users, pill: Pill, shield: ShieldCheck, syringe: Syringe, clip: ClipboardList } as const;

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
            <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-champagne-deep)] text-[var(--chrismed-ivory)]">
              <Link to="/chrismed/agendar">{t.cta1}</Link>
            </Button>
            <Button asChild variant="outline" className="border-[var(--chrismed-sand)] text-[var(--chrismed-ink)] hover:bg-[var(--chrismed-bone)]">
              <Link to="/chrismed/contato">{t.cta2}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.items.map((s) => {
            const Icon = ICONS[s.icon as keyof typeof ICONS];
            return (
              <article key={s.title} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-7">
                <div className="h-11 w-11 rounded-full bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 chrismed-serif text-xl text-[var(--chrismed-ink)]">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--chrismed-graphite)] leading-relaxed">{s.body}</p>
              </article>
            );
          })}
        </div>
        <p className="mt-10 text-sm text-[var(--chrismed-graphite)] max-w-2xl">{t.footnote}</p>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Especialidades',
    title: 'Uma rede curada de especialidades ao redor da Dra. Cristiane Alencar.',
    lead: 'A CrisMed integra atendimento clínico geral e especialistas parceiros com o mesmo padrão de sigilo, prontuário eletrônico compartilhado e continuidade de cuidado.',
    cta1: 'Agendar consulta',
    cta2: 'Falar com a equipe',
    footnote: 'Especialistas atendem sob avaliação inicial ou encaminhamento da Dra. Cristiane, garantindo continuidade clínica. Consulte disponibilidade e modalidades no agendamento.',
    items: [
      { icon: 'stetho', title: 'Clínica médica', body: 'Avaliação geral, acompanhamento clínico, interpretação de exames e conduta terapêutica integral.' },
      { icon: 'heart', title: 'Cardiologia', body: 'Avaliação cardiovascular, check-ups executivos, acompanhamento de hipertensão e risco cardiovascular.' },
      { icon: 'activity', title: 'Medicina interna', body: 'Diagnóstico complexo, comorbidades múltiplas e coordenação entre especialistas.' },
      { icon: 'users', title: 'Geriatria', body: 'Acompanhamento longitudinal de pacientes idosos, polifarmácia e cuidado domiciliar.' },
      { icon: 'baby', title: 'Pediatria de acompanhamento', body: 'Suporte pediátrico integrado a famílias — puericultura, avaliação clínica e orientação.' },
      { icon: 'shield', title: 'Saúde da mulher', body: 'Cuidado clínico ginecológico integrado, preventivo e acompanhamento hormonal.' },
      { icon: 'syringe', title: 'Medicina do viajante', body: 'Consulta pré-viagem, imunização recomendada, prescrição preventiva e relatórios em inglês.' },
      { icon: 'brain', title: 'Saúde mental integrada', body: 'Referência a psiquiatria e psicologia parceiras, com acompanhamento clínico coordenado.' },
      { icon: 'pill', title: 'Renovação de receitas', body: 'Reavaliação de tratamentos crônicos e prescrição digital com validade nacional.' },
      { icon: 'clip', title: 'Segunda opinião médica', body: 'Revisão criteriosa de diagnósticos e condutas, com relatório formal.' },
    ],
  },
  en: {
    eyebrow: 'Specialties',
    title: 'A curated network of specialists built around Dr. Cristiane Alencar.',
    lead: 'CrisMed brings together general practice and partner specialists under the same standard of privacy, shared electronic records and continuity of care.',
    cta1: 'Book a consultation',
    cta2: 'Talk to our team',
    footnote: 'Specialists are seen upon initial assessment or referral by Dr. Cristiane to ensure clinical continuity. Check availability and modalities when booking.',
    items: [
      { icon: 'stetho', title: 'General practice', body: 'Comprehensive evaluation, follow-up, exam interpretation and integral therapeutic conduct.' },
      { icon: 'heart', title: 'Cardiology', body: 'Cardiovascular assessment, executive check-ups, hypertension and cardiovascular risk follow-up.' },
      { icon: 'activity', title: 'Internal medicine', body: 'Complex diagnosis, multiple comorbidities and coordination across specialists.' },
      { icon: 'users', title: 'Geriatrics', body: 'Longitudinal care of elderly patients, polypharmacy review and home visits.' },
      { icon: 'baby', title: 'Pediatric follow-up', body: 'Pediatric support integrated with families — well-baby, clinical evaluation and guidance.' },
      { icon: 'shield', title: 'Women’s health', body: 'Integrated gynecological clinical care, prevention and hormonal follow-up.' },
      { icon: 'syringe', title: 'Travel medicine', body: 'Pre-travel consultation, recommended immunizations, preventive prescriptions and reports in English.' },
      { icon: 'brain', title: 'Integrated mental health', body: 'Referral to partner psychiatry and psychology teams with coordinated clinical follow-up.' },
      { icon: 'pill', title: 'Prescription renewal', body: 'Re-evaluation of chronic treatments and digital prescriptions valid nationwide.' },
      { icon: 'clip', title: 'Second medical opinion', body: 'Rigorous review of diagnoses and management, with a formal report.' },
    ],
  },
  es: {
    eyebrow: 'Especialidades',
    title: 'Una red curada de especialidades alrededor de la Dra. Cristiane Alencar.',
    lead: 'CrisMed integra atención clínica general y especialistas asociados con el mismo estándar de privacidad, historia clínica electrónica compartida y continuidad del cuidado.',
    cta1: 'Agendar consulta',
    cta2: 'Hablar con el equipo',
    footnote: 'Los especialistas atienden tras evaluación inicial o derivación de la Dra. Cristiane, garantizando continuidad clínica. Consulte disponibilidad y modalidades al agendar.',
    items: [
      { icon: 'stetho', title: 'Clínica médica', body: 'Evaluación general, seguimiento, interpretación de exámenes y conducta terapéutica integral.' },
      { icon: 'heart', title: 'Cardiología', body: 'Evaluación cardiovascular, chequeos ejecutivos, seguimiento de hipertensión y riesgo cardiovascular.' },
      { icon: 'activity', title: 'Medicina interna', body: 'Diagnóstico complejo, comorbilidades múltiples y coordinación entre especialistas.' },
      { icon: 'users', title: 'Geriatría', body: 'Seguimiento longitudinal de pacientes mayores, polifarmacia y cuidado domiciliario.' },
      { icon: 'baby', title: 'Pediatría de seguimiento', body: 'Apoyo pediátrico integrado a las familias — puericultura, evaluación clínica y orientación.' },
      { icon: 'shield', title: 'Salud de la mujer', body: 'Cuidado clínico ginecológico integrado, prevención y seguimiento hormonal.' },
      { icon: 'syringe', title: 'Medicina del viajero', body: 'Consulta previa al viaje, inmunización recomendada, prescripciones preventivas e informes en inglés.' },
      { icon: 'brain', title: 'Salud mental integrada', body: 'Derivación a psiquiatría y psicología asociadas, con seguimiento clínico coordinado.' },
      { icon: 'pill', title: 'Renovación de recetas', body: 'Reevaluación de tratamientos crónicos y prescripción digital con validez nacional.' },
      { icon: 'clip', title: 'Segunda opinión médica', body: 'Revisión rigurosa de diagnósticos y conducta, con informe formal.' },
    ],
  },
} as const;
