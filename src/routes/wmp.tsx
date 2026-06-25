import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/wmp")({
  head: () => ({
    meta: [
      { title: "WMP — Wagner Miller Produções" },
      { name: "description", content: "Produção de eventos premium, sonorização, iluminação e estrutura completa para festas, shows e corporativos." },
      { property: "og:title", content: "WMP — Som, luz e produção para o seu evento" },
    ],
  }),
  component: () => <Outlet />,
});
