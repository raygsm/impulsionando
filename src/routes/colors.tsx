import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * colors.impulsionando.com.br — Layout raiz.
 * O conteúdo da home vive em `colors.index.tsx`.
 * Todas as sub-rotas (produto/$slug, $brand, super-green-black, painel, etc.)
 * renderizam dentro deste <Outlet />.
 */

export const Route = createFileRoute("/colors")({
  head: () => ({
    meta: [
      { property: "og:site_name", content: "Colors Saúde" },
    ],
  }),
  component: ColorsLayout,
});

function ColorsLayout() {
  return <Outlet />;
}
