#!/usr/bin/env node
/**
 * Phase 4 seed smoke — tenant resolve on Nest API.
 * Default: https://api.stg.impulsionando.com.br
 */
const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);
const host = process.env.TENANT_RESOLVE_HOST || "chrismed.impulsionando.com.br";

async function main() {
  const url = `${base}/api/v1/tenants/resolve?host=${encodeURIComponent(host)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const body = await res.json();
  const unavailable =
    res.status === 503 && body?.error?.code === "TENANT_RESOLVE_UNAVAILABLE";
  const ok = res.status === 200 && typeof body?.meta?.correlationId === "string";
  console.log(
    JSON.stringify(
      {
        ok,
        blocked: unavailable,
        status: res.status,
        host,
        body,
        ...(unavailable
          ? {
              next: "Apply scripts/staging/phase4-resolve-tenant-rpc.sql — see docs/reengineering/04-migration/phase-4/STAGING-RPC-APPLY.md",
            }
          : {}),
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
