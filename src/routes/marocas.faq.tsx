import { createFileRoute } from "@tanstack/react-router";
import { MarocasShell } from "@/components/marocas/MarocasShell";

const CANONICAL = "/marocas/faq";

const FAQ: { q: string; a: string }[] = [
  { q: "Como faço um pedido?", a: "Acesse o cardápio, escolha os itens, personalize adicionais, revise no carrinho e finalize. Você recebe um código de rastreio para acompanhar." },
  { q: "Qual o tempo médio de entrega?", a: "35 a 45 minutos para bairros da Zona Sul. O tempo estimado aparece no checkout, calculado por bairro." },
  { q: "Quais formas de pagamento vocês aceitam?", a: "PIX (aprovação em segundos), cartão de crédito/débito e pagamento presencial na retirada ou na entrega." },
  { q: "Como reservo uma mesa?", a: "Vá em Reservas, escolha data, horário e número de pessoas. A confirmação chega em minutos pelo WhatsApp." },
  { q: "Posso remarcar ou cancelar minha reserva?", a: "Sim, sem taxa, até 2 horas antes do horário reservado. Basta usar o link enviado na confirmação." },
  { q: "Vocês têm opções vegetarianas e veganas?", a: "Sim. Filtre o cardápio pelas tags 'vegetariano' e 'vegano'." },
  { q: "O WhatsApp aceita pedidos?", a: "Não. WhatsApp é somente para SAC e pós-venda. Pedidos são feitos pelo cardápio para garantir preço, tempo e rastreio corretos." },
  { q: "Como vocês tratam dados pessoais?", a: "Seguimos a LGPD. Nenhum dado de cartão é armazenado. Você pode solicitar exclusão do cadastro a qualquer momento." },
];

export const Route = createFileRoute("/marocas/faq")({
  head: () => ({
    meta: [
      { title: "Dúvidas frequentes — Marocas" },
      { name: "description", content: "Como pedir, reservar, pagar e rastrear na Marocas." },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Dúvidas frequentes" }]}>
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold">Dúvidas frequentes</h1>
        <p className="text-muted-foreground mt-2">Respostas rápidas para pedidos, reservas e pagamento.</p>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-xl border p-4 group">
              <summary className="font-semibold cursor-pointer flex items-center justify-between gap-3">
                {f.q}
                <span className="text-muted-foreground group-open:rotate-180 transition">▾</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </MarocasShell>
  );
}
