import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos e Preços — Essencial, Integrado, Avançado | Impulsionando Tecnologia" },
      { name: "description", content: "Planos Essencial (1 módulo), Integrado (2 módulos), Avançado (3+ módulos) e Sob Medida. Mensal ou anual com desconto. Sem fidelidade obrigatória." },
      { property: "og:title", content: "Planos e Preços — Impulsionando Tecnologia" },
      { property: "og:description", content: "Do Essencial ao Sob Medida. Mensal ou anual com desconto." },
      { name: "twitter:title", content: "Planos — Impulsionando Tecnologia" },
      { name: "twitter:description", content: "Escolha o plano ideal para seu negócio." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Planos"
      description="Essencial (1 módulo), Integrado (2 módulos), Avançado (3 módulos) e Sob Medida. Mensal ou anual com desconto."
    />
  ),
});
