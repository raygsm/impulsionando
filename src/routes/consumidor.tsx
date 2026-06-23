import { createFileRoute } from "@tanstack/react-router";
import { ClubeLanding } from "@/components/clube/ClubeLanding";

export const Route = createFileRoute("/consumidor")({
  head: () => ({
    meta: [
      { title: "Clube Impulsionando — Descubra lugares, acumule benefícios" },
      { name: "description", content: "Entre grátis no Clube Impulsionando. Descubra bares, restaurantes, cervejarias e eventos próximos, receba vantagens exclusivas e participe das experiências da nossa rede de parceiros." },
      { property: "og:title", content: "Clube Impulsionando — Vantagens exclusivas para você" },
      { property: "og:description", content: "Cadastro grátis. Descubra parceiros, acumule pontos, receba alertas e curta experiências exclusivas." },
      { property: "og:url", content: "https://impulsionando.com.br/consumidor" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/consumidor" }],
  }),
  component: ClubeLanding,
});
