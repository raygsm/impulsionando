// Rio Med Admin · padrão Impulsionando.
// Esta rota é apenas um redirecionamento para o painel universal
// `/admin/clientes/riomed/painel`, que renderiza:
//   - cabeçalho com logo Impulsionando + slogan "Seu Dashboard"
//   - KPIs proporcionais ao plano contratado
//   - menu completo de TODOS os recursos do plano (100% funcionais)
//
// Regra de identidade: dashboards de cliente NUNCA exibem a marca do tenant.
// Cores, logo e slogan são sempre do core Impulsionando.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/clientes/$slug/painel",
      params: { slug: "riomed" },
      replace: true,
    });
  },
});
