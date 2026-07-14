import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/aprovacoes")({
  head: () => ({ meta: [{ title: "Aprovações · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Aprovações" description="Fila única de solicitações aguardando decisão.">
      <ComingSoon />
    </CommandPage>
  );
}
