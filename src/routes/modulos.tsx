import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/modulos")({
  head: () => ({ meta: [{ title: "Módulos — Impulsionando Tecnologia" }] }),
  component: () => (
    <ComingSoon
      title="Módulos"
      description="Agenda, WhatsApp, CRM, afiliados, sites, pagamentos, emissão fiscal, usuários, relatórios, sistemas personalizados e integrações."
    />
  ),
});
