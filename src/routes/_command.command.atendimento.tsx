import { createFileRoute } from "@tanstack/react-router";
import { CommandPage, ComingSoon } from "@/components/command/CommandPage";

export const Route = createFileRoute("/_command/command/atendimento")({
  head: () => ({ meta: [{ title: "Atendimento · Command" }] }),
  component: Page,
});

function Page() {
  return (
    <CommandPage title="Atendimento" description="Tickets, WhatsApp, chat, e-mail, NPS e SLA.">
      <ComingSoon />
    </CommandPage>
  );
}
