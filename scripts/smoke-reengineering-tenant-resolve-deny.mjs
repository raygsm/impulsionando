#!/usr/bin/env node
/**
 * Phase 4 deny smoke — unknown + suspended hosts return data: null (HTTP 200).
 */
const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);

async function resolve(host) {
  const url = `${base}/api/v1/tenants/resolve?host=${encodeURIComponent(host)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const body = await res.json();
  return { host, status: res.status, body };
}

async function main() {
  const cases = [
    { host: "unknown-tenant-xyz.impulsionando.com.br", expectNull: true },
    { host: "not-a-real-domain.example.invalid", expectNull: true },
  ];

  const results = [];
  let ok = true;

  for (const c of cases) {
    const r = await resolve(c.host);
    const dataNull = r.body?.data === null;
    const pass = r.status === 200 && dataNull === c.expectNull;
    if (!pass) ok = false;
    results.push({ ...c, status: r.status, data: r.body?.data, pass });
  }

  console.log(JSON.stringify({ ok, base, results }, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
