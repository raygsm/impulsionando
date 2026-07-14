import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo da Plataforma · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Catálogo da Plataforma" description="Planos, módulos, templates, cupons e regras comerciais.">
      <ComingSoon />
    </CommandPage>
  );
}
