import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HomePageLive } from "@/components/marketing/HomePageLive";
import { ChrismedHomePage } from "./chrismed.index";
import { Route as ColorsIndexRoute } from "./colors.index";
import { Route as WmpIndexRoute } from "./wmp.index";
import { Route as CsiIndexRoute } from "./csi.index";
import { RevelaLanding } from "./revela";
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
  const isRevela = host === "revela.impulsionando.com.br";
  const isDedicatedRoot = isRevela || host === "wmp.impulsionando.com.br" || host === "csi.impulsionando.com.br" || host === "colorssaude.impulsionando.com.br" || host === "colorssaude.com.br" || host === "chrismed.impulsionando.com.br" || host === "anamadu.impulsionando.com.br";

  // Hooks must run in the same order on server and browser. Dedicated hosts
  // render natively at root and therefore must not be redirected.
  useEffect(() => {
    if (!isDedicatedRoot && target && target !== "/") navigate({ to: target as never, replace: true });
  }, [isDedicatedRoot, navigate, target]);

  if (isRevela) return <RevelaLanding />;
  if (host === "wmp.impulsionando.com.br") return routeComponent(WmpIndexRoute);
  if (host === "csi.impulsionando.com.br") return routeComponent(CsiIndexRoute);
  if (host === "colorssaude.impulsionando.com.br" || host === "colorssaude.com.br") return routeComponent(ColorsIndexRoute);
  if (host === "chrismed.impulsionando.com.br") return <ChrismedHomePage />;
  if (host === "anamadu.impulsionando.com.br") return <><AnaMaduStorefront /><AnitaDock /></>;

  if (target) return null;
  return <><HomePageLive /><CpDiscoveryPopup /></>;
}
