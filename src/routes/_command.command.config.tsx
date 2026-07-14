import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/config")({
  head: () => ({ meta: [{ title: "Configurações · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Configurações" description="Domínios, integrações, segurança, LGPD e API keys.">
      <ComingSoon />
    </CommandPage>
  );
}
