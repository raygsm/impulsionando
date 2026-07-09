import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/wmp")({
  head: () => ({
    meta: [
      { title: "WMP — Plataforma de produção e gestão de eventos" },
      {
        name: "description",
        content:
          "Plataforma completa de produção, gestão e comercialização de eventos: som, luz, palco, estrutura, coordenação técnica e experiências para shows, festivais, congressos e corporativos.",
      },
      { property: "og:title", content: "WMP — Plataforma de produção e gestão de eventos" },
      {
        property: "og:description",
        content:
          "Do briefing à execução: som, luz, palco, telão, coordenação e experiências. Referência do ecossistema Impulsionando para o segmento de eventos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "WMP · Wagner Miller Produções" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Outlet />,
});
