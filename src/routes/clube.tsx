/**
 * Jornada do consumidor final — rota canônica /clube.
 * Reusa o mesmo componente da rota /consumidor (alias histórico),
 * importando-o diretamente (acessar `Route.options.component` de outra
 * rota quebra com code-splitting → página renderizava em branco).
 */
import { createFileRoute } from "@tanstack/react-router";
import { ClubeLanding } from "./consumidor";

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
  component: ClubeLanding,
});
