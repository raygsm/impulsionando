import { createBrowserHistory, type HistoryLocation, type RouterHistory } from "@tanstack/react-router";
import { isOfficialChrismedHost, toChrismedInternalPathname, toChrismedPublicPathname } from "./chrismed-clean-paths";
import { isOfficialGrupoEvrHost, toGrupoEvrInternalPathname, toGrupoEvrPublicPathname } from "./grupo-evr-clean-paths";

/** Keeps white-label tenant URLs clean while TanStack Router uses the internal route tree. */
export function createWhiteLabelBrowserHistory(): RouterHistory | undefined {
  if (typeof window === "undefined") return undefined;

  const hostname = window.location.hostname;
  const isChrismed = isOfficialChrismedHost(hostname);
  const isGrupoEvr = isOfficialGrupoEvrHost(hostname);
  if (!isChrismed && !isGrupoEvr) return undefined;

  return createBrowserHistory({
    parseLocation: (): HistoryLocation => {
      const search = window.location.search;
      const hash = window.location.hash;
      const explicitPortugueseGms =
        isChrismed && window.location.pathname === "/" && new URLSearchParams(search).get("lang") === "pt";
      const pathname = explicitPortugueseGms
        ? "/chrismed/internacional"
        : isChrismed
          ? toChrismedInternalPathname(hostname, window.location.pathname)
          : toGrupoEvrInternalPathname(hostname, window.location.pathname);

      return { href: `${pathname}${search}${hash}`, pathname, search, hash, state: window.history.state };
    },
    createHref: (href) => {
      const parsed = new URL(href, window.location.origin);
      const pathname = isChrismed
        ? toChrismedPublicPathname(hostname, parsed.pathname)
        : toGrupoEvrPublicPathname(hostname, parsed.pathname);
      return `${pathname}${parsed.search}${parsed.hash}`;
    },
  });
}
