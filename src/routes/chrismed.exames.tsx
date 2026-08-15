import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Droplets, HeartPulse, Camera, ClipboardCheck, AlarmClock, FileText } from 'lucide-react';

export const Route = createFileRoute('/chrismed/exames')({
  head: () => ({
    meta: [
      { title: 'Exames e preparo — CHRISMED' },
      { name: 'description', content: 'Orientações CHRISMED sobre solicitação e preparo de exames laboratoriais, cardiológicos e de imagem, conforme indicação médica.' },
      { property: 'og:title', content: 'Exames · CHRISMED' },
      { property: 'og:description', content: 'Orientações de solicitação e preparo de exames conforme avaliação médica.' },
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

      <section className="container py-16 max-w-5xl grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {t.categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon as keyof typeof CATEGORY_ICONS];
          return (
            <article key={c.title} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
              <div className="h-11 w-11 rounded-full bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] flex items-center justify-center">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 chrismed-serif text-lg text-[var(--chrismed-ink)]">{c.title}</h3>
              <p className="mt-2 text-sm text-[var(--chrismed-graphite)] leading-relaxed">{c.body}</p>
            </article>
          );
        })}
      </section>

      <section className="border-y border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)]">
        <div className="container py-14 max-w-5xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--chrismed-mist)]">{t.prepEyebrow}</div>
          <h2 className="chrismed-serif text-3xl text-[var(--chrismed-ink)] mt-2">{t.prepTitle}</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {t.prep.map((p, i) => {
              const Icon = [AlarmClock, ClipboardCheck, FileText][i % 3];
              return (
                <div key={p.title} className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)] p-6">
                  <div className="flex items-center gap-2 text-[var(--chrismed-ink)]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <h3 className="chrismed-serif text-lg">{p.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-[var(--chrismed-graphite)] leading-relaxed">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-5xl">
        <div className="rounded-2xl border border-[var(--chrismed-sand)] bg-[var(--chrismed-bone)] p-7">
          <h3 className="chrismed-serif text-xl text-[var(--chrismed-ink)]">{t.disclaimerTitle}</h3>
          <p className="mt-3 text-sm text-[var(--chrismed-graphite)] leading-relaxed">{t.disclaimerBody}</p>
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Exames',
    title: 'Solicitação e preparo, sempre conforme avaliação médica.',
    lead: 'Quando um exame é clinicamente indicado, a CHRISMED orienta a solicitação e o preparo adequado. A realização, disponibilidade e condições do exame dependem do laboratório ou serviço escolhido para executá-lo.',
    cta1: 'Agendar consulta',
    cta2: 'Solicitar orientação',
    categories: [
      { icon: 'lab', title: 'Laboratoriais', body: 'Exames laboratoriais podem ser solicitados conforme história clínica, exame médico e necessidade individual.' },
      { icon: 'blood', title: 'Coleta', body: 'A possibilidade de coleta convencional ou domiciliar deve ser confirmada diretamente com o serviço responsável pela realização.' },
      { icon: 'cardio', title: 'Cardiológicos', body: 'Exames cardiológicos podem ser indicados conforme avaliação clínica e realizados em serviço habilitado de escolha do paciente.' },
      { icon: 'imaging', title: 'Imagem', body: 'Ultrassonografia, ressonância, tomografia, radiografia e outros métodos dependem de indicação e do serviço executor.' },
    ],
    prepEyebrow: 'Preparo',
    prepTitle: 'Orientações gerais de segurança',
    prep: [
      { title: 'Jejum e hidratação', body: 'Não adote jejum por conta própria. O tempo de jejum e as regras de hidratação variam conforme o exame e devem seguir a orientação específica do serviço executor.' },
      { title: 'Medicações em uso', body: 'Não suspenda medicamentos ou suplementos sem orientação médica. Informe ao profissional de saúde e ao serviço executor tudo o que utiliza.' },
      { title: 'Documentos', body: 'Confirme previamente com o local do exame quais documentos, pedido médico e informações clínicas são necessários.' },
    ],
    disclaimerTitle: 'Importante',
    disclaimerBody: 'As informações desta página são gerais e não substituem as instruções específicas de cada exame. Siga sempre o pedido médico e as orientações do serviço que realizará o procedimento. Em caso de dúvida clínica, fale com a equipe CHRISMED.',
  },
  en: {
    eyebrow: 'Exams',
    title: 'Requests and preparation, always based on medical evaluation.',
    lead: 'When an exam is clinically indicated, CHRISMED provides guidance on the request and appropriate preparation. Availability and conditions depend on the laboratory or service chosen to perform the exam.',
    cta1: 'Book a consultation',
    cta2: 'Request guidance',
    categories: [
      { icon: 'lab', title: 'Laboratory', body: 'Laboratory tests may be requested according to medical history, clinical evaluation and individual need.' },
      { icon: 'blood', title: 'Collection', body: 'Conventional or home collection availability must be confirmed with the service responsible for performing the test.' },
      { icon: 'cardio', title: 'Cardiology', body: 'Cardiology tests may be indicated after clinical evaluation and performed by a qualified service chosen by the patient.' },
      { icon: 'imaging', title: 'Imaging', body: 'Ultrasound, MRI, CT, X-ray and other methods depend on medical indication and the performing service.' },
    ],
    prepEyebrow: 'Preparation',
    prepTitle: 'General safety guidance',
    prep: [
      { title: 'Fasting & hydration', body: 'Do not fast on your own. Fasting time and hydration rules vary by exam and must follow the specific instructions of the performing service.' },
      { title: 'Current medications', body: 'Do not stop medications or supplements without medical guidance. Tell your clinician and the performing service everything you use.' },
      { title: 'Documents', body: 'Confirm in advance which identification, medical request and clinical information the exam provider requires.' },
    ],
    disclaimerTitle: 'Important',
    disclaimerBody: 'This page provides general information and does not replace exam-specific instructions. Always follow the medical request and the guidance of the service performing the procedure. Contact CHRISMED for clinical questions.',
  },
  es: {
    eyebrow: 'Exámenes',
    title: 'Solicitud y preparación, siempre según evaluación médica.',
    lead: 'Cuando un examen está clínicamente indicado, CHRISMED orienta sobre la solicitud y la preparación adecuada. La disponibilidad y las condiciones dependen del laboratorio o servicio elegido para realizarlo.',
    cta1: 'Agendar consulta',
    cta2: 'Solicitar orientación',
    categories: [
      { icon: 'lab', title: 'Laboratorio', body: 'Los exámenes de laboratorio pueden solicitarse según la historia clínica, evaluación médica y necesidad individual.' },
      { icon: 'blood', title: 'Toma', body: 'La disponibilidad de toma convencional o domiciliaria debe confirmarse con el servicio responsable de realizar el examen.' },
      { icon: 'cardio', title: 'Cardiología', body: 'Los exámenes cardiológicos pueden indicarse tras evaluación clínica y realizarse en un servicio habilitado elegido por el paciente.' },
      { icon: 'imaging', title: 'Imagen', body: 'Ecografía, resonancia, tomografía, radiografía y otros métodos dependen de indicación médica y del servicio ejecutor.' },
    ],
    prepEyebrow: 'Preparación',
    prepTitle: 'Orientaciones generales de seguridad',
    prep: [
      { title: 'Ayuno e hidratación', body: 'No haga ayuno por cuenta propia. El tiempo de ayuno y las reglas de hidratación varían según el examen y deben seguir la orientación específica del servicio ejecutor.' },
      { title: 'Medicamentos en uso', body: 'No suspenda medicamentos o suplementos sin orientación médica. Informe todo lo que utiliza al profesional y al servicio ejecutor.' },
      { title: 'Documentos', body: 'Confirme previamente qué documentos, solicitud médica e información clínica exige el lugar del examen.' },
    ],
    disclaimerTitle: 'Importante',
    disclaimerBody: 'La información de esta página es general y no sustituye las instrucciones específicas de cada examen. Siga siempre la solicitud médica y las orientaciones del servicio que realizará el procedimiento. Ante dudas clínicas, contacte a CHRISMED.',
  },
} as const;
