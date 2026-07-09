import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { HomePage } from "@/components/marketing/HomePage";

// Mapeamento de subdomínio → rota landing do cliente (CORE Impulsionando).
// Todo cliente ativo com subdomínio *.impulsionando.com.br entra aqui.
// Sem entrada explícita, cai no fallback /vitrine/{public_slug}.
const SUBDOMAIN_LANDING: Record<string, string> = {
  // Landings dedicadas
  marocas: "/marocas",
  colors: "/colors",
  chrismed: "/chrismed",
  riomed: "/riomed",
  wmp: "/wmp",
  garrido: "/garrido",
  // Sem landing dedicada → vitrine pública do tenant
  impulsity: "/vitrine/impulsity",
  dqa: "/vitrine/dqa-panini",
  "plataforma-saude": "/vitrine/patricia-lenine",
  relacionamento: "/vitrine/relacionamento",
  "impulsionando-brasil": "/vitrine/impulsionando-brasil",
};


// Domínios de clientes (white-label) → rota dedicada.
const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  // Alias Lovable do tenant Colors — resolve para a landing quando o
  // domínio estiver conectado a este projeto Core.
  "colors.impulsionando.lovable.app": "/colors",
  "colorsaude.lovable.app": "/colors",
  "colorssaude.lovable.app": "/colors",
};

function resolveSubdomainRedirect(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.toLowerCase().split(":")[0];
  if (CUSTOM_HOST_LANDING[h]) return CUSTOM_HOST_LANDING[h];
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
