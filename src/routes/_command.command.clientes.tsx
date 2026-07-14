import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/clientes")({
  head: () => ({ meta: [{ title: "Clientes · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Clientes" description="Gestão unificada de todos os tenants Impulsionando.">
      <ComingSoon />
    </CommandPage>
  );
}
