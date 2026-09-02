#!/usr/bin/env node
/**
 * Phase 4B Garrido resolve smoke — public resolve endpoint.
 */
const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);
const host = process.env.GARRIDO_SMOKE_HOST || "garrido.impulsionando.com.br";

async function main() {
  const url = `${base}/api/v1/tenants/resolve?host=${encodeURIComponent(host)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const body = await res.json();
  const tenant = body?.data;
  const pass =
    res.status === 200 &&
    tenant?.subdomain === "garrido" &&
    typeof tenant?.id === "string";

  console.log(
    JSON.stringify(
      {
        ok: pass,
        base,
        host,
        status: res.status,
        tenantId: tenant?.id ?? null,
        subdomain: tenant?.subdomain ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
