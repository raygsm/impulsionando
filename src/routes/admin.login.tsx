import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acesso Administrativo — Impulsionando" },
      { name: "description", content: "Acesso restrito da equipe Impulsionando." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => <Navigate to="/auth" search={{ persona: "admin" } as never} replace />,
});
