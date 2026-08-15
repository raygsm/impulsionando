import { createFileRoute, Outlet } from "@tanstack/react-router";
import IrisDock from "@/components/colors/IrisDock";

/**
 * colors.impulsionando.com.br — Layout raiz.
 * O conteúdo da home vive em `colors.index.tsx`.
 * Todas as sub-rotas renderizam dentro deste <Outlet /> e compartilham a Íris.
 */
export const Route = createFileRoute("/colors")({
  head: () => ({
    meta: [{ property: "og:site_name", content: "Colors Saúde" }],
  }),
  component: ColorsLayout,
});

function ColorsLayout() {
  return <><Outlet /><IrisDock /></>;
}
