import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

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

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
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

/**
 * Cabeçalhos de segurança aplicados no servidor/CDN — reforço do que já
 * declaramos via <meta http-equiv> no __root. Cabeçalhos HTTP têm prioridade
 * sobre meta e cobrem diretivas que meta não aceita (frame-ancestors, HSTS,
 * X-Frame-Options, Cross-Origin-*). CSP mantém allowlist para GA4, Lovable e
 * Supabase; use 'report-only' temporariamente se precisar depurar bloqueios.
 */
const CSP_DIRECTIVES = [
  "default-src 'self' https: data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.lovable.app https://*.lovable.dev",
  "style-src 'self' 'unsafe-inline' https: data:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss: data: blob:",
  "media-src 'self' https: data: blob:",
  "frame-src 'self' https:",
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
  ["permissions-policy", "camera=(), microphone=(), geolocation=(self), interest-cohort=()"],
  ["cross-origin-opener-policy", "same-origin"],
  ["cross-origin-resource-policy", "same-site"],
  ["x-dns-prefetch-control", "on"],
  ["x-permitted-cross-domain-policies", "none"],
];

function applySecurityHeaders(response: Response): Response {
  // Não sobrescreve respostas já emitidas com headers específicos (webhooks,
  // downloads, redirects) — só adiciona quando ausentes.
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
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
