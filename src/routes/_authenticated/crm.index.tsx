import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/crm/")({
  beforeLoad: () => { throw redirect({ to: "/crm/board" }); },
  component: () => null,
});
