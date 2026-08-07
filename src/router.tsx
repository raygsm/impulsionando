import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { chrismedInternalPathForPublicPath } from "./lib/subdomain";
import { routeTree } from "./routeTree.gen";

const CHRISMED_HOST = "chrismed.impulsionando.com.br";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    rewrite: {
      input: ({ url }) => {
        // SSR already receives an internally rewritten request from server.ts.
        // Applying the same rewrite there makes React Start redirect the public
        // URL to itself. The browser alone needs this translation for hydration.
        if (typeof window === "undefined") return url;
        if (url.hostname.toLowerCase() !== CHRISMED_HOST) return url;
        const internalPath = chrismedInternalPathForPublicPath(url.pathname);
        if (internalPath) url.pathname = internalPath;
        return url;
      },
    },
  });

  return router;
};
