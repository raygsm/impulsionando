import { createFileRoute, redirect } from "@tanstack/react-router";

// Rota legada — redireciona para o novo Centro de Comunicação.
export const Route = createFileRoute("/_authenticated/admin/comunicacao")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/comunicacoes" });
  },
});
