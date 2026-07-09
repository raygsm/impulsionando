import { createFileRoute } from "@tanstack/react-router";
import { PresetLanding } from "@/components/garrido/PresetLanding";
import { buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";
import type { Imovel } from "@/data/garrido-imoveis";

const CANONICAL = "https://impulsionando.com.br/garrido/rural";

const isRural = (i: Imovel) => i.categoria === "rural" || i.categoria === "terreno";

export const Route = createFileRoute("/garrido/rural")({
  head: () => ({
    meta: [
      { title: "Sítios, chácaras e terrenos — Imobiliária Garrido" },
      { name: "description", content: "Sítios, chácaras, fazendas e terrenos no Rio de Janeiro e Região Serrana com documentação regularizada (CCIR, ITR, RGI) e apoio para financiamento." },
      { property: "og:title", content: "Imóveis rurais e terrenos — Imobiliária Garrido" },
      { property: "og:description", content: "Sítios, chácaras, fazendas e terrenos com documentação regularizada." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Rural" },
      ])),
    }],
  }),
  component: RuralPage,
});

function RuralPage() {
  return (
    <PresetLanding
      eyebrow="Rural, terrenos e loteamentos"
      title="Sítios, chácaras, fazendas e terrenos"
      description="Imóveis rurais e terrenos no Rio de Janeiro e Região Serrana. Documentação verificada (CCIR, ITR, escritura + RGI), inspeção de nascentes e apoio para financiamento rural."
      breadcrumbs={[
        { label: "Início", to: "/garrido" },
        { label: "Rural" },
      ]}
      filter={isRural}
      buscarSearch={{ categoria: "rural" }}
    />
  );
}
