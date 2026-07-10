import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FaqAccordion, buildFaqJsonLd } from '@/components/impulsionando';

export const Route = createFileRoute('/chrismed/faq')({
  head: () => {
    const jsonLd = buildFaqJsonLd(COPY.pt.faqs.map((f) => ({ q: f.q, a: f.a })));
    return {
      meta: [
        { title: 'Perguntas frequentes — CrisMed' },
        { name: 'description', content: 'Dúvidas comuns sobre teleconsulta, consulta domiciliar, atendimento em Copacabana, pagamento, cancelamento e sigilo — CrisMed.' },
        { property: 'og:title', content: 'FAQ · CrisMed' },
        { property: 'og:description', content: 'Respostas para as principais dúvidas sobre atendimento CrisMed.' },
      ],
      scripts: [{ type: 'application/ld+json', children: JSON.stringify(jsonLd) }],
    };
  },
  component: FaqPage,
});

function FaqPage() {
  const lang = useLang();
  const t = COPY[lang];
  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-5 uppercase tracking-[0.18em] text-[10px]">{t.eyebrow}</Badge>
          <h1 className="font-serif text-4xl md:text-6xl text-emerald-950 leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-emerald-900/75 max-w-2xl">{t.lead}</p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <FaqAccordion faqs={t.faqs.map((f, i) => ({ id: `faq-${i}`, question: f.q, answer: f.a }))} />
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">
            <Link to="/chrismed/agendar">{t.ctaBook}</Link>
          </Button>
          <Button asChild variant="outline" className="border-emerald-900/30 text-emerald-900 hover:bg-emerald-900/5">
            <Link to="/chrismed/contato">{t.ctaContact}</Link>
          </Button>
        </div>
      </section>
    </ChrismedShell>
  );
}

