import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/ia")({
  head: () => ({ meta: [{ title: "Centro de IA · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Centro de IA" description="Impulsionito, prompts, memória, custos e agentes.">
      <ComingSoon />
    </CommandPage>
  );
}
