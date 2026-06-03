import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "./solucoes";

export const Route = createFileRoute("/modulos")({
  head: () => ({
    meta: [
      { title: "Módulos — Agenda, CRM, WhatsApp, Pagamentos | Impulsionando Tecnologia" },
      { name: "description", content: "Módulos contratáveis separadamente: agenda online, WhatsApp, CRM, afiliados, sites, pagamentos, emissão fiscal, usuários, relatórios e integrações." },
      { property: "og:title", content: "Módulos — Impulsionando Tecnologia" },
      { property: "og:description", content: "Monte seu sistema combinando apenas os módulos que você precisa." },
      { name: "twitter:title", content: "Módulos — Impulsionando Tecnologia" },
      { name: "twitter:description", content: "Sistema modular: contrate só o que precisa." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Módulos"
      description="Agenda, WhatsApp, CRM, afiliados, sites, pagamentos, emissão fiscal, usuários, relatórios, sistemas personalizados e integrações."
    />
  ),
});
