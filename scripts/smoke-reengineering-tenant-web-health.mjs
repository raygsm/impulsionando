#!/usr/bin/env node
/**
 * Phase 4B tenant-web health smoke (local or staging base URL).
 *
 * Local / Swarm-direct: Host override → garrido → tenantPath=/garrido.
 * Public https://tenant.stg…: fetch cannot override Host; Traefik only matches
 * Host(tenant.stg…); accept strangler stub for that host as public liveness.
 * Garrido Host routing remains proven on dokploy-network (SSH/curl).
 *
 * When tenant.stg is behind Traefik basic auth, set STAGING_BASIC_AUTH_USER +
 * STAGING_BASIC_AUTH_PASS (e.g. from ~/.config/impulsionando/staging-operator-secrets.env).
 * Basic Authorization does not break public Host matching (Host comes from the URL).
 * Manual alternative: curl -u USER:PASS https://tenant.stg…/health
 * Do NOT put Basic on api.stg Bearer JWT smokes — API is ungated by design.
 */
const base = (process.env.TENANT_WEB_BASE || "http://127.0.0.1:3300").replace(/\/$/, "");

function basicAuthHeaders() {
  const user = process.env.STAGING_BASIC_AUTH_USER;
  const pass = process.env.STAGING_BASIC_AUTH_PASS;
  if (!user || !pass) return {};
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function main() {
  const authHeaders = basicAuthHeaders();
  const healthRes = await fetch(`${base}/health`, { headers: { ...authHeaders } });
  const health = await healthRes.json();
  const hostRes = await fetch(`${base}/`, {
    headers: { host: "garrido.impulsionando.com.br", ...authHeaders },
  });
  const hostBody = await hostRes.json();

  const healthOk =
    healthRes.status === 200 && health?.service === "impulsionando-tenant-web";
  const garridoHostOk =
    hostRes.status === 200 && hostBody?.tenantPath === "/garrido";
  const stagingPublicStubOk =
    hostRes.status === 200 &&
    hostBody?.host === "tenant.stg.impulsionando.com.br" &&
    hostBody?.tenantPath === "/vitrine/tenant" &&
    hostBody?.mode === "strangler-stub";
  const ok = healthOk && (garridoHostOk || stagingPublicStubOk);

  console.log(
    JSON.stringify(
      {
        ok,
        base,
        basicAuthUsed: Boolean(authHeaders.Authorization),
        health: { status: healthRes.status, service: health?.service, gitSha: health?.gitSha },
        hostProbe: {
          status: hostRes.status,
          host: hostBody?.host,
          tenantPath: hostBody?.tenantPath,
          mode: hostBody?.mode,
          garridoHostOk,
          stagingPublicStubOk,
        },
      },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
