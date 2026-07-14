import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/comercial")({
  head: () => ({ meta: [{ title: "Comercial · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Comercial" description="Pipeline, leads, funil de conversão e metas.">
      <ComingSoon />
    </CommandPage>
  );
}
