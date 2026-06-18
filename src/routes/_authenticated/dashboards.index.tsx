import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboards/")({
  head: () => ({ meta: [{ title: "Dashboards — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  // SSR is disabled in the parent _authenticated layout; safe to client-redirect
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    // Default goes to Empresa; specific audience pages live under /dashboards/<audience>
    throw redirect({ to: "/dashboards/empresa" });
  },
  component: () => null,
});
