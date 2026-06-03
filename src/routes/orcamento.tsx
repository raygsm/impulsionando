import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/orcamento")({
  head: () => ({ meta: [{ title: "Orçamento automático — Impulsionando Tecnologia" }] }),
  component: () => (
    <ComingSoon
      title="Orçamento automático"
      description="Briefing inteligente que recomenda módulos com base na sua operação e gera uma estimativa inicial."
    />
  ),
});
