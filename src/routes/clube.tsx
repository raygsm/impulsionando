/**
 * Jornada do consumidor final — rota canônica /clube.
 * Aponta para o mesmo componente do `/consumidor` (mantido como alias
 * histórico para links/SEO antigos) e reforça as metatags voltadas
 * ao consumidor.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Route as ConsumidorRoute } from "./consumidor";

export const Route = createFileRoute("/clube")({
  head: () => ({
    meta: [
      { title: "Clube Impulsionando — Free + Premium R$ 9,99/mês" },
      {
        name: "description",
        content:
          "Entre grátis no Clube Impulsionando: descubra bares, restaurantes, eventos, cervejas e benefícios perto de você. Premium por R$ 9,99/mês (ou 17% off no anual) com histórico, alertas inteligentes e participação ativa.",
      },
      { property: "og:title", content: "Clube Impulsionando — Free e Premium" },
      { property: "og:description", content: "Vantagens reais, alertas inteligentes e experiências exclusivas. Cadastro grátis." },
      { property: "og:url", content: "https://impulsionando.com.br/clube" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube" }],
  }),
  component: ClubeRoute,
});

function ClubeRoute() {
  const Comp = ConsumidorRoute.options.component as React.ComponentType;
  return <Comp />;
}
