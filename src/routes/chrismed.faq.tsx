import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell, useLang } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FaqAccordion, buildFaqJsonLd } from '@/components/impulsionando';

export const Route = createFileRoute('/chrismed/faq')({
  head: () => {
    const jsonLd = buildFaqJsonLd(COPY.pt.faqs.map((f) => ({ question: f.q, answer: f.a })));
    return {
      meta: [
        { title: 'Perguntas frequentes — CHRISMED' },
        { name: 'description', content: 'Dúvidas comuns sobre teleconsulta, consulta domiciliar, atendimento em Copacabana, pagamento, cancelamento e sigilo — CHRISMED.' },
        { property: 'og:title', content: 'FAQ · CHRISMED' },
        { property: 'og:description', content: 'Respostas para as principais dúvidas sobre atendimento CHRISMED.' },
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
      <section className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
        <div className="container py-20 max-w-5xl">
          <Badge className="bg-[var(--chrismed-bone)] text-[var(--chrismed-ink)] border border-[var(--chrismed-sand)] mb-5 uppercase tracking-[0.18em] text-[10px]">{t.eyebrow}</Badge>
          <h1 className="chrismed-serif text-4xl md:text-6xl text-[var(--chrismed-ink)] leading-[1.05] max-w-3xl">{t.title}</h1>
          <p className="mt-6 text-lg text-[var(--chrismed-graphite)] max-w-2xl">{t.lead}</p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <FaqAccordion faqs={t.faqs.map((f) => ({ question: f.q, answer: f.a }))} />
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild className="bg-[var(--chrismed-ink)] hover:bg-[var(--chrismed-forest)] text-[var(--chrismed-ivory)]">
            <Link to="/chrismed/agendar">{t.ctaBook}</Link>
          </Button>
          <Button asChild variant="outline" className="border-[var(--chrismed-forest)] bg-white text-[var(--chrismed-forest-deep)] hover:bg-[var(--chrismed-forest-mist)]">
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
      { q: 'Como funciona a teleconsulta?', a: 'Você escolhe o horário na agenda, conclui o pagamento quando aplicável e recebe as orientações de acesso pelos canais cadastrados. No horário marcado, a Dra. Christiane realiza a consulta por vídeo, com os recursos digitais disponíveis para o atendimento.' },
      { q: 'A consulta domiciliar cobre qual região?', a: 'A cobertura padrão contempla Zona Sul, Grande Tijuca e Barra, no Rio de Janeiro. Para outras regiões, envie sua solicitação com CEP e endereço para validação de disponibilidade antes da confirmação.' },
      { q: 'Vocês atendem convênio?', a: 'A CHRISMED trabalha com atendimento particular nas modalidades apresentadas no agendamento. Quando aplicável, a equipe orienta sobre a documentação disponível para eventual solicitação de reembolso ao plano de saúde.' },
      { q: 'Como é feito o pagamento?', a: 'O valor, a forma de pagamento e a necessidade de pagamento antecipado são apresentados antes da confirmação. O sistema nunca deve alterar o preço informado durante a jornada.' },
      { q: 'Posso cancelar ou remarcar?', a: 'Cancelamento, remarcação e eventual retorno seguem as condições da modalidade contratada e as informações apresentadas na confirmação. Em caso de dúvida, fale com a equipe CHRISMED antes de alterar o agendamento.' },
      { q: 'Vocês atendem em outros idiomas?', a: 'Sim. A Dra. Christiane atende em português, inglês e espanhol.' },
      { q: 'A CHRISMED atende empresas?', a: 'Sim. A frente de Medicina Ocupacional e saúde corporativa possui jornada própria para empresas, separada do atendimento ambulatorial particular.' },
      { q: 'Como funciona a receita digital?', a: 'Quando clinicamente indicada, a documentação médica pode ser emitida em formato digital conforme os requisitos aplicáveis. As orientações de uso são enviadas ao paciente pelos canais cadastrados.' },
      { q: 'Meus dados estão seguros?', a: 'A CHRISMED aplica controles de acesso, rastreabilidade e práticas de proteção de dados compatíveis com a natureza das informações de saúde. Consulte a página de Privacidade para detalhes.' },
      { q: 'A Dra. Christiane realiza segunda opinião médica?', a: 'A necessidade e o formato de uma avaliação de segunda opinião podem ser informados à equipe antes do agendamento para direcionamento adequado.' },
    ],
  },
  en: {
    eyebrow: 'Frequently asked questions',
    title: 'Everything patients usually ask before booking.',
    lead: 'If your question is not here, reach out via WhatsApp or the contact form.',
    ctaBook: 'Book a consultation',
    ctaContact: 'Talk to our team',
    faqs: [
      { q: 'How does telehealth work?', a: 'Choose an available time, complete payment when applicable and receive access instructions through your registered channels. At the scheduled time, Dra. Christiane conducts the video consultation using the digital resources available for care.' },
      { q: 'What area does the home visit cover?', a: 'Standard coverage includes the South Zone, Greater Tijuca and Barra in Rio de Janeiro. For other areas, send your ZIP code and address so availability can be confirmed before booking.' },
      { q: 'Do you accept health insurance?', a: 'CHRISMED provides private care in the modalities shown during booking. When applicable, the team can explain which documents are available for a possible reimbursement request to your insurer.' },
      { q: 'How is payment handled?', a: 'The price, payment method and any prepayment requirement are shown before confirmation. The system must not change the price presented during the booking journey.' },
      { q: 'Can I cancel or reschedule?', a: 'Cancellation, rescheduling and any return visit follow the conditions of the selected service and the information shown in your confirmation. Contact the CHRISMED team if you need assistance.' },
      { q: 'Do you see patients in other languages?', a: 'Yes. Dra. Christiane provides care in Portuguese, English and Spanish.' },
      { q: 'Does CHRISMED serve companies?', a: 'Yes. Occupational Medicine and corporate health have a dedicated business journey, separate from private ambulatory care.' },
      { q: 'How does the digital prescription work?', a: 'When clinically indicated, medical documents may be issued digitally according to applicable requirements. Usage instructions are sent through the patient’s registered channels.' },
      { q: 'Is my data secure?', a: 'CHRISMED applies access controls, traceability and data-protection practices appropriate for health information. See the Privacy page for details.' },
      { q: 'Does Dra. Christiane provide second opinions?', a: 'You can tell the team that you are seeking a second-opinion evaluation before booking so the request can be directed appropriately.' },
    ],
  },
  es: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Todo lo que los pacientes suelen preguntar antes de agendar.',
    lead: 'Si tu duda no está aquí, contáctanos por WhatsApp o el formulario.',
    ctaBook: 'Agendar consulta',
    ctaContact: 'Hablar con el equipo',
    faqs: [
      { q: '¿Cómo funciona la teleconsulta?', a: 'Elige un horario disponible, completa el pago cuando corresponda y recibe las instrucciones de acceso por los canales registrados. A la hora programada, la Dra. Christiane realiza la consulta por video con los recursos digitales disponibles.' },
      { q: '¿Qué zona cubre la visita domiciliaria?', a: 'La cobertura estándar incluye Zona Sur, Grande Tijuca y Barra, en Río de Janeiro. Para otras zonas, envía CEP y dirección para validar disponibilidad antes de confirmar.' },
      { q: '¿Atienden convenios?', a: 'CHRISMED trabaja con atención particular en las modalidades presentadas al agendar. Cuando corresponda, el equipo puede orientar sobre los documentos disponibles para una posible solicitud de reembolso.' },
      { q: '¿Cómo se paga?', a: 'El valor, la forma de pago y cualquier requisito de pago anticipado se muestran antes de confirmar. El sistema no debe modificar el precio presentado durante la jornada.' },
      { q: '¿Puedo cancelar o reagendar?', a: 'La cancelación, reagendamiento y eventual retorno siguen las condiciones del servicio elegido y la información de la confirmación. Contacta al equipo CHRISMED si necesitas ayuda.' },
      { q: '¿Atienden en otros idiomas?', a: 'Sí. La Dra. Christiane atiende en portugués, inglés y español.' },
      { q: '¿CHRISMED atiende a empresas?', a: 'Sí. Medicina Ocupacional y salud corporativa cuentan con una jornada empresarial específica, separada de la atención ambulatoria particular.' },
      { q: '¿Cómo funciona la receta digital?', a: 'Cuando está clínicamente indicada, la documentación médica puede emitirse en formato digital conforme a los requisitos aplicables. Las orientaciones se envían por los canales registrados.' },
      { q: '¿Mis datos están seguros?', a: 'CHRISMED aplica controles de acceso, trazabilidad y prácticas de protección de datos adecuadas a la información de salud. Consulta la página de Privacidad para más detalles.' },
      { q: '¿La Dra. Christiane realiza segunda opinión?', a: 'Puedes informar al equipo antes de agendar que buscas una evaluación de segunda opinión para que la solicitud sea direccionada adecuadamente.' },
    ],
  },
} as const;
