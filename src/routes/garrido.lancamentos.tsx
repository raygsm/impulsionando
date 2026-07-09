import { createFileRoute } from "@tanstack/react-router";
import { PresetLanding, byTag } from "@/components/garrido/PresetLanding";
import { buildGarridoBreadcrumbJsonLd } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/lancamentos";

export const Route = createFileRoute("/garrido/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos imobiliários no Rio — Imobiliária Garrido" },
      { name: "description", content: "Empreendimentos novos e futuros com condições de tabela, ITBI, sinal + obra + financiamento e curadoria Garrido." },
      { property: "og:title", content: "Lançamentos imobiliários — Imobiliária Garrido" },
      { property: "og:description", content: "Empreendimentos novos com condição de tabela e financiamento facilitado." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Lançamentos" },
      ])),
    }],
  }),
  component: LancamentosPage,
});

function LancamentosPage() {
  return (
    <PresetLanding
      eyebrow="Lançamentos"
      title="Empreendimentos novos, condição de tabela"
      description="Selecionamos lançamentos com Registro de Incorporação (RI) publicado, financiamento aprovado nos principais bancos e condições de sinal + obra + financiamento no ato."
      breadcrumbs={[
        { label: "Início", to: "/garrido" },
        { label: "Lançamentos" },
      ]}
      filter={byTag("lancamento")}
      buscarSearch={{ tag: "lancamento" }}
      extraCta={[{ to: "/garrido/financiamento", label: "Simular financiamento", secondary: true }]}
    />
  );
}
