import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos de Uso — Impulsionando Tecnologia" }] }),
  component: () => (
    <ComingSoon
      title="Termos de Uso"
      description="Em revisão. Conteúdo completo será publicado em breve."
    />
  ),
});
