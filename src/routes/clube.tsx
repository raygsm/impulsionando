import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ClubeShell } from "@/components/clube/ClubeShell";

/**
 * Layout oficial do Clube Impulsionando (consumidor final).
 * A home passou a viver em `clube.index.tsx`; esta rota apenas
 * envelopa todas as leaf routes com o Shell + tokens do Clube.
 */
export const Route = createFileRoute("/clube")({
  head: () => ({
    meta: [
      { title: "Clube Impulsionando — Marketplace do Consumidor" },
      {
        name: "description",
        content:
          "Marketplace inteligente do Ecossistema Impulsionando: empresas, produtos, serviços, imóveis, eventos, delivery, vouchers, cashback e recomendações do Impulsionito.",
      },
      { property: "og:title", content: "Clube Impulsionando" },
      { property: "og:description", content: "Descubra, economize e ganhe cashback com todo o Ecossistema Impulsionando." },
      { property: "og:url", content: "https://impulsionando.com.br/clube" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Clube Impulsionando" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ClubeShell>
      <Outlet />
    </ClubeShell>
  ),
});
