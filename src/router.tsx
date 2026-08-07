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
        if (url.hostname.toLowerCase() !== CHRISMED_HOST) return url;
        const internalPath = chrismedInternalPathForPublicPath(url.pathname);
        if (internalPath) url.pathname = internalPath;
        return url;
      },
      output: ({ url }) => {
        if (url.hostname.toLowerCase() !== CHRISMED_HOST) return url;
        if (url.pathname === "/chrismed" || url.pathname.startsWith("/chrismed/")) {
          url.pathname = url.pathname.slice("/chrismed".length) || "/";
        }
        return url;
      },
    },
  });

  return router;
};
