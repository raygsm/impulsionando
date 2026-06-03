import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [{ title: "Planos — Impulsionando Tecnologia" }] }),
  component: () => (
    <ComingSoon
      title="Planos"
      description="Essencial (1 módulo), Integrado (2 módulos), Avançado (3 módulos) e Sob Medida. Mensal ou anual com desconto."
    />
  ),
});
