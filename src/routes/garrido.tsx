import { createFileRoute } from "@tanstack/react-router";
import { GarridoShell } from "@/components/garrido/GarridoShell";

export const Route = createFileRoute("/garrido")({
  head: () => ({
    meta: [
      { title: "Imobiliária Garrido — Compra, venda, locação e temporada no Rio" },
      {
        name: "description",
        content:
          "Imóveis residenciais, comerciais e rurais no Rio de Janeiro e Região Serrana. Compra, venda, locação, temporada, lançamentos e alto padrão. Empresa conectada ao Core Impulsionando.",
      },
      { property: "og:title", content: "Imobiliária Garrido — Referência imobiliária no Rio" },
      {
        property: "og:description",
        content: "Compra, venda, locação, temporada e lançamentos com curadoria Garrido.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Imobiliária Garrido" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: "Imobiliária Garrido",
          areaServed: ["Rio de Janeiro", "Petrópolis", "Maricá", "Região Serrana"],
          priceRange: "$$-$$$$",
          url: "https://impulsionando.com.br/garrido",
          sameAs: ["https://impulsionando.com.br"],
        }),
      },
    ],
  }),
  component: GarridoShell,
});
