import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Impulsionando Tecnologia" },
      { name: "description", content: "Fale com a Impulsionando Tecnologia pelo WhatsApp +55 21 99307-5000 ou e-mail sac@impulsionandobrasil.com.br. Atendimento humano para sistemas, automação e integrações." },
      { property: "og:title", content: "Contato — Impulsionando Tecnologia" },
      { property: "og:description", content: "WhatsApp, e-mail e orçamento personalizado. Fale com nosso time." },
      { name: "twitter:title", content: "Contato — Impulsionando Tecnologia" },
      { name: "twitter:description", content: "WhatsApp, e-mail e orçamento personalizado." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Fale com a Impulsionando Tecnologia"
      description="WhatsApp +55 21 99307-5000 · sac@impulsionandobrasil.com.br"
    />
  ),
});
