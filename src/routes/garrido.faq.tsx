import { createFileRoute } from "@tanstack/react-router";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";
import { FaqAccordion, buildFaqJsonLd } from "@/components/impulsionando";

const CANONICAL = "https://impulsionando.com.br/garrido/faq";

const FAQS = [
  {
    question: "Qual é o custo para anunciar meu imóvel com a Garrido?",
    answer: "Não cobramos taxa de cadastro. A comissão é acordada em contrato de mediação e só é devida quando o imóvel é efetivamente vendido ou alugado.",
  },
  {
    question: "Como funciona a avaliação gratuita?",
    answer: "Fazemos Análise Comparativa de Mercado (ACM), vistoria técnica opcional e entregamos um laudo com faixa recomendada para venda e locação — sem compromisso.",
  },
  {
    question: "Vocês trabalham com financiamento?",
    answer: "Sim. Trabalhamos com CEF, Itaú, Bradesco, Santander, portabilidade e uso de FGTS. O simulador em nosso site mostra o cenário SAC — a taxa final depende de análise de crédito.",
  },
  {
    question: "Como agendo uma visita?",
    answer: "Na página do imóvel, clique em Agendar visita. Um corretor confirma o horário. Você também pode gerenciar visitas na Área do cliente.",
  },
  {
    question: "Vocês administram aluguel para proprietários?",
    answer: "Sim. A Garrido oferece administração completa: divulgação, seleção do inquilino, contrato digital, boleto, cobrança, repasse e prestação de contas mensal.",
  },
  {
    question: "Como é o contrato de locação?",
    answer: "Contrato digital padrão do mercado, com garantia flexível (fiador, seguro-fiança, caução ou título de capitalização). Assinatura pela sua Área do cliente ou presencial.",
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Sim. Sua conta é gerida pelo Core Impulsionando, com autenticação segura, opção de 2FA e política em conformidade com a LGPD.",
  },
  {
    question: "O WhatsApp é canal de negociação?",
    answer: "Não. O WhatsApp da Garrido é canal de suporte e pós-venda. Todas as negociações formais (visitas, propostas, contratos) acontecem nos fluxos internos do site com trilha de auditoria.",
  },
];

export const Route = createFileRoute("/garrido/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — Imobiliária Garrido" },
      { name: "description", content: "Dúvidas sobre compra, venda, locação, temporada, financiamento, avaliação, contratos e área do cliente Garrido." },
      { property: "og:title", content: "Perguntas frequentes — Imobiliária Garrido" },
      { property: "og:description", content: "Compra, venda, locação, temporada, financiamento e contratos." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildFaqJsonLd(FAQS)),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
          { label: "Início", to: "/garrido" },
          { label: "Perguntas frequentes" },
        ])),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Perguntas frequentes" }]} />

      <section className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
          Suporte
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[color:var(--garrido-ink)] mt-2">
          Perguntas frequentes
        </h1>
        <p className="mt-3 text-slate-600">
          As dúvidas mais comuns sobre compra, venda, locação, temporada, financiamento,
          contratos e a área do cliente Garrido.
        </p>

        <div className="mt-8">
          <FaqAccordion faqs={FAQS} />
        </div>
      </section>
    </>
  );
}
