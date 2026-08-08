import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import {
  tenantInternalPathForPublicPath,
  tenantPublicPathForInternalPath,
} from "./lib/subdomain";
import { routeTree } from "./routeTree.gen";

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
        // TanStack builds relative URLs with a synthetic hostname. The actual
        // browser hostname is authoritative for dedicated tenant routing.
        const internalPath = tenantInternalPathForPublicPath(window.location.hostname, url.pathname);
        if (internalPath) url.pathname = internalPath;
        return url;
      },
      output: ({ url }) => {
        // Keep every dedicated tenant URL clean at navigation time. Internal
        // route prefixes remain an implementation detail and never flash in
        // the address bar (for example /chrismed/agendar -> /agendar).
        if (typeof window === "undefined") return url;
        const publicPath = tenantPublicPathForInternalPath(window.location.hostname, url.pathname);
        if (publicPath) url.pathname = publicPath;
        return url;
      },
    },
  });

  return router;
};
