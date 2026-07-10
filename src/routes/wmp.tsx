import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/wmp")({
  // Metadados de página vivem nas rotas leaf (wmp.index.tsx, wmp.faq.tsx, etc.).
  // Este layout apenas define defaults de site herdáveis.
  head: () => ({
    meta: [
      { property: "og:site_name", content: "WMP · Wagner Miller Produções" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Outlet />,
});
