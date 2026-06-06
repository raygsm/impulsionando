import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AffiliatesSubnav } from "@/components/affiliates/AffiliatesSubnav";

export const Route = createFileRoute("/_authenticated/affiliates")({
  head: () => ({
    meta: [
      { title: "Afiliados e Produtos — Impulsionando" },
      { name: "description", content: "Módulo de Afiliados e Produtos: produtos, ofertas, afiliados, coprodutores, gerentes, links, comissões, splits e saques." },
    ],
  }),
  component: AffiliatesLayout,
});

function AffiliatesLayout() {
  return (
    <div className="p-6">
      <AffiliatesSubnav />
      <Outlet />
    </div>
  );
}
