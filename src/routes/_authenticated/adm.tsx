import { createFileRoute, redirect } from "@tanstack/react-router";

// Rota oficial /adm — central operacional da Impulsionando.
// Encaminha para o Core Manager já existente, sem duplicar telas.
export const Route = createFileRoute("/_authenticated/adm")({
  beforeLoad: () => {
    throw redirect({ to: "/core" });
  },
});
