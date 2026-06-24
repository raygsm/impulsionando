import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/riomed/productos")({
  loader: () => {
    throw redirect({ to: "/riomed/cotizar" });
  },
});
