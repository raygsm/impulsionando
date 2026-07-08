import { createFileRoute } from "@tanstack/react-router";
import { DiscoverSection } from "@/components/clube/DiscoverSection";

export const Route = createFileRoute("/clube/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery — Clube Impulsionando" },
      { name: "description", content: "Restaurantes, bares e cafeterias com delivery no Clube Impulsionando. Vouchers e cashback em cada pedido." },
      { property: "og:title", content: "Delivery — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/delivery" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/delivery" }],
  }),
  component: () => (
    <DiscoverSection
      eyebrow="Delivery"
      title="Peça em segundos pelo Clube"
      description="Cardápios digitais dos tenants gastronomia. Cupom e cashback aplicáveis em cada pedido elegível."
      dimensao="delivery"
    />
  ),
});
