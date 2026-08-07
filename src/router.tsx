import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { chrismedInternalPathForPublicPath } from "./lib/subdomain";
import { routeTree } from "./routeTree.gen";

function seedChrismedMaskedLocation() {
  if (typeof window === "undefined") return;
  if (window.location.hostname.toLowerCase() !== "chrismed.impulsionando.com.br") return;

  const internalPath = chrismedInternalPathForPublicPath(window.location.pathname);
  if (!internalPath || window.history.state?.__tempLocation) return;

  const search = window.location.search;
  const hash = window.location.hash;
  window.history.replaceState(
    {
      ...(window.history.state ?? {}),
      __tempLocation: {
        href: `${internalPath}${search}${hash}`,
        pathname: internalPath,
        search,
        hash: hash.startsWith("#") ? hash.slice(1) : hash,
        state: {},
      },
    },
    "",
    window.location.href,
  );
}

export const getRouter = () => {
  // The server renders clean CHRISMED URLs through the existing /chrismed
  // route tree. Seed the same masked location before client hydration so the
  // browser keeps /internacional (etc.) without trying to hydrate a missing
  // top-level route.
  seedChrismedMaskedLocation();

  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
