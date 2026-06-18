import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/white-label/login")({
  head: () => ({
    meta: [
      { title: "Acesso White Label — Impulsionando" },
      { name: "description", content: "Entre na sua plataforma white label." },
    ],
  }),
  component: () => <Navigate to="/auth" search={{ persona: "white-label" } as never} replace />,
});
