import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/alth")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { mode: "signup" } });
  },
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
});
