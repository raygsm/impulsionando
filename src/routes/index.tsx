import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/marketing/HomePage";
import { ChrismedHomePage } from "./chrismed.index";
import { AnaMaduHome } from "@/components/anamadu/AnaMaduHome";
import { AnitaDock } from "@/components/anamadu/AnitaDock";
import { CpDiscoveryPopup } from "@/components/cp/CpDiscoveryPopup";
import { useEffect } from "react";

// Mapeamento de subdomínio → rota landing do cliente (CORE Impulsionando).
// Todo cliente ativo com subdomínio *.impulsionando.com.br entra aqui.
// Sem entrada explícita, cai no fallback /vitrine/{public_slug}.
const SUBDOMAIN_LANDING: Record<string, string> = {
  marocas: "/marocas",
  colors: "/colors",
  chrismed: "/chrismed",
  riomed: "/riomed",
  wmp: "/wmp",
  garrido: "/garrido",
  anamadu: "/anamadu",
  impulsity: "/vitrine/impulsity",
  dqa: "/vitrine/dqa-panini",
  "plataforma-saude": "/vitrine/patricia-lenine",
  relacionamento: "/vitrine/relacionamento",
  "impulsionando-brasil": "/vitrine/impulsionando-brasil",
};

const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  "colors.impulsionando.lovable.app": "/colors",
  "colorsaude.lovable.app": "/colors",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Impulsionando Tecnologia — Sistemas modulares e automação" },
      { name: "description", content: "Plataforma SaaS multiempresa: CRM, agenda online, pagamentos, estoque, BI e automação. Tecnologia e sistemas inteligentes para empresas que precisam crescer com controle." },
      { property: "og:title", content: "Impulsionando Tecnologia — Sistemas modulares e automação" },
      { property: "og:description", content: "Ecossistema modular para CRM, agenda, operação, pagamentos, estoque, BI e automação." },
      { property: "og:url", content: "https://impulsionando.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/" }],
  }),
  component: HomeWithSubdomainGuard,
});

function HomeWithSubdomainGuard() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "chrismed.impulsionando.com.br") return <><ChrismedRootMetadata /><ChrismedHomePage /></>;
    if (host === "anamadu.impulsionando.com.br") return <><AnaMaduRootMetadata /><AnaMaduHome /><AnitaDock /></>;
  }
  return <><HomePage /><CpDiscoveryPopup /></>;
}

function ChrismedRootMetadata() {
  useEffect(() => {
    const canonicalUrl = "https://chrismed.impulsionando.com.br/";
    document.title = "CHRISMED — Medicina privada com a Dra. Christiane Alencar";
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", "CHRISMED — Dra. Christiane Alencar");
  }, []);
  return null;
}

function AnaMaduRootMetadata() {
  useEffect(() => {
    const canonicalUrl = "https://anamadu.impulsionando.com.br/";
    document.title = "Ana Madú — Acessórios e joias autorais com pedras naturais";
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", "Ana Madú — Pedras naturais, peças autorais e Ourives");
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", "Peças autorais Ana Madú com pedras naturais, coleções, presentes e projetos personalizados Ourives com atendimento da Anita.");
  }, []);
  return null;
}

export { SUBDOMAIN_LANDING, CUSTOM_HOST_LANDING };
