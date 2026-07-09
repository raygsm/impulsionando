import { createFileRoute } from "@tanstack/react-router";
import { PresetLanding, byFinalidade } from "@/components/garrido/PresetLanding";
import { buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/temporada";

export const Route = createFileRoute("/garrido/temporada")({
  head: () => ({
    meta: [
      { title: "Imóveis para temporada no Rio — Imobiliária Garrido" },
      { name: "description", content: "Studios, apartamentos e coberturas mobiliados para temporada no Rio de Janeiro. Check-in autônomo, Wi-Fi e limpeza inclusos, contrato de temporada padrão." },
      { property: "og:title", content: "Imóveis para temporada — Imobiliária Garrido" },
      { property: "og:description", content: "Mobiliados, próximos à praia, com Wi-Fi e check-in autônomo." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Temporada" },
      ])),
    }],
  }),
  component: TemporadaPage,
});

function TemporadaPage() {
  return (
    <PresetLanding
      eyebrow="Estadias curtas"
      title="Temporada no Rio de Janeiro"
      description="Imóveis mobiliados e prontos para receber. Todos com Wi-Fi, check-in autônomo, limpeza incluída e contrato de temporada padrão. Ideal para lazer, trabalho remoto e visitas prolongadas."
      breadcrumbs={[
        { label: "Início", to: "/garrido" },
        { label: "Temporada" },
      ]}
      filter={byFinalidade("temporada")}
      buscarSearch={{ finalidade: "temporada" }}
    />
  );
}
