import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/clube/login")({
  head: () => ({
    meta: [
      { title: "Entrar no Clube — Impulsionando" },
      { name: "description", content: "Acesse sua conta do Clube Impulsionando." },
    ],
  }),
  component: () => <Navigate to="/auth" search={{ persona: "clube" } as never} replace />,
});
