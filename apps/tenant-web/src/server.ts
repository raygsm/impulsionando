/**
 * Phase 4B tenant-web runtime stub — independent process from legacy SSR monolith.
 * Serves health probes and hostname → tenant path resolution until TanStack routes migrate.
 */
import http from "node:http";
import { resolveTenantPathFromHost } from "@impulsionando/tenant-host";

const port = Number(process.env.TENANT_WEB_PORT || 3300);
const gitSha = process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown";

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const host = req.headers.host?.split(":")[0] || "";

  if (url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "impulsionando-tenant-web",
      phase: "4b",
      runtime: "tenant-web",
      gitSha,
    });
    return;
  }

  if (url.pathname === "/ready") {
    sendJson(res, 200, { ready: true, service: "impulsionando-tenant-web" });
    return;
  }

  const tenantPath = resolveTenantPathFromHost(host);
  const pilotSlug = process.env.TENANT_PILOT_SLUG || "csi";
  const csiPilot = tenantPath === "/csi" || pilotSlug === "csi";

  if (tenantPath === `/${pilotSlug}` || (csiPilot && tenantPath === "/csi")) {
    sendJson(res, 200, {
      runtime: "tenant-web",
      host,
      tenantPath: tenantPath || "/csi",
      pilot: "csi",
      mode: "7b-csi-pilot-stub",
      config: {
        schemaVersion: 1,
        branding: {
          tagline: "CSI — staging strangler stub (not full UI)",
          primary_color: "#0f172a",
          secondary_color: "#38bdf8",
        },
        locale: {
          country_code: "BR",
          locale: "pt-BR",
          currency_code: "BRL",
          timezone: "America/Sao_Paulo",
        },
      },
      message:
        "CSI Phase 7B stub — JSON only. Full /csi TanStack UI remains on legacy until vertical migrate or SSR promote.",
      gitSha,
    });
    return;
  }

  sendJson(res, 200, {
    runtime: "tenant-web",
    host,
    tenantPath,
    pathname: url.pathname,
    mode: "strangler-stub",
    message:
      "TanStack tenant routes remain on legacy monolith until vertical slice migration (4B-7).",
    gitSha,
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      ok: true,
      service: "impulsionando-tenant-web",
      listening: port,
      gitSha,
      at: new Date().toISOString(),
    }),
  );
});
