import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { renderEmergencyHomePage } from "./lib/emergency-home-page";

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

function isDocumentRequest(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const url = new URL(request.url);
  const isStaticOrApi =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/__l5e/");
  if (isStaticOrApi) return false;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html") || accept === "" || accept.includes("*/*");
}

async function normalizeUnexpectedNotFoundResponse(
  request: Request,
  response: Response,
): Promise<Response> {
  if (response.status !== 404 || !isDocumentRequest(request)) return response;

  const url = new URL(request.url);
  const body = await response.clone().text();
  const genericNotFound = body.trim().toLowerCase() === "404 page not found";
  if (url.pathname !== "/" && !genericNotFound) return response;

  console.error(
    new Error(`SSR returned a generic 404 for ${url.pathname}; serving emergency home fallback.`),
  );
  return new Response(renderEmergencyHomePage(), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, must-revalidate",
    },
  });
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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizedNotFound = await normalizeUnexpectedNotFoundResponse(request, response);
      return await normalizeCatastrophicSsrResponse(normalizedNotFound);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
