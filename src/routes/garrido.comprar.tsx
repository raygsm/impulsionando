import { createFileRoute } from "@tanstack/react-router";
import {
  PresetLanding,
  byFinalidade,
} from "@/components/garrido/PresetLanding";
import { buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/comprar";

export const Route = createFileRoute("/garrido/comprar")({
  head: () => ({
    meta: [
      { title: "Imóveis à venda no Rio de Janeiro — Imobiliária Garrido" },
      { name: "description", content: "Apartamentos, casas, coberturas, terrenos e imóveis comerciais à venda no Rio de Janeiro e Região Serrana. Curadoria Garrido com documentação verificada." },
      { property: "og:title", content: "Imóveis à venda — Imobiliária Garrido" },
      { property: "og:description", content: "Curadoria de imóveis para compra no Rio de Janeiro e Região Serrana." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Comprar" },
      ])),
    }],
  }),
  component: ComprarPage,
});

function ComprarPage() {
  return (
    <PresetLanding
      eyebrow="Comprar imóveis"
      title="Encontre o imóvel certo para morar ou investir"
      description="Selecionamos imóveis à venda no Rio de Janeiro e Região Serrana com documentação verificada, corretor dedicado e apoio de simulação de financiamento em vários bancos."
      breadcrumbs={[
        { label: "Início", to: "/garrido" },
        { label: "Comprar" },
      ]}
      filter={byFinalidade("venda")}
      buscarSearch={{ finalidade: "venda" }}
      extraCta={[{ to: "/garrido/financiamento", label: "Simular financiamento", secondary: true }]}
    />
  );
}
