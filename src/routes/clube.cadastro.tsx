import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/clube/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro no Clube — Impulsionando" },
      { name: "description", content: "Crie sua conta gratuita no Clube Impulsionando." },
    ],
  }),
  component: () => (
    <Navigate to="/auth" search={{ persona: "clube", mode: "signup" } as never} replace />
  ),
});
