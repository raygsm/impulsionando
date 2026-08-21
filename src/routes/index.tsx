import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HomePageLive } from "@/components/marketing/HomePageLive";
import { ChrismedHomePage } from "./chrismed.index";
import { Route as ColorsIndexRoute } from "./colors.index";
import { Route as WmpIndexRoute } from "./wmp.index";
import { Route as CsiIndexRoute } from "./csi.index";
import { AnaMaduStorefront } from "@/components/anamadu/AnaMaduStorefront";
import { AnitaDock } from "@/components/anamadu/AnitaDock";
import { CpDiscoveryPopup } from "@/components/cp/CpDiscoveryPopup";
import { tenantLandingTargetForHost } from "@/lib/subdomain";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Impulsionando Tecnologia — Sistemas modulares e automação" },
      { name: "description", content: "Plataforma SaaS multiempresa: CRM, agenda online, pagamentos, estoque, BI e automação." },
    ],
  }),
  component: HomeWithTenantResolver,
});

function routeComponent(route: { options: { component?: React.ComponentType } }) {
  const Component = route.options.component;
  return Component ? <Component /> : null;
}

function HomeWithTenantResolver() {
  const navigate = useNavigate();
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const target = tenantLandingTargetForHost(host);

  // Dedicated root renderers retained only where root hydration is intentional.
  if (host === "wmp.impulsionando.com.br") return routeComponent(WmpIndexRoute);
  if (host === "csi.impulsionando.com.br") return routeComponent(CsiIndexRoute);
  if (host === "colorssaude.impulsionando.com.br" || host === "colorssaude.com.br") return routeComponent(ColorsIndexRoute);
  if (host === "chrismed.impulsionando.com.br") return <ChrismedHomePage />;
  if (host === "anamadu.impulsionando.com.br") return <><AnaMaduStorefront /><AnitaDock /></>;

  // Every other tenant uses the single canonical resolver. No duplicated hostname maps.
  useEffect(() => {
    if (target && target !== "/") navigate({ to: target as never, replace: true });
  }, [navigate, target]);

  if (target) return null;
  return <><HomePageLive /><CpDiscoveryPopup /></>;
}
