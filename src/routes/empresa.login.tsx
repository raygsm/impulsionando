/**
 * Persona-aware alias routes. Cada uma redireciona para /auth com um
 * parâmetro `persona` que a tela de login lê para customizar branding
 * e CTA (Fase A da reestruturação por personas).
 *
 * Mantém /auth como rota canônica única para reduzir manutenção.
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";

function makeAlias(persona: "empresa" | "white-label" | "admin" | "clube" | "clube-cadastro") {
  return function PersonaAlias() {
    const isSignup = persona === "clube-cadastro";
    return (
      <Navigate
        to="/auth"
        search={{ persona, mode: isSignup ? "signup" : "signin" } as never}
        replace
      />
    );
  };
}

export const EmpresaLoginRoute = createFileRoute("/empresa/login")({
  head: () => ({
    meta: [
      { title: "Acesso da Empresa — Impulsionando" },
      { name: "description", content: "Entre na sua área da empresa cliente." },
    ],
  }),
  component: makeAlias("empresa"),
});
