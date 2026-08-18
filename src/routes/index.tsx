import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/marketing/HomePage";
import { ChrismedHomePage } from "./chrismed.index";
import { Route as ColorsIndexRoute } from "./colors.index";
import { WmpHome } from "./wmp.index";
import { AnaMaduStorefront } from "@/components/anamadu/AnaMaduStorefront";
import { AnitaDock } from "@/components/anamadu/AnitaDock";
import { CpDiscoveryPopup } from "@/components/cp/CpDiscoveryPopup";
import { useEffect } from "react";

const SUBDOMAIN_LANDING: Record<string, string> = {
  marocas: "/marocas",
  chrismed: "/chrismed",
  riomed: "/riomed",
  wmp: "/wmp",
  csi: "/csi",
  garrido: "/garrido",
  anamadu: "/anamadu",
  tour: "/tour",
  "impulsionando-tour": "/tour",
  impulsity: "/vitrine/impulsity",
  dqa: "/vitrine/dqa-panini",
  "plataforma-saude": "/vitrine/patricia-lenine",
  relacionamento: "/vitrine/relacionamento",
  "impulsionando-brasil": "/vitrine/impulsionando-brasil",
};

const CUSTOM_HOST_LANDING: Record<string, string> = {
  "agenda.chrismed.com.br": "/chrismed",
  "www.agenda.chrismed.com.br": "/chrismed",
  "colorssaude.com.br": "/colors",
  "wmp.com.br": "/wmp",
  "www.wmp.com.br": "/wmp",
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
    if (host === "colorssaude.com.br") {
      return <><ColorsRootMetadata /><ColorsRootPage /></>;
    }
    if (host === "chrismed.impulsionando.com.br") return <><ChrismedRootMetadata /><ChrismedHomePage /></>;
    if (host === "wmp.impulsionando.com.br" || host === "wmp.com.br" || host === "www.wmp.com.br") {
      return <><WmpRootMetadata /><WmpHome /></>;
    }
    if (host === "anamadu.impulsionando.com.br") return <><AnaMaduRootMetadata /><AnaMaduStorefront /><AnitaDock /></>;
  }
  return <><HomePage /><CpDiscoveryPopup /></>;
}

function ColorsRootPage() {
  const Component = ColorsIndexRoute.options.component;
  return Component ? <Component /> : null;
}

function ColorsRootMetadata() {
  useEffect(() => {
    const canonicalUrl = "https://colorssaude.com.br/";
    document.title = "Colors Saúde — Produtos oficiais, Íris, suporte, afiliados e eventos";

    const canonicals = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
    if (canonicals.length === 0) {
      const canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = canonicalUrl;
      document.head.appendChild(canonical);
    } else {
      canonicals[0].setAttribute("href", canonicalUrl);
      canonicals.slice(1).forEach((canonical) => canonical.remove());
    }

    document.querySelectorAll<HTMLMetaElement>('meta[property="og:url"]').forEach((meta) => meta.setAttribute("content", canonicalUrl));
    document.querySelectorAll<HTMLMetaElement>('meta[property="og:title"]').forEach((meta) => meta.setAttribute("content", "Colors Saúde — Uma marca. Uma jornada. Íris com você."));
    document.querySelectorAll<HTMLMetaElement>('meta[name="description"]').forEach((meta) => meta.setAttribute("content", "Colors Saúde: produtos oficiais, atendimento inteligente com a Íris, suporte, agenda, afiliados, eventos e rastreabilidade de jornada."));
  }, []);
  return null;
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

function WmpRootMetadata() {
  useEffect(() => {
    const canonicalUrl = "https://wmp.impulsionando.com.br/";
    document.title = "WMP — Wagner Miller Produções";
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", "WMP — Wagner Miller Produções");
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", "Produção de eventos, contratação de DJs, operação recorrente para hotéis e empresas e rede de parceiros, com briefing estruturado e acompanhamento pelo Milito.");
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
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", "Peças autorais Ana Madú com pedras naturais, catálogo completo, compra interna e projetos personalizados Ourives com atendimento da Annita.");
  }, []);
  return null;
}

export { SUBDOMAIN_LANDING, CUSTOM_HOST_LANDING };
