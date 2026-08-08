import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { chrismedRouteRewrite } from "./lib/chrismed-route-rewrite";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    rewrite: chrismedRouteRewrite,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
