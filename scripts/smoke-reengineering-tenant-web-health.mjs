#!/usr/bin/env node
/**
 * Phase 4B tenant-web health smoke (local or staging base URL).
 */
const base = (process.env.TENANT_WEB_BASE || "http://127.0.0.1:3300").replace(/\/$/, "");

async function main() {
  const healthRes = await fetch(`${base}/health`);
  const health = await healthRes.json();
  const hostRes = await fetch(`${base}/`, {
    headers: { host: "garrido.impulsionando.com.br" },
  });
  const hostBody = await hostRes.json();

  const ok =
    healthRes.status === 200 &&
    health?.service === "impulsionando-tenant-web" &&
    hostRes.status === 200 &&
    hostBody?.tenantPath === "/garrido";

  console.log(
    JSON.stringify(
      {
        ok,
        base,
        health: { status: healthRes.status, service: health?.service },
        garrido: { tenantPath: hostBody?.tenantPath },
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
