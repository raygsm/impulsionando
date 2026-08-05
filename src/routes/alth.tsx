import { createFileRoute } from "@tanstack/react-router";
import { ChrismedProfessionalAuth } from "@/components/chrismed/ChrismedProfessionalAuth";

export const Route = createFileRoute("/alth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área dos Profissionais da Saúde — CHRISMED" },
      {
        name: "description",
        content: "Crie sua conta profissional CHRISMED e configure sua agenda de atendimento.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:url", content: "https://chrismed.impulsionando.com.br/alth" },
    ],
  }),
  component: () => <ChrismedProfessionalAuth initialMode="signup" />,
});
