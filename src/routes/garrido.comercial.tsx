import { createFileRoute } from "@tanstack/react-router";
import { PresetLanding, byCategoria } from "@/components/garrido/PresetLanding";
import { buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/comercial";

export const Route = createFileRoute("/garrido/comercial")({
  head: () => ({
    meta: [
      { title: "Imóveis comerciais no Rio — Imobiliária Garrido" },
      { name: "description", content: "Salas, lojas, andares corporativos e galpões para venda e locação no Rio. Análise de fluxo, viabilidade e contratos comerciais assistidos." },
      { property: "og:title", content: "Imóveis comerciais — Imobiliária Garrido" },
      { property: "og:description", content: "Salas, lojas, andares corporativos e galpões." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Comercial" },
      ])),
    }],
  }),
  component: ComercialPage,
});

function ComercialPage() {
  return (
    <PresetLanding
      eyebrow="Corporativo & varejo"
      title="Imóveis comerciais para seu negócio"
      description="Salas, lojas, andares corporativos e galpões para venda e locação. Análise de fluxo de pedestres, viabilidade jurídica e contratos comerciais com apoio da equipe Garrido."
      breadcrumbs={[
        { label: "Início", to: "/garrido" },
        { label: "Comercial" },
      ]}
      filter={byCategoria("comercial")}
      buscarSearch={{ categoria: "comercial" }}
    />
  );
}
