import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Impulsionando Tecnologia" },
      { name: "description", content: "Termos de uso dos sistemas e serviços da Impulsionando Tecnologia." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Termos de Uso — Impulsionando Tecnologia" },
      { property: "og:description", content: "Condições gerais de uso da plataforma." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Termos de Uso"
      description="Em revisão. Conteúdo completo será publicado em breve."
    />
  ),
});
