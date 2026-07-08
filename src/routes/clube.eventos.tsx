import { createFileRoute } from "@tanstack/react-router";
import { DiscoverSection } from "@/components/clube/DiscoverSection";

export const Route = createFileRoute("/clube/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Clube Impulsionando" },
      { name: "description", content: "Casamentos, corporativos, festivais e shows produzidos pelos tenants do Ecossistema Impulsionando." },
      { property: "og:title", content: "Eventos — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/eventos" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/eventos" }],
  }),
  component: () => (
    <DiscoverSection
      eyebrow="Eventos"
      title="Eventos e experiências do Ecossistema"
      description="Produções profissionais com pré-diagnóstico técnico, cortesias e vantagens exclusivas para membros do Clube."
      dimensao="eventos"
    />
  ),
});
