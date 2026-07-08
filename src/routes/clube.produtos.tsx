import { createFileRoute } from "@tanstack/react-router";
import { DiscoverSection } from "@/components/clube/DiscoverSection";

export const Route = createFileRoute("/clube/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Clube Impulsionando" },
      { name: "description", content: "Descubra produtos oficiais do Ecossistema Impulsionando: nutracêuticos, equipamentos médico-hospitalares e mais." },
      { property: "og:title", content: "Produtos — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/produtos" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/produtos" }],
  }),
  component: () => (
    <DiscoverSection
      eyebrow="Produtos"
      title="Marcas do Ecossistema com produtos disponíveis"
      description="Nutracêuticos, itens B2B e catálogo dos tenants oficiais. Cashback aplicável em cada compra elegível."
      dimensao="produtos"
    />
  ),
});
