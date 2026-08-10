import { createBrowserHistory, type HistoryLocation, type RouterHistory } from "@tanstack/react-router";
import {
  isOfficialChrismedHost,
  toChrismedInternalPathname,
  toChrismedPublicPathname,
} from "./chrismed-clean-paths";

/**
 * Browser history adapter for the official CHRISMED host.
 *
 * TanStack Router always receives the internal `/chrismed/*` route tree while
 * the address bar, push/replace operations and popstate entries stay clean.
 * This keeps SSR hydration and browser navigation on the exact same route.
 */
export function createChrismedBrowserHistory(): RouterHistory | undefined {
  if (typeof window === "undefined" || !isOfficialChrismedHost(window.location.hostname)) {
    return undefined;
  }

  return createBrowserHistory({
    parseLocation: (): HistoryLocation => {
      const pathname = toChrismedInternalPathname(window.location.hostname, window.location.pathname);
      const search = window.location.search;
      const hash = window.location.hash;
      return {
        href: `${pathname}${search}${hash}`,
        pathname,
        search,
        hash,
        state: window.history.state,
      };
    },
    createHref: (href) => {
      const parsed = new URL(href, window.location.origin);
      const pathname = toChrismedPublicPathname(window.location.hostname, parsed.pathname);
      return `${pathname}${parsed.search}${parsed.hash}`;
    },
  });
}
