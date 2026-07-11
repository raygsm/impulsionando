import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, FileCheck2, Stethoscope, ClipboardList } from 'lucide-react';

export const Route = createFileRoute('/chrismed/clinica')({
  head: () => ({
    meta: [
      { title: 'Clínica CrisMed — Saúde corporativa e medicina ocupacional' },
      { name: 'description', content: 'Clínica médica para empresas: ASO admissional, periódico, demissional, PCMSO, NR-1, gestão médica e saúde corporativa.' },
      { property: 'og:title', content: 'Clínica CrisMed — Empresas' },
      { property: 'og:description', content: 'Saúde corporativa, medicina ocupacional e gestão médica para sua empresa.' },
    ],
  }),
  component: ClinicaPage,
});

function ClinicaPage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/30">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 hover:bg-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">
            {t.eyebrow}
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">{t.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">
              <Link to="/chrismed/ocupacional">{t.cta1}</Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-900/30 text-emerald-900 hover:bg-emerald-900/5">
              <a href="#oliver">{t.cta2}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-5">
          {t.services.map((s, i) => {
            const Icon = [Building2, FileCheck2, Stethoscope, ClipboardList][i % 4];
            return (
              <article key={s.title} className="rounded-2xl border border-emerald-900/10 bg-white/70 p-7">
                <div className="h-11 w-11 rounded-full bg-emerald-900/5 text-emerald-900 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-xl text-emerald-950">{s.title}</h3>
                <p className="mt-2 text-sm text-emerald-900/75 leading-relaxed">{s.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Clínica CrisMed · Empresas',
    title: 'Saúde corporativa estruturada, com a confiabilidade que sua empresa precisa.',
    lead: 'A Clínica CrisMed atende empresas de todos os portes em medicina ocupacional, gestão médica, exames e documentação regulatória — tudo integrado, com agilidade e conformidade.',
    cta1: 'Solicitar proposta',
    cta2: 'Falar com Oliver',
    services: [
      { title: 'ASO completo', body: 'Admissional, periódico, demissional, retorno ao trabalho e mudança de função — emissão rápida e arquivamento digital.' },
      { title: 'PCMSO e NR-1', body: 'Elaboração, atualização e acompanhamento técnico do PCMSO e da gestão de riscos ocupacionais (NR-1).' },
      { title: 'Medicina ocupacional integrada', body: 'Médico do trabalho, exames laboratoriais e complementares com laboratórios parceiros.' },
      { title: 'Painel empresarial', body: 'Agendamento de colaboradores, relatórios consolidados, histórico médico e dashboards de conformidade.' },
    ],
  },
  en: {
    eyebrow: 'CrisMed Clinic · Enterprise',
    title: 'Structured corporate healthcare your company can rely on.',
    lead: 'CrisMed Clinic serves companies of all sizes in occupational health, medical management, exams and regulatory documentation — integrated, fast and compliant.',
    cta1: 'Request a proposal',
    cta2: 'Talk to Oliver',
    services: [
      { title: 'Full occupational exams', body: 'Pre-hire, periodic, exit, return-to-work and role-change exams — fast issuance and digital archiving.' },
      { title: 'PCMSO & NR-1', body: 'Drafting, updating and technical follow-up of PCMSO and occupational risk management (NR-1).' },
      { title: 'Integrated occupational medicine', body: 'Occupational physician, lab and complementary exams via partner laboratories.' },
      { title: 'Enterprise dashboard', body: 'Employee scheduling, consolidated reports, medical history and compliance dashboards.' },
    ],
  },
  es: {
    eyebrow: 'Clínica CrisMed · Empresas',
    title: 'Salud corporativa estructurada, con la confiabilidad que su empresa necesita.',
    lead: 'La Clínica CrisMed atiende empresas de todos los tamaños en salud ocupacional, gestión médica, exámenes y documentación regulatoria — integrado, ágil y conforme.',
    cta1: 'Solicitar propuesta',
    cta2: 'Hablar con Oliver',
    services: [
      { title: 'ASO completo', body: 'Preocupacional, periódico, egreso, reintegro y cambio de función — emisión rápida y archivo digital.' },
      { title: 'PCMSO y NR-1', body: 'Elaboración, actualización y seguimiento técnico del PCMSO y gestión de riesgos ocupacionales.' },
      { title: 'Medicina ocupacional integrada', body: 'Médico del trabajo, exámenes laboratoriales y complementarios con laboratorios asociados.' },
      { title: 'Panel empresarial', body: 'Agendamiento de colaboradores, informes consolidados, historia médica y tableros de cumplimiento.' },
    ],
  },
} as const;
