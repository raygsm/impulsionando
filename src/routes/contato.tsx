import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/contato")({
  head: () => ({ meta: [{ title: "Contato — Impulsionando Tecnologia" }] }),
  component: () => (
    <ComingSoon
      title="Fale com a Impulsionando Tecnologia"
      description="WhatsApp +55 21 99307-5000 · sac@impulsionandobrasil.com.br"
    />
  ),
});
