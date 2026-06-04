import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/marketing/HomePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Impulsionando Tecnologia — Sistemas modulares, automação e integrações" },
      { name: "description", content: "Tecnologia, automação e sistemas inteligentes para empresas que precisam crescer com controle. Agenda online, WhatsApp, CRM, pagamentos e mais." },
      { property: "og:title", content: "Impulsionando Tecnologia" },
      { property: "og:description", content: "Soluções digitais modulares para atendimento, agenda, WhatsApp, CRM, afiliados, pagamentos e gestão." },
      { property: "og:url", content: "https://sistemas.impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://sistemas.impulsionando.com.br/" }],
  }),
  component: HomePage,
});
