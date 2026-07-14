import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro Impulsionando · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Financeiro Impulsionando" description="MRR, ARR, fluxo de caixa, split e comissões.">
      <ComingSoon />
    </CommandPage>
  );
}
