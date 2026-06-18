import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/empresa/login")({
  head: () => ({
    meta: [
      { title: "Acesso da Empresa — Impulsionando" },
      { name: "description", content: "Entre na sua área da empresa cliente." },
    ],
  }),
  component: () => <Navigate to="/auth" search={{ persona: "empresa" } as never} replace />,
});
