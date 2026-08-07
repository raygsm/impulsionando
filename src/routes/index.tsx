import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/marketing/HomePage";
import { ChrismedHomePage } from "./chrismed.index";
import { useEffect } from "react";

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
  if (
    typeof window !== "undefined" &&
    window.location.hostname.toLowerCase() === "chrismed.impulsionando.com.br"
  ) {
    return (
      <>
        <ChrismedRootMetadata />
        <ChrismedHomePage />
      </>
    );
  }
  return <HomePage />;
}

function ChrismedRootMetadata() {
  useEffect(() => {
    const canonicalUrl = "https://chrismed.impulsionando.com.br/";
    document.title = "CHRISMED — Medicina privada com a Dra. Christiane Alencar";

    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    canonical?.setAttribute("href", canonicalUrl);

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    ogUrl?.setAttribute("content", canonicalUrl);

    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    ogTitle?.setAttribute("content", "CHRISMED — Dra. Christiane Alencar");
  }, []);

  return null;
}

export { SUBDOMAIN_LANDING, CUSTOM_HOST_LANDING };
