import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, ShieldAlert, Globe2, Languages } from 'lucide-react';

export const Route = createFileRoute('/chrismed/internacional')({
  head: () => ({
    meta: [
      { title: 'International medical care · CrisMed · Dr. Cristiane Alencar' },
      { name: 'description', content: 'Medical assistance for foreigners, expats, consulates and travelers in Brazil. Telehealth, home visit and emergency support in PT · EN · ES.' },
      { property: 'og:title', content: 'CrisMed — International medical care' },
      { property: 'og:description', content: 'Medical assistance in PT · EN · ES — telehealth, home visit, emergency GMS support.' },
    ],
  }),
  component: InternacionalPage,
});

function InternacionalPage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 hover:bg-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">
            {t.eyebrow}
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">{t.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">
              <Link to="/chrismed">{t.book}</Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-900/30 text-emerald-900 hover:bg-emerald-900/5">
              <a href="#oliver">{t.assist}</a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-2 text-xs text-emerald-900/70">
            <span className="rounded-full border border-emerald-900/15 px-3 py-1">🇺🇸 I need medical assistance</span>
            <span className="rounded-full border border-emerald-900/15 px-3 py-1">🇪🇸 Necesito atención médica</span>
            <span className="rounded-full border border-emerald-900/15 px-3 py-1">🇧🇷 Atendimento agora</span>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { icon: Plane, k: 'travelers' },
            { icon: ShieldAlert, k: 'gms' },
            { icon: Globe2, k: 'consulates' },
            { icon: Languages, k: 'languages' },
          ].map(({ icon: Icon, k }) => {
            const s = t.cards[k as keyof typeof t.cards];
            return (
              <article key={k} className="rounded-2xl border border-emerald-900/10 bg-white/70 p-7">
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

      <section className="border-y border-emerald-900/10 bg-[#f3ede0]/40">
        <div className="container py-14 max-w-5xl">
          <h2 className="font-serif text-3xl text-emerald-950">{t.gmsTitle}</h2>
          <p className="mt-4 text-emerald-900/80 max-w-3xl leading-relaxed">{t.gmsBody}</p>
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Atendimento internacional · GMS',
    title: 'Atendimento médico internacional para estrangeiros, consulados e pacientes em trânsito no Brasil.',
    lead: 'A Dra. Cristiane Alencar atende em português, inglês e espanhol — com suporte a emergências, teleconsulta global, consulta domiciliar e estrutura preparada para seguradoras e redes de assistência internacional.',
    book: 'Agendar consulta',
    assist: 'I need medical assistance',
    cards: {
      travelers: { title: 'Turistas e executivos', body: 'Atendimento ágil para quem precisa de avaliação médica durante a estadia no Brasil, com confidencialidade e relatórios em inglês.' },
      gms: { title: 'GMS · Emergências', body: 'Suporte médico internacional emergencial, triagem rápida e encaminhamento para redes hospitalares parceiras.' },
      consulates: { title: 'Consulados e seguradoras', body: 'Estrutura para cadastro junto a consulados, seguradoras e redes globais de assistência médica.' },
      languages: { title: 'PT · EN · ES', body: 'Consultas conduzidas integralmente no idioma do paciente — sem intérprete intermediário.' },
    },
    gmsTitle: 'Como funciona o GMS na CrisMed',
    gmsBody: 'No GMS o foco é emergência médica e suporte internacional rápido. Fora desse contexto, a Dra. Cristiane também realiza consultas normais para brasileiros e estrangeiros — teleconsulta, domiciliar ou presencial — conforme disponibilidade. Estrangeiros que falam inglês ou espanhol podem ser atendidos em qualquer modalidade.',
  },
  en: {
    eyebrow: 'International care · GMS',
    title: 'International medical care for foreigners, consulates and travelers in Brazil.',
    lead: 'Dr. Cristiane Alencar provides care in Portuguese, English and Spanish — with emergency support, global telehealth, home visits and infrastructure ready for insurers and international assistance networks.',
    book: 'Book a consultation',
    assist: 'I need medical assistance',
    cards: {
      travelers: { title: 'Tourists & executives', body: 'Fast medical assessments during your stay in Brazil — confidential, with reports in English when needed.' },
      gms: { title: 'GMS · Emergencies', body: 'International medical emergency support, fast triage and referral to partner hospital networks.' },
      consulates: { title: 'Consulates & insurers', body: 'Ready for registration with consulates, insurers and global medical assistance networks.' },
      languages: { title: 'PT · EN · ES', body: 'Consultations conducted entirely in the patient’s language — no third-party interpreter.' },
    },
    gmsTitle: 'How GMS works at CrisMed',
    gmsBody: 'GMS focuses on medical emergencies and fast international support. Outside that context, Dr. Cristiane also provides regular consultations for Brazilians and foreigners — telehealth, home visit or in-person — subject to availability. English- or Spanish-speaking patients can be seen in any modality.',
  },
  es: {
    eyebrow: 'Atención internacional · GMS',
    title: 'Atención médica internacional para extranjeros, consulados y pacientes en tránsito en Brasil.',
    lead: 'La Dra. Cristiane Alencar atiende en portugués, inglés y español — con soporte de emergencias, teleconsulta global, visita a domicilio y estructura preparada para aseguradoras y redes internacionales.',
    book: 'Agendar consulta',
    assist: 'Necesito atención médica',
    cards: {
      travelers: { title: 'Turistas y ejecutivos', body: 'Evaluación médica rápida durante su estadía en Brasil, con confidencialidad e informes en inglés cuando es necesario.' },
      gms: { title: 'GMS · Emergencias', body: 'Soporte médico internacional de emergencia, triaje rápido y derivación a redes hospitalarias asociadas.' },
      consulates: { title: 'Consulados y aseguradoras', body: 'Estructura lista para registro ante consulados, aseguradoras y redes globales de asistencia médica.' },
      languages: { title: 'PT · EN · ES', body: 'Consultas conducidas íntegramente en el idioma del paciente — sin intérprete intermediario.' },
    },
    gmsTitle: 'Cómo funciona el GMS en CrisMed',
    gmsBody: 'En el GMS el foco es la emergencia médica y el soporte internacional rápido. Fuera de ese contexto, la Dra. Cristiane también realiza consultas regulares para brasileños y extranjeros — teleconsulta, domiciliaria o presencial — según disponibilidad. Pacientes que hablan inglés o español pueden ser atendidos en cualquier modalidad.',
  },
} as const;
