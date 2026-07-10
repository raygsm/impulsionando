import { createFileRoute, Link } from "@tanstack/react-router";
import { MarocasShell } from "@/components/marocas/MarocasShell";

const CANONICAL = "/marocas/faq";

const FAQ: { cat: string; q: string; a: string }[] = [
  { cat: "Anfitrião", q: "Como funciona a gestão do meu imóvel?", a: "Você cadastra o imóvel, fazemos diagnóstico gratuito e apresentamos plano + precificação. Depois do onboarding (fotos, kit de boas-vindas, comunicação automatizada), a operação roda no piloto automático." },
  { cat: "Anfitrião", q: "Preciso de contrato de fidelidade?", a: "Não. Contratos mensais renováveis. Cancelamento com 30 dias de aviso." },
  { cat: "Anfitrião", q: "Como funciona o repasse financeiro?", a: "Mensal, com demonstrativo detalhado: receita, taxas, custos por serviço executado e valor líquido a receber." },
  { cat: "Anfitrião", q: "Vocês integram com Airbnb e Booking?", a: "Sim, por iCal ou API (dependendo do portal). A agenda unifica todas as reservas em um único calendário." },
  { cat: "Hóspede", q: "Como recebo a senha do apartamento?", a: "Enviamos por WhatsApp e e-mail 48h antes do check-in, junto com endereço detalhado, regras da casa e dicas do bairro." },
  { cat: "Hóspede", q: "Preciso de manutenção durante a estadia. E agora?", a: "Fale com o Maroquito no site ou WhatsApp de suporte. Acionamos um prestador homologado e retornamos com prazo em minutos." },
  { cat: "Hóspede", q: "Posso pedir late check-out?", a: "Sim, sujeito à disponibilidade e política do imóvel. Solicite pelo Maroquito com pelo menos 24h de antecedência." },
  { cat: "Hóspede", q: "Vocês criam roteiros personalizados?", a: "Sim. Com base no perfil informado no cadastro (família, casal, trabalho, praia, gastronomia, vida noturna), sugerimos roteiros econômicos ou premium." },
  { cat: "Prestador", q: "Como me cadastrar como prestador?", a: "Preencha o formulário em /marocas/prestadores. Homologamos dados, especialidade, região atendida e disponibilidade." },
  { cat: "Prestador", q: "Como funciona minha agenda?", a: "Você recebe convites de serviço pela plataforma. Se não puder atender, o serviço volta à fila e outro profissional pode assumir." },
  { cat: "Prestador", q: "Como recebo pelos serviços?", a: "Mensal, com fechamento no dia 5 e pagamento até dia 10 do mês seguinte via PIX." },
  { cat: "Operação", q: "O que está incluso na limpeza?", a: "Limpeza completa, troca de enxoval, reposição de amenities, café, água e checklist fotográfico antes e depois." },
  { cat: "Operação", q: "Como funciona a substituição de prestador?", a: "Se um prestador cancela, o sistema devolve o serviço à fila e busca substituto homologado automaticamente." },
];

const CATEGORIAS = Array.from(new Set(FAQ.map((f) => f.cat)));

export const Route = createFileRoute("/marocas/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Marocas gestão de locação por temporada" },
      { name: "description", content: "Perguntas frequentes sobre gestão de imóveis, hóspedes, prestadores e operação da Marocas." },
      { property: "og:title", content: "FAQ Marocas" },
      { property: "og:description", content: "Respostas rápidas para anfitriões, hóspedes e prestadores." },
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
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "FAQ" }]}>
      <section className="container mx-auto px-4 md:px-6 py-16 text-center max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dúvidas frequentes</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-3">Respostas rápidas</h1>
        <p className="mt-4 text-muted-foreground">
          Não encontrou o que procurava? Fale com o{" "}
          <Link to="/marocas/contato" className="text-primary underline">time Marocas</Link>.
        </p>
      </section>

      {CATEGORIAS.map((cat) => (
        <section key={cat} className="container mx-auto px-4 md:px-6 pb-10 max-w-3xl">
          <h2 className="text-xl font-bold text-primary mb-4">{cat}</h2>
          <div className="space-y-2">
            {FAQ.filter((f) => f.cat === cat).map((f) => (
              <details key={f.q} className="group rounded-lg border bg-card p-4">
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </MarocasShell>
  );
}
