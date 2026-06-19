import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { HomePage } from "@/components/marketing/HomePage";

// Mapeamento de subdomínio → rota landing do cliente (CORE Impulsionando).
const SUBDOMAIN_LANDING: Record<string, string> = {
  marocas: "/marocas",
};

function resolveSubdomainRedirect(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.toLowerCase().split(":")[0];
  // Apenas subdomínios do domínio principal (não tocar em *.lovable.app/preview).
  if (!h.endsWith(".impulsionando.com.br")) return null;
  const sub = h.replace(/\.impulsionando\.com\.br$/, "");
  if (!sub || sub === "www") return null;
  return SUBDOMAIN_LANDING[sub] ?? null;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Impulsionando Tecnologia — Sistemas modulares e automação" },
      { name: "description", content: "Plataforma SaaS multiempresa: CRM, agenda online, WhatsApp, pagamentos, emissão fiscal, estoque e BI. Tecnologia, automação e sistemas inteligentes para empresas que precisam crescer com controle." },
      { property: "og:title", content: "Impulsionando Tecnologia — Sistemas modulares e automação" },
      { property: "og:description", content: "SaaS multiempresa modular: CRM, agenda, WhatsApp, pagamentos, emissão fiscal, estoque e BI." },
      { property: "og:url", content: "https://impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/" }],
  }),
  component: HomeWithSubdomainGuard,
});

function HomeWithSubdomainGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = resolveSubdomainRedirect(window.location.hostname);
    if (target && window.location.pathname === "/") {
      window.location.replace(target);
    }
  }, []);
  return <HomePage />;
}
