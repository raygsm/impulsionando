import { createFileRoute } from "@tanstack/react-router";
import { DiscoverSection } from "@/components/clube/DiscoverSection";

export const Route = createFileRoute("/clube/imoveis")({
  head: () => ({
    meta: [
      { title: "Imóveis — Clube Impulsionando" },
      { name: "description", content: "Compra, venda, locação e temporada com curadoria dos tenants imobiliários do Ecossistema." },
      { property: "og:title", content: "Imóveis — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/imoveis" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/imoveis" }],
  }),
  component: () => (
    <DiscoverSection
      eyebrow="Imóveis"
      title="Imóveis curados do Ecossistema"
      description="Compra, venda, locação e temporada com avaliação, financiamento e concierge dos tenants oficiais."
      dimensao="imoveis"
    />
  ),
});
