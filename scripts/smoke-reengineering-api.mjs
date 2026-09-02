#!/usr/bin/env node
/**
 * Phase 3 smoke — Nest Support API on staging edge.
 * Default: https://api.stg.impulsionando.com.br
 * Override: PHASE3_API_BASE=http://127.0.0.1:3100
 */
const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);

async function getJson(path) {
  const res = await fetch(`${base}${path}`, {
    headers: { accept: "application/json" },
    redirect: "follow",
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body };
}

async function main() {
  const health = await getJson("/health");
  const ready = await getJson("/health/ready");
  const ok =
    health.status === 200 &&
    health.body?.ok === true &&
    health.body?.service === "impulsionando-api" &&
    ready.status === 200 &&
    ready.body?.ready === true;

  console.log(
    JSON.stringify(
      {
        ok,
        base,
        health,
        ready,
      },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
