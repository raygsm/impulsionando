import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AffiliatesSubnav } from "@/components/affiliates/AffiliatesSubnav";
import { PlanGate } from "@/components/app/PlanGate";

export const Route = createFileRoute("/_authenticated/affiliates")({
  head: () => ({
    meta: [
      { title: "Afiliados e Indicações — Impulsionando" },
      { name: "description", content: "Módulo de Afiliados e Indicações: parceiros externos, indicações, comissões, links, cupons e saques. Disponível nos planos Profissional e Completo." },
    ],
  }),
  component: AffiliatesLayout,
});

function AffiliatesLayout() {
  return (
    <div className="p-6">
      <PlanGate moduleName="Afiliados e Indicações" allowedTiers={["profissional", "completo"]}>
        <AffiliatesSubnav />
        <Outlet />
      </PlanGate>
    </div>
  );
}
