import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ArrowRight } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { marocasWhatsAppUrl } from "@/components/marocas/marocasContent";

const CANONICAL = "https://impulsionando.com.br/marocas/faq";

type Categoria = "Pedidos" | "Delivery" | "Reservas" | "Eventos" | "Institucional";

const FAQ: { q: string; a: string; c: Categoria }[] = [
  {
    c: "Pedidos",
    q: "Como faço um pedido?",
    a: "Acesse o cardápio, escolha os itens, personalize adicionais, revise no carrinho e finalize. Você recebe um código de rastreio para acompanhar.",
  },
  {
    c: "Pedidos",
    q: "Quais formas de pagamento vocês aceitam?",
    a: "PIX (aprovação em segundos), cartão de crédito/débito online e pagamento presencial na retirada ou na entrega.",
  },
  {
    c: "Pedidos",
    q: "Vocês têm opções vegetarianas e veganas?",
    a: "Sim. Filtre o cardápio pelas tags 'vegetariano' e 'vegano'. Também trabalhamos alergênicos sob demanda.",
  },
  {
    c: "Delivery",
    q: "Qual o tempo médio de entrega?",
    a: "20 a 30 min em Copacabana (grátis), 30 a 45 min nos bairros vizinhos. O tempo estimado aparece no checkout, calculado por bairro.",
  },
  {
    c: "Delivery",
    q: "Vocês entregam onde?",
    a: "Copacabana (grátis), Leme, Ipanema, Arpoador, Leblon, Botafogo, Humaitá, Flamengo, Urca, Lagoa, Jardim Botânico e Gávea. Veja a lista completa em /marocas/delivery.",
  },
  {
    c: "Delivery",
    q: "Vocês usam iFood/Rappi/Uber Eats?",
    a: "Não. Entrega própria com motos da casa. Você paga direto para a Marocas, sem taxa de intermediário.",
  },
  {
    c: "Reservas",
    q: "Como reservo uma mesa?",
    a: "Vá em Reservas, escolha data, horário e número de pessoas. A confirmação chega em minutos pelo WhatsApp.",
  },
  {
    c: "Reservas",
    q: "Posso remarcar ou cancelar minha reserva?",
    a: "Sim, sem taxa, até 2 horas antes do horário reservado. Basta usar o link enviado na confirmação.",
  },
  {
    c: "Reservas",
    q: "Como funcionam as comandas por pulseira?",
    a: "Ao entrar no salão você recebe uma pulseira numerada. Todos os pedidos ficam vinculados à sua conta, sem risco de trocar comanda.",
  },
  {
    c: "Eventos",
    q: "Vocês fazem aniversários e eventos privados?",
    a: "Sim — aniversários, corporativos, mini weddings, workshops de cozinha e chef em casa. Solicite orçamento em /marocas/eventos.",
  },
  {
    c: "Eventos",
    q: "Cobram taxa de rolha?",
    a: "Não. Você pode trazer o vinho que quiser sem custo adicional.",
  },
  {
    c: "Institucional",
    q: "O WhatsApp aceita pedidos?",
    a: "WhatsApp é para SAC, reservas, eventos e pós-venda. Pedidos são feitos pelo cardápio para garantir preço, tempo e rastreio corretos.",
  },
  {
    c: "Institucional",
    q: "Como vocês tratam dados pessoais?",
    a: "Seguimos a LGPD. Nenhum dado de cartão é armazenado. Você pode solicitar exclusão do cadastro a qualquer momento.",
  },
];

const CATEGORIAS: (Categoria | "Todas")[] = [
  "Todas",
  "Pedidos",
  "Delivery",
  "Reservas",
  "Eventos",
  "Institucional",
];

export const Route = createFileRoute("/marocas/faq")({
  head: () => ({
    meta: [
      { title: "Dúvidas frequentes — Marocas Copacabana" },
      {
        name: "description",
        content:
          "Como pedir, reservar, pagar, rastrear e planejar eventos na Marocas Copacabana.",
      },
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
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIAS)[number]>("Todas");

  const filtrado = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return FAQ.filter((f) => {
      if (cat !== "Todas" && f.c !== cat) return false;
      if (!t) return true;
      return f.q.toLowerCase().includes(t) || f.a.toLowerCase().includes(t);
    });
  }, [busca, cat]);

  return (
    <MarocasShell
      breadcrumbs={[
        { label: "Marocas", to: "/marocas" },
        { label: "Dúvidas frequentes" },
      ]}
    >
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-14 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Central de ajuda
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-3">
            Dúvidas frequentes
          </h1>
          <p className="text-muted-foreground mt-3">
            Respostas rápidas para pedidos, delivery, reservas, eventos e
            institucional.
          </p>
          <div className="relative mt-6">
            <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar uma dúvida..."
              className="w-full rounded-full border pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Buscar dúvida"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`rounded-full border px-4 py-1.5 text-sm ${cat === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
        {filtrado.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="font-semibold">Nada encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente outra palavra ou fale com a gente pelo WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrado.map((f) => (
              <details
                key={f.q}
                className="rounded-2xl border p-5 group bg-card"
              >
                <summary className="font-serif font-bold cursor-pointer flex items-center justify-between gap-3 text-lg">
                  {f.q}
                  <span className="text-primary group-open:rotate-180 transition text-sm">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
                <div className="text-[10px] mt-3 uppercase tracking-widest text-muted-foreground">
                  {f.c}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-[2fr_1fr] gap-6 items-center">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold">
              Não achou o que procura?
            </h2>
            <p className="mt-2 opacity-90">
              Fale direto com a casa pelo WhatsApp — respondemos rapidinho.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href={marocasWhatsAppUrl("Olá! Vim da central de ajuda da Marocas.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-background text-foreground px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Falar no WhatsApp
            </a>
            <Link
              to="/marocas/contato"
              className="rounded-full border-2 border-primary-foreground/30 px-6 py-3 font-semibold hover:bg-primary-foreground/10 transition inline-flex items-center gap-2"
            >
              Ver todos os canais <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarocasShell>
  );
}
