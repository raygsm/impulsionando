import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/automacoes")({
  head: () => ({ meta: [{ title: "Automações · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Automações" description="N8N, fluxos, filas, execuções e webhooks.">
      <ComingSoon />
    </CommandPage>
  );
}