const COPY = {
  pt: {
    eyebrow: 'Perguntas frequentes',
    title: 'Tudo o que costumam perguntar antes da consulta.',
    lead: 'Se sua dúvida não estiver aqui, fale com a equipe pelo WhatsApp ou pelo formulário de contato.',
    ctaBook: 'Agendar consulta',
    ctaContact: 'Falar com a equipe',
    faqs: [
      { q: 'Como funciona a teleconsulta?', a: 'Você escolhe o horário na agenda, faz o pagamento via PIX/cartão pelo Mercado Pago e recebe o link da consulta por e-mail e WhatsApp. No horário marcado é só acessar o link — a Dra. Cristiane realiza a consulta por vídeo, com prescrição digital e prontuário eletrônico.' },
      { q: 'A consulta domiciliar cobre qual região?', a: 'A cobertura padrão é Zona Sul e Centro do Rio de Janeiro. Para outras regiões e cidades, envie sua solicitação com CEP e endereço — validamos a disponibilidade antes de confirmar o horário.' },
      { q: 'Vocês atendem convênio?', a: 'A CrisMed é uma clínica particular, com atendimento privado. Emitimos recibo com CID e código TUSS quando aplicável, para que você possa solicitar reembolso ao seu convênio.' },
      { q: 'Como é feito o pagamento?', a: 'Todas as modalidades exigem pagamento no ato do agendamento, via PIX ou cartão pelo Mercado Pago. O horário fica bloqueado apenas após a aprovação do pagamento.' },
      { q: 'Posso cancelar ou remarcar?', a: 'Cancelamentos com mais de 24h de antecedência têm reembolso integral. Remarcações podem ser feitas pelo WhatsApp, respeitando a disponibilidade da agenda.' },
      { q: 'Vocês atendem em outros idiomas?', a: 'Sim. A Dra. Cristiane atende integralmente em português, inglês e espanhol — sem intérprete intermediário.' },
      { q: 'A CrisMed atende empresas?', a: 'Sim. Oferecemos ASO admissional, periódico, demissional, PCMSO, NR-1 e gestão médica corporativa. Solicite uma proposta pela página Empresa.' },
      { q: 'Como funciona a receita digital?', a: 'A prescrição é emitida em formato digital assinado, com validade nacional. Você recebe por e-mail e pode apresentar em qualquer farmácia do Brasil.' },
      { q: 'Meus dados estão seguros?', a: 'Sim. Utilizamos prontuário eletrônico criptografado, com controle de acesso e conformidade total com a LGPD. Consulte a página de Privacidade para detalhes.' },
      { q: 'A Dra. Cristiane realiza segunda opinião médica?', a: 'Sim. Você pode agendar uma consulta específica para revisão de diagnóstico e condutas, com emissão de relatório formal ao final.' },
    ],
  },
  en: {
    eyebrow: 'Frequently asked questions',
    title: 'Everything patients usually ask before booking.',
    lead: 'If your question is not here, reach out via WhatsApp or the contact form.',
    ctaBook: 'Book a consultation',
    ctaContact: 'Talk to our team',
    faqs: [
      { q: 'How does telehealth work?', a: 'You pick a time slot, pay via PIX/card through Mercado Pago and receive the meeting link by email and WhatsApp. At the scheduled time, just open the link — Dr. Cristiane runs the video consultation with digital prescription and electronic records.' },
      { q: 'What area does the home visit cover?', a: 'Standard coverage is South Zone and Center of Rio de Janeiro. For other areas, send your request with ZIP and address — we confirm availability before booking.' },
      { q: 'Do you accept health insurance?', a: 'CrisMed is a private clinic. We issue receipts with CID and TUSS codes when applicable so you can request reimbursement from your insurer.' },
      { q: 'How is payment handled?', a: 'All modalities require payment at booking, via PIX or card through Mercado Pago. The slot is locked only after payment approval.' },
      { q: 'Can I cancel or reschedule?', a: 'Cancellations more than 24h in advance get a full refund. Rescheduling can be arranged via WhatsApp, subject to availability.' },
      { q: 'Do you see patients in other languages?', a: 'Yes. Dr. Cristiane runs consultations entirely in Portuguese, English and Spanish — no third-party interpreter.' },
      { q: 'Does CrisMed serve companies?', a: 'Yes. We offer occupational exams (admissional, periodic, exit), PCMSO, NR-1 and corporate medical management. Request a proposal via the Business page.' },
      { q: 'How does the digital prescription work?', a: 'The prescription is issued in signed digital format, valid nationwide. You receive it by email and can present it at any Brazilian pharmacy.' },
      { q: 'Is my data secure?', a: 'Yes. We use encrypted electronic records with access control, fully compliant with Brazilian LGPD. See our Privacy page for details.' },
      { q: 'Does Dr. Cristiane provide second opinions?', a: 'Yes. You can book a specific consultation to review diagnosis and management, with a formal report at the end.' },
    ],
  },
  es: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Todo lo que los pacientes suelen preguntar antes de agendar.',
    lead: 'Si tu duda no está aquí, contáctanos por WhatsApp o el formulario.',
    ctaBook: 'Agendar consulta',
    ctaContact: 'Hablar con el equipo',
    faqs: [
      { q: '¿Cómo funciona la teleconsulta?', a: 'Elige el horario, paga vía PIX/tarjeta por Mercado Pago y recibe el enlace por email y WhatsApp. En el horario, solo abre el enlace — la Dra. Cristiane realiza la consulta con receta digital e historia clínica electrónica.' },
      { q: '¿Qué zona cubre la visita domiciliaria?', a: 'La cobertura estándar es Zona Sur y Centro de Río de Janeiro. Para otras zonas, envía la solicitud con CEP y dirección — validamos la disponibilidad antes de confirmar.' },
      { q: '¿Atienden convenios?', a: 'CrisMed es una clínica particular. Emitimos recibo con códigos CID y TUSS cuando aplica, para solicitar reembolso a su seguro.' },
      { q: '¿Cómo se paga?', a: 'Todas las modalidades requieren pago al agendar, vía PIX o tarjeta por Mercado Pago. El horario se bloquea solo tras aprobación.' },
      { q: '¿Puedo cancelar o reagendar?', a: 'Cancelaciones con más de 24 h de antelación tienen reembolso íntegro. Reagendar por WhatsApp, según disponibilidad.' },
      { q: '¿Atienden en otros idiomas?', a: 'Sí. La Dra. Cristiane atiende íntegramente en portugués, inglés y español — sin intérprete intermediario.' },
      { q: '¿CrisMed atiende a empresas?', a: 'Sí. Ofrecemos exámenes ocupacionales, PCMSO, NR-1 y gestión médica corporativa. Solicite una propuesta en Empresa.' },
      { q: '¿Cómo funciona la receta digital?', a: 'La prescripción es digital firmada, con validez nacional. La recibe por email y la presenta en cualquier farmacia de Brasil.' },
      { q: '¿Mis datos están seguros?', a: 'Sí. Utilizamos historia clínica electrónica cifrada, con control de acceso y cumplimiento LGPD. Consulte la página de Privacidad.' },
      { q: '¿La Dra. Cristiane realiza segunda opinión?', a: 'Sí. Puede agendar una consulta específica para revisión, con informe formal al final.' },
    ],
  },
} as const;
