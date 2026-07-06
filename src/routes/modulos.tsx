import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos — Impulsionando Tecnologia" },
      { name: "description", content: "Catálogo de módulos do ecossistema Impulsionando: CRM, Agenda, EHR, PDV, Vitrine, Eventos, Financeiro e mais." },
      { property: "og:title", content: "Módulos — Impulsionando" },
      { property: "og:description", content: "Todos os módulos operacionais do ecossistema Impulsionando em um só lugar." },
    ],
  }),
  component: () => <Outlet />,
});

