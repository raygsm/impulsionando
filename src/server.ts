import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleN8nHmacVerifier } from "./lib/n8n-hmac-verifier.server";
import { toChrismedInternalPathname } from "./lib/chrismed-clean-paths";
import { canonicalTenantHostRedirect, tenantLandingTargetForHost, toColorsInternalPathname, toWmpInternalPathname } from "./lib/subdomain";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const WMP_CANONICAL_HOST = "wmp.impulsionando.com.br";

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

function wmpDomainLockResponse(request: Request): Response {
  const headers = {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store, max-age=0",
    "x-wmp-redirect-policy": "deny-all",
  };
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(
    "WMP_DOMAIN_LOCK_RELEASE=2026-08-19-v3\nWMP_CANONICAL_HOST=wmp.impulsionando.com.br\nWMP_DOMAIN_ISOLATION=ENFORCED\nWMP_ROOT_HYDRATION=HOST_LOCKED\nWMP_REDIRECT_POLICY=DENY_ALL\n",
    { status: 200, headers },
  );
}

function enforceWmpNoRedirect(hostname: string, response: Response): Response {
  if (hostname.toLowerCase() !== WMP_CANONICAL_HOST) return response;

  const headers = new Headers(response.headers);
  headers.set("x-wmp-redirect-policy", "deny-all");

  if (response.status >= 300 && response.status < 400) {
    headers.delete("location");
    headers.set("content-type", "text/plain; charset=utf-8");
    headers.set("cache-control", "no-store");
    return new Response("WMP navigation blocked by redirect policy.", {
      status: 409,
      headers,
    });
  }

  headers.delete("location");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const originalUrl = new URL(request.url);
      const isWmpHost = originalUrl.hostname.toLowerCase() === WMP_CANONICAL_HOST;

      if (
        isWmpHost &&
        originalUrl.pathname === "/wmp-domain-lock.txt" &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        return applySecurityHeaders(wmpDomainLockResponse(request));
      }

      // Absolute WMP rule: never canonicalize, bootstrap, meta-refresh, or issue
      // any HTTP redirect. Clean WMP URLs are mapped only through an internal
      // request rewrite, so the browser location remains untouched.
      if (!isWmpHost) {
        const canonicalTenantUrl = canonicalTenantHostRedirect({
          hostname: originalUrl.hostname,
          pathname: originalUrl.pathname,
          search: originalUrl.search,
          hash: originalUrl.hash,
          protocol: originalUrl.protocol,
        });
        if (canonicalTenantUrl) {
          return applySecurityHeaders(Response.redirect(canonicalTenantUrl, 308));
        }
      }

      if (originalUrl.pathname === "/api/public/hooks/n8n-verify") {
        const hookResponse = await handleN8nHmacVerifier(request);
        return applySecurityHeaders(enforceWmpNoRedirect(originalUrl.hostname, hookResponse));
      }

      const handler = await getServerEntry();
      const routedUrl = new URL(originalUrl);
      let routedRequest = request;
      const tenantTarget = tenantLandingTargetForHost(routedUrl.host);
      const internalChrismedPathname = toChrismedInternalPathname(routedUrl.hostname, routedUrl.pathname);
      const internalColorsPathname = isHtmlDocumentRequest(request)
        ? toColorsInternalPathname(routedUrl.hostname, routedUrl.pathname)
        : routedUrl.pathname;
      const internalWmpPathname = isHtmlDocumentRequest(request)
        ? toWmpInternalPathname(routedUrl.hostname, routedUrl.pathname)
        : routedUrl.pathname;

      if (internalChrismedPathname !== routedUrl.pathname) {
        routedUrl.pathname = internalChrismedPathname;
        routedRequest = new Request(routedUrl, request);
      } else if (internalColorsPathname !== routedUrl.pathname) {
        routedUrl.pathname = internalColorsPathname;
        routedRequest = new Request(routedUrl, request);
      } else if (internalWmpPathname !== routedUrl.pathname) {
        routedUrl.pathname = internalWmpPathname;
        routedRequest = new Request(routedUrl, request);
      } else if ((routedUrl.pathname === "/" || routedUrl.pathname === "") && tenantTarget) {
        routedUrl.pathname = tenantTarget;
        routedRequest = new Request(routedUrl, request);
      }

      const response = await handler.fetch(routedRequest, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      const wmpLocked = enforceWmpNoRedirect(originalUrl.hostname, normalized);
      return applySecurityHeaders(wmpLocked);
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
