import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleN8nHmacVerifier } from "./lib/n8n-hmac-verifier.server";
import { toChrismedInternalPathname } from "./lib/chrismed-clean-paths";
import { canonicalTenantHostRedirect, tenantLandingTargetForHost, toColorsInternalPathname, toWmpInternalPathname } from "./lib/subdomain";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const CSP_DIRECTIVES = [
  "default-src 'self' https: data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://*.lovable.app https://*.lovable.dev https://sdk.mercadopago.com https://http2.mlstatic.com",
  "style-src 'self' 'unsafe-inline' https: data:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss: data: blob:",
  "media-src 'self' https: data: blob:",
  "frame-src 'self' https://meet.jit.si https:",
  "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https:",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Array<[string, string]> = [
  ["content-security-policy", CSP_DIRECTIVES],
  ["strict-transport-security", "max-age=63072000; includeSubDomains; preload"],
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "SAMEORIGIN"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=(self), interest-cohort=()'],
  ["cross-origin-opener-policy", "same-origin"],
  ["cross-origin-resource-policy", "same-site"],
  ["x-dns-prefetch-control", "on"],
  ["x-permitted-cross-domain-policies", "none"],
];

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of SECURITY_HEADERS) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isHtmlDocumentRequest(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") || accept.includes("application/xhtml+xml");
}

function wmpRootBootstrapResponse(request: Request): Response {
  const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WMP — Wagner Miller Produções</title><meta http-equiv="refresh" content="0;url=/wmp/"><script>location.replace("/wmp/"+location.search+location.hash)</script></head><body><main><p>WMP — Wagner Miller Produções</p><p><a href="/wmp/">Continuar para WMP</a></p></main></body></html>',
    { status: 200, headers },
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Keep the WMP deploy health gate on HTTP 200 while preventing the universal
      // app from hydrating the visible root path as Impulsionando. This tiny root
      // document never boots TanStack; it immediately moves the browser to /wmp/.
      if (
        isHtmlDocumentRequest(request) &&
        url.hostname.toLowerCase() === "wmp.impulsionando.com.br" &&
        (url.pathname === "/" || url.pathname === "")
      ) {
        return applySecurityHeaders(wmpRootBootstrapResponse(request));
      }

      const canonicalTenantUrl = canonicalTenantHostRedirect({
        hostname: url.hostname,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        protocol: url.protocol,
      });
      if (canonicalTenantUrl) {
        return applySecurityHeaders(Response.redirect(canonicalTenantUrl, 308));
      }

      if (url.pathname === "/api/public/hooks/n8n-verify") {
        return applySecurityHeaders(await handleN8nHmacVerifier(request));
      }

      const handler = await getServerEntry();
      let routedRequest = request;
      const tenantTarget = tenantLandingTargetForHost(url.host);
      const internalChrismedPathname = toChrismedInternalPathname(url.hostname, url.pathname);
      const internalColorsPathname = isHtmlDocumentRequest(request)
        ? toColorsInternalPathname(url.hostname, url.pathname)
        : url.pathname;
      const internalWmpPathname = isHtmlDocumentRequest(request)
        ? toWmpInternalPathname(url.hostname, url.pathname)
        : url.pathname;

      if (internalChrismedPathname !== url.pathname) {
        url.pathname = internalChrismedPathname;
        routedRequest = new Request(url, request);
      } else if (internalColorsPathname !== url.pathname) {
        url.pathname = internalColorsPathname;
        routedRequest = new Request(url, request);
      } else if (internalWmpPathname !== url.pathname) {
        url.pathname = internalWmpPathname;
        routedRequest = new Request(url, request);
      } else if ((url.pathname === "/" || url.pathname === "") && tenantTarget) {
        url.pathname = tenantTarget;
        routedRequest = new Request(url, request);
      }

      const response = await handler.fetch(routedRequest, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
