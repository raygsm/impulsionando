import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const CORE_HOSTS = new Set(["impulsionando.com.br", "www.impulsionando.com.br"]);
const CHRISMED_HOSTS = new Set(["agenda.chrismed.com.br", "www.agenda.chrismed.com.br"]);

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

function hostOf(request: Request) {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];
}

function rootPathOf(request: Request) {
  const path = new URL(request.url).pathname;
  return path === "/" || path === "/index.html";
}

function normalizeDomainResponse(request: Request, response: Response): Response {
  const host = hostOf(request);
  if (CHRISMED_HOSTS.has(host) && rootPathOf(request)) {
    const url = new URL(request.url);
    url.pathname = "/chrismed";
    url.search = "";
    return Response.redirect(url, 302);
  }

  if (response.status !== 404 || !CORE_HOSTS.has(host) || !rootPathOf(request)) {
    return response;
  }

  return new Response(
    "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/><title>Impulsionando Tecnologia</title><meta name=\"description\" content=\"Impulsionando Tecnologia — sistemas, automação e crescimento para empresas.\"/></head><body style=\"margin:0;font-family:Inter,Arial,sans-serif;background:#061a2f;color:#fff;display:grid;min-height:100vh;place-items:center\"><main style=\"max-width:720px;padding:32px;text-align:center\"><h1 style=\"font-size:42px;margin:0 0 16px\">Impulsionando Tecnologia</h1><p style=\"font-size:18px;line-height:1.6;color:#dbeafe\">Plataforma SaaS multiempresa para CRM, agenda, WhatsApp, pagamentos, BI e automação.</p><p><a href=\"/contato\" style=\"display:inline-block;margin-top:18px;padding:12px 18px;border-radius:10px;background:#f97316;color:#fff;text-decoration:none;font-weight:700\">Falar com a Impulsionando</a></p></main></body></html>",
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = normalizeDomainResponse(request, response);
      return await normalizeCatastrophicSsrResponse(normalized);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
