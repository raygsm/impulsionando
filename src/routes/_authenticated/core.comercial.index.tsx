import { createFileRoute } from "@tanstack/react-router";
import { CoreHubPage } from "@/components/app/CoreHubPage";
import { Inbox, FileText, Users, Store, Handshake, Crown, Megaphone, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/comercial/")({
  head: () => ({ meta: [{ title: "Comercial — Core Impulsionando" }, { name: "robots", content: "noindex" }] }),
  component: ComercialHub,
});

function ComercialHub() {
  return (
    <CoreHubPage
      title="Comercial"
      description="Funil comercial do Core: captura, proposta, conversão, vitrine, white-label e clube."
      items={[
        { to: "/core/marketing-leads", label: "Leads", icon: Inbox, description: "Leads do site, campanhas e vitrine.", status: "pronto" },
        { to: "/core/briefings", label: "Propostas & Briefings", icon: FileText, description: "Briefings comerciais e propostas em andamento.", status: "pronto" },
        { to: "/core/feira-leads", label: "Funil Comercial", icon: TrendingUp, description: "Kanban do funil, tempo por etapa, motivo de perda.", status: "pronto" },
        { to: "/core/clientes", label: "Clientes ativos", icon: Users, description: "Base ativa, saúde comercial e oportunidades de upsell.", status: "pronto" },
        { to: "/ecossistema", label: "Vitrine pública", icon: Store, description: "Vitrine do ecossistema — como o mercado vê a Impulsionando.", status: "pronto" },
        { to: "/white-label/cockpit", label: "White-Label", icon: Handshake, description: "Cockpit de parceiros WL, capacidade e clientes vinculados.", status: "pronto" },
        { to: "/admin/clube", label: "Clube (Consumidor Final)", icon: Crown, description: "Programa de benefícios, membros e parceiros participantes.", status: "pronto" },
        { to: "/core/marketing-pages", label: "Campanhas & Páginas", icon: Megaphone, description: "Páginas de campanha, criativos e materiais de conversão.", status: "pronto" },
      ]}
    />
  );
}
