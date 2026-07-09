import { createFileRoute } from "@tanstack/react-router";
import { PresetLanding, byFinalidade } from "@/components/garrido/PresetLanding";
import { buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/alugar";

export const Route = createFileRoute("/garrido/alugar")({
  head: () => ({
    meta: [
      { title: "Imóveis para alugar no Rio de Janeiro — Imobiliária Garrido" },
      { name: "description", content: "Apartamentos, casas e imóveis comerciais para locação no Rio. Contrato digital, garantia flexível (fiador, seguro-fiança ou caução) e corretor dedicado." },
      { property: "og:title", content: "Imóveis para alugar — Imobiliária Garrido" },
      { property: "og:description", content: "Locação residencial e comercial com contrato digital e garantia flexível." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Alugar" },
      ])),
    }],
  }),
  component: AlugarPage,
});

function AlugarPage() {
  return (
    <PresetLanding
      eyebrow="Alugar imóveis"
      title="Locação residencial e comercial no Rio de Janeiro"
      description="Contrato digital, garantia flexível (fiador, seguro-fiança, caução ou título de capitalização) e acompanhamento em todas as etapas — vistoria, entrada, mudança e renovação."
      breadcrumbs={[
        { label: "Início", to: "/garrido" },
        { label: "Alugar" },
      ]}
      filter={byFinalidade("aluguel")}
      buscarSearch={{ finalidade: "aluguel" }}
    />
  );
}
