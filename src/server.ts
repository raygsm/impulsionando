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

const WMP_GLOBAL_PATHS = new Set([
  "/auth",
  "/dashboard",
  "/seguranca/senha",
  "/reset-password",
  "/reset-password-sent",
]);

const WMP_BYPASS_PREFIXES = [
  "/api/",
  "/assets/",
  "/.well-known/",
  "/favicon",
  "/robots",
  "/sitemap",
  "/manifest",
];

function shouldBootstrapWmpDocument(url: URL, request: Request): boolean {
  if (!isHtmlDocumentRequest(request)) return false;
  if (url.hostname.toLowerCase() !== "wmp.impulsionando.com.br") return false;
  const path = url.pathname || "/";

  // Root is intentionally NOT bootstrapped. The server internally renders /wmp
  // while the browser remains on the clean WMP root. The client root route is
  // host-locked to render WMP, so SSR and hydration stay on the same brand/front.
  if (path === "/") return false;

  if (path === "/wmp" || path.startsWith("/wmp/")) return false;
  if (WMP_GLOBAL_PATHS.has(path)) return false;
  if (WMP_BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  return true;
}

function wmpBootstrapResponse(request: Request, url: URL): Response {
  const cleanPath = url.pathname || "/";
  const targetPath = cleanPath === "/" ? "/wmp/" : `/wmp${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
  const target = `${targetPath}${url.search}${url.hash}`;
  const escapedTarget = JSON.stringify(target);
  const escapedHref = target.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WMP — Wagner Miller Produções</title><meta http-equiv="refresh" content="0;url=${escapedHref}"><script>location.replace(${escapedTarget})</script></head><body><main><p>WMP — Wagner Miller Produções</p><p><a href="${escapedHref}">Continuar para WMP</a></p></main></body></html>`,
    { status: 200, headers },
  );
}

function wmpDomainLockResponse(request: Request): Response {
  const headers = {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store, max-age=0",
  };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(
    "WMP_DOMAIN_LOCK_RELEASE=2026-08-18-v2\nWMP_CANONICAL_HOST=wmp.impulsionando.com.br\nWMP_DOMAIN_ISOLATION=ENFORCED\nWMP_ROOT_HYDRATION=HOST_LOCKED\n",
    { status: 200, headers },
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      if (
        url.hostname.toLowerCase() === "wmp.impulsionando.com.br" &&
        url.pathname === "/wmp-domain-lock.txt" &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        return applySecurityHeaders(wmpDomainLockResponse(request));
      }

      if (shouldBootstrapWmpDocument(url, request)) {
        return applySecurityHeaders(wmpBootstrapResponse(request, url));
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
