import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade e LGPD — Impulsionando Tecnologia" },
      { name: "description", content: "Política de privacidade e tratamento de dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD) — Lei 13.709/2018." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Política de Privacidade — Impulsionando Tecnologia" },
      { property: "og:description", content: "Como tratamos seus dados pessoais conforme a LGPD." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Política de Privacidade"
      description="Em revisão conforme LGPD. Conteúdo completo será publicado em breve."
    />
  ),
});
