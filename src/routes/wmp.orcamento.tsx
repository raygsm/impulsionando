import { createFileRoute } from "@tanstack/react-router";
import { WmpOrcamentoForm } from "@/components/wmp/WmpOrcamentoForm";

export const Route = createFileRoute("/wmp/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento inteligente — WMP" },
      { name: "description", content: "Briefing técnico inteligente da WMP para dimensionamento de eventos, equipamentos e adicionais." },
    ],
  }),
  component: WmpOrcamentoForm,
});
