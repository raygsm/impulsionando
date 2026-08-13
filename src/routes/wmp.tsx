import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MillitoDock } from "@/components/wmp/MillitoDock";

export const Route = createFileRoute("/wmp")({
  head: () => ({
    meta: [
      { property: "og:site_name", content: "WMP · Wagner Miller Produções" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <><Outlet /><MillitoDock /></>,
});
