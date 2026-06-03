import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Impulsionando Tecnologia" }] }),
  component: () => (
    <ComingSoon
      title="Política de Privacidade"
      description="Em revisão conforme LGPD. Conteúdo completo será publicado em breve."
    />
  ),
});
