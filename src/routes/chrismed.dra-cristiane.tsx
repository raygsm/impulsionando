import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Video, Home, Globe2, Award, ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/chrismed/dra-cristiane')({
  head: () => ({
    meta: [
      { title: 'Dra. Cristiane Alencar — Medicina privada, internacional e humana · CrisMed' },
      { name: 'description', content: 'Autoridade médica em atendimento privado, internacional, domiciliar, teleconsulta e presencial em Copacabana. Atendimento em PT · EN · ES.' },
      { property: 'og:title', content: 'Dra. Cristiane Alencar — CrisMed' },
      { property: 'og:description', content: 'Medicina privada de alto padrão com a Dra. Cristiane Alencar.' },
    ],
  }),
  component: DraCristianePage,
});

function DraCristianePage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 hover:bg-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">
            {t.eyebrow}
          </Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">
            {t.title}
          </h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">{t.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">
              <Link to="/chrismed">{t.book}</Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-900/30 text-emerald-900 hover:bg-emerald-900/5">
              <a href="#oliver">{t.oliver}</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Video, k: 'tele' },
            { icon: Home, k: 'home' },
            { icon: Stethoscope, k: 'office' },
          ].map(({ icon: Icon, k }) => {
            const s = t.services[k as keyof typeof t.services];
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
        <div className="container py-16 max-w-5xl grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-amber-700/90">{t.authorityEyebrow}</div>
            <h2 className="font-serif text-3xl md:text-4xl text-emerald-950 mt-3">{t.authorityTitle}</h2>
            <p className="mt-5 text-emerald-900/80 leading-relaxed">{t.authorityBody}</p>
          </div>
          <ul className="space-y-4">
            {t.highlights.map((h) => (
              <li key={h.title} className="flex gap-4 rounded-xl border border-emerald-900/10 bg-white/70 p-5">
                <div className="h-9 w-9 rounded-full bg-emerald-900/5 text-emerald-900 flex items-center justify-center shrink-0">
                  {h.icon === 'globe' ? <Globe2 className="h-4 w-4" /> : h.icon === 'shield' ? <ShieldCheck className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-medium text-emerald-950">{h.title}</div>
                  <div className="text-sm text-emerald-900/70">{h.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Autoridade médica',
    title: 'Dra. Cristiane Alencar — medicina privada, internacional e humana.',
    lead: 'Atendimento clínico de alto padrão para brasileiros e estrangeiros, com consultas em português, inglês e espanhol. Teleconsulta, consulta domiciliar e atendimento presencial em Copacabana.',
    book: 'Agendar consulta',
    oliver: 'Falar com Oliver',
    services: {
      tele: { title: 'Teleconsulta', body: 'Atendimento por vídeo com prescrição digital, prontuário eletrônico e orientação pós-consulta. Prioridade para pacientes em viagem ou rotina executiva.' },
      home: { title: 'Consulta domiciliar', body: 'Atendimento premium na sua residência, hotel ou escritório. Conforto, privacidade e tempo dedicado.' },
      office: { title: 'Presencial em Copacabana', body: 'Consultório discreto, agenda sob horário e equipe disponível antes, durante e após o atendimento.' },
    },
    authorityEyebrow: 'Sobre a médica',
    authorityTitle: 'Anos de prática clínica, milhares de consultas e o cuidado de quem trata cada paciente como único.',
    authorityBody: 'A Dra. Cristiane Alencar atua em medicina privada, com experiência consolidada em acompanhamento de pacientes, atendimento hospitalar, teleconsulta, consulta domiciliar e atendimento presencial. Mantém relação ativa com laboratórios, redes hospitalares e equipes internacionais para garantir continuidade e excelência ao paciente.',
    highlights: [
      { icon: 'globe', title: 'Atendimento internacional', body: 'PT · EN · ES. Suporte a estrangeiros, expatriados, consulados e famílias internacionais.' },
      { icon: 'shield', title: 'Sigilo e conformidade', body: 'Prontuário criptografado, conformidade total com a LGPD e protocolos de privacidade.' },
      { icon: 'award', title: 'Padrão exigente', body: 'Atendimento humanizado para público classe A, executivos e famílias que esperam excelência clínica.' },
    ],
  },
  en: {
    eyebrow: 'Medical authority',
    title: 'Dr. Cristiane Alencar — private, international and humane medicine.',
    lead: 'High-end clinical care for Brazilians and international patients, with consultations in Portuguese, English and Spanish. Telehealth, home visits and in-person care in Copacabana, Rio de Janeiro.',
    book: 'Book a consultation',
    oliver: 'Talk to Oliver',
    services: {
      tele: { title: 'Telehealth', body: 'Video consultations with digital prescription, electronic medical records and post-visit guidance. Designed for travelers and busy executives.' },
      home: { title: 'Home visit', body: 'Premium care at your home, hotel or office — comfort, privacy and dedicated time.' },
      office: { title: 'In-person, Copacabana', body: 'Discreet office, scheduled time slots and a team available before, during and after your appointment.' },
    },
    authorityEyebrow: 'About the doctor',
    authorityTitle: 'Years of clinical practice, thousands of consultations and the care of someone who treats each patient as unique.',
    authorityBody: 'Dr. Cristiane Alencar practices private medicine with consolidated experience in patient follow-up, hospital care, telehealth, home visits and in-person consultations. She maintains active relationships with laboratories, hospital networks and international teams to ensure continuity and excellence.',
    highlights: [
      { icon: 'globe', title: 'International care', body: 'PT · EN · ES. Support for foreigners, expats, consulates and international families.' },
      { icon: 'shield', title: 'Privacy & compliance', body: 'Encrypted records, LGPD compliance and strict privacy protocols.' },
      { icon: 'award', title: 'Exacting standard', body: 'Humanized care for a demanding audience that expects clinical excellence.' },
    ],
  },
  es: {
    eyebrow: 'Autoridad médica',
    title: 'Dra. Cristiane Alencar — medicina privada, internacional y humana.',
    lead: 'Atención clínica de alto nivel para brasileños y extranjeros, con consultas en portugués, inglés y español. Teleconsulta, visita a domicilio y atención presencial en Copacabana.',
    book: 'Agendar consulta',
    oliver: 'Hablar con Oliver',
    services: {
      tele: { title: 'Teleconsulta', body: 'Consulta por video con receta digital, historia clínica electrónica y orientación posconsulta. Prioridad para pacientes en viaje o rutina ejecutiva.' },
      home: { title: 'Visita a domicilio', body: 'Atención premium en su residencia, hotel u oficina. Confort, privacidad y tiempo dedicado.' },
      office: { title: 'Presencial en Copacabana', body: 'Consultorio discreto, agenda con horario y equipo disponible antes, durante y después de la consulta.' },
    },
    authorityEyebrow: 'Sobre la médica',
    authorityTitle: 'Años de práctica clínica, miles de consultas y el cuidado de quien trata a cada paciente como único.',
    authorityBody: 'La Dra. Cristiane Alencar ejerce medicina privada con experiencia consolidada en seguimiento de pacientes, atención hospitalaria, teleconsulta, visita a domicilio y atención presencial. Mantiene relación activa con laboratorios, redes hospitalarias y equipos internacionales para garantizar continuidad y excelencia.',
    highlights: [
      { icon: 'globe', title: 'Atención internacional', body: 'PT · EN · ES. Soporte a extranjeros, expatriados, consulados y familias internacionales.' },
      { icon: 'shield', title: 'Privacidad y cumplimiento', body: 'Historia clínica cifrada, cumplimiento LGPD y protocolos de privacidad.' },
      { icon: 'award', title: 'Estándar exigente', body: 'Atención humanizada para un público exigente que espera excelencia clínica.' },
    ],
  },
} as const;
