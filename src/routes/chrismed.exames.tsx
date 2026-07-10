import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Droplets, HeartPulse, Camera, ClipboardCheck, AlarmClock, FileText } from 'lucide-react';

export const Route = createFileRoute('/chrismed/exames')({
  head: () => ({
    meta: [
      { title: 'Exames e preparo — CrisMed' },
      { name: 'description', content: 'Solicitação, coleta domiciliar e preparo para exames laboratoriais e de imagem via rede parceira CrisMed. Confira orientações antes da coleta.' },
      { property: 'og:title', content: 'Exames · CrisMed' },
      { property: 'og:description', content: 'Exames laboratoriais, imagem e cardiológicos com rede parceira e orientações de preparo.' },
    ],
  }),
  component: ExamesPage,
});

const CATEGORY_ICONS = { lab: FlaskConical, blood: Droplets, cardio: HeartPulse, imaging: Camera } as const;

function ExamesPage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">{t.eyebrow}</Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">{t.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">
              <Link to="/chrismed/agendar">{t.cta1}</Link>
            </Button>
            <Button asChild variant="outline" className="border-emerald-900/30 text-emerald-900 hover:bg-emerald-900/5">
              <Link to="/chrismed/contato">{t.cta2}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {t.categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon as keyof typeof CATEGORY_ICONS];
          return (
            <article key={c.title} className="rounded-2xl border border-emerald-900/10 bg-white/70 p-6">
              <div className="h-11 w-11 rounded-full bg-emerald-900/5 text-emerald-900 flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-lg text-emerald-950">{c.title}</h3>
              <p className="mt-2 text-sm text-emerald-900/75 leading-relaxed">{c.body}</p>
            </article>
          );
        })}
      </section>

      <section className="border-y border-emerald-900/10 bg-[#f3ede0]/40">
        <div className="container py-14 max-w-5xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-amber-700/90">{t.prepEyebrow}</div>
          <h2 className="font-serif text-3xl text-emerald-950 mt-2">{t.prepTitle}</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {t.prep.map((p, i) => {
              const Icon = [AlarmClock, ClipboardCheck, FileText][i % 3];
              return (
                <div key={p.title} className="rounded-2xl border border-emerald-900/10 bg-white p-6">
                  <div className="flex items-center gap-2 text-emerald-950">
                    <Icon className="h-4 w-4" />
                    <h3 className="font-serif text-lg">{p.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-emerald-900/75 leading-relaxed">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-900/5 p-7">
          <h3 className="font-serif text-xl text-emerald-950">{t.disclaimerTitle}</h3>
          <p className="mt-3 text-sm text-emerald-900/80 leading-relaxed">{t.disclaimerBody}</p>
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Exames',
    title: 'Solicitação, coleta e preparo — do consultório ou da sua casa.',
    lead: 'A CrisMed emite as solicitações de exames após avaliação médica e integra rede parceira de laboratórios e centros de imagem. Coleta domiciliar disponível mediante agendamento.',
    cta1: 'Agendar consulta',
    cta2: 'Solicitar orientação',
    categories: [
      { icon: 'lab', title: 'Laboratoriais', body: 'Hemograma, perfil metabólico, hormônios, sorologias, marcadores inflamatórios e mais.' },
      { icon: 'blood', title: 'Coleta domiciliar', body: 'Coleta em residência, hotel ou empresa com equipe de enfermagem parceira, mediante agendamento.' },
      { icon: 'cardio', title: 'Cardiológicos', body: 'ECG, MAPA, Holter, teste ergométrico e ecocardiograma via centros parceiros.' },
      { icon: 'imaging', title: 'Imagem', body: 'Ultrassonografia, ressonância, tomografia e radiografia em centros de referência.' },
    ],
    prepEyebrow: 'Preparo',
    prepTitle: 'Orientações gerais de preparo',
    prep: [
      { title: 'Jejum e hidratação', body: 'A maioria dos exames de sangue exige jejum de 8 a 12 horas. Água pode ser ingerida normalmente, salvo orientação contrária.' },
      { title: 'Medicações em uso', body: 'Não suspenda medicamentos sem orientação. Informe todos os medicamentos e suplementos ao médico e ao laboratório.' },
      { title: 'Documentos', body: 'Leve documento com foto, cartão do convênio (se aplicável) e o pedido médico impresso ou digital.' },
    ],
    disclaimerTitle: 'Aviso',
    disclaimerBody: 'As orientações desta página são de caráter geral. Cada exame pode exigir preparo específico — confira sempre as instruções entregues junto à solicitação médica. Em caso de dúvida, fale com a equipe CrisMed antes da coleta.',
  },
  en: {
    eyebrow: 'Exams',
    title: 'Requests, collection and preparation — from the office or your home.',
    lead: 'CrisMed issues exam requests after medical evaluation and integrates a partner network of laboratories and imaging centers. Home collection is available upon booking.',
    cta1: 'Book a consultation',
    cta2: 'Request guidance',
    categories: [
      { icon: 'lab', title: 'Laboratory', body: 'CBC, metabolic panel, hormones, serology, inflammatory markers and more.' },
      { icon: 'blood', title: 'Home collection', body: 'Collection at home, hotel or workplace by a partner nursing team, upon appointment.' },
      { icon: 'cardio', title: 'Cardiology', body: 'ECG, ABPM, Holter, stress test and echocardiogram via partner centers.' },
      { icon: 'imaging', title: 'Imaging', body: 'Ultrasound, MRI, CT and X-ray in reference centers.' },
    ],
    prepEyebrow: 'Preparation',
    prepTitle: 'General preparation guidelines',
    prep: [
      { title: 'Fasting & hydration', body: 'Most blood tests require 8–12 hours of fasting. Water is usually allowed unless advised otherwise.' },
      { title: 'Current medications', body: 'Do not stop medications without guidance. Inform your doctor and the lab about all medications and supplements.' },
      { title: 'Documents', body: 'Bring a photo ID, insurance card (if applicable) and the printed or digital medical request.' },
    ],
    disclaimerTitle: 'Notice',
    disclaimerBody: 'The guidance on this page is general. Each exam may require specific preparation — always follow the instructions provided with the medical request. In case of doubt, contact the CrisMed team before collection.',
  },
  es: {
    eyebrow: 'Exámenes',
    title: 'Solicitud, toma y preparación — desde el consultorio o su casa.',
    lead: 'CrisMed emite las solicitudes de exámenes tras evaluación médica e integra una red asociada de laboratorios y centros de imagen. Toma domiciliaria disponible con agenda.',
    cta1: 'Agendar consulta',
    cta2: 'Solicitar orientación',
    categories: [
      { icon: 'lab', title: 'Laboratorio', body: 'Hemograma, perfil metabólico, hormonas, serologías, marcadores inflamatorios y más.' },
      { icon: 'blood', title: 'Toma domiciliaria', body: 'Toma en domicilio, hotel u oficina por equipo de enfermería asociado, con cita.' },
      { icon: 'cardio', title: 'Cardiología', body: 'ECG, MAPA, Holter, ergometría y ecocardiograma en centros asociados.' },
      { icon: 'imaging', title: 'Imagen', body: 'Ecografía, resonancia, tomografía y radiografía en centros de referencia.' },
    ],
    prepEyebrow: 'Preparación',
    prepTitle: 'Orientaciones generales',
    prep: [
      { title: 'Ayuno e hidratación', body: 'La mayoría de exámenes de sangre requiere 8–12 h de ayuno. El agua suele estar permitida, salvo indicación contraria.' },
      { title: 'Medicamentos en uso', body: 'No suspenda medicamentos sin orientación. Informe todos los medicamentos y suplementos.' },
      { title: 'Documentos', body: 'Lleve documento con foto, tarjeta del seguro (si aplica) y la solicitud médica impresa o digital.' },
    ],
    disclaimerTitle: 'Aviso',
    disclaimerBody: 'Las orientaciones son generales. Cada examen puede requerir preparación específica — siga siempre las instrucciones entregadas con la solicitud médica. Ante dudas, contacte al equipo CrisMed antes de la toma.',
  },
} as const;
