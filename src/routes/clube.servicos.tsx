import { createFileRoute } from "@tanstack/react-router";
import { DiscoverSection } from "@/components/clube/DiscoverSection";

export const Route = createFileRoute("/clube/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Clube Impulsionando" },
      { name: "description", content: "Consultas, produção de eventos, property management e serviços profissionais do Ecossistema Impulsionando." },
      { property: "og:title", content: "Serviços — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/servicos" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/servicos" }],
  }),
  component: () => (
    <DiscoverSection
      eyebrow="Serviços"
      title="Serviços profissionais dos tenants oficiais"
      description="Consultas, produção, gestão e assessoria — todos com desconto e cashback do Clube."
      dimensao="servicos"
    />
  ),
});
