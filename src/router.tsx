import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createWhiteLabelBrowserHistory } from "./lib/white-label-clean-routes";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    history: createWhiteLabelBrowserHistory(),
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
