#!/usr/bin/env node
/**
 * Phase 5A worker health smoke (local or staging base URL).
 */
const base = (process.env.WORKER_BASE || "http://127.0.0.1:3200").replace(/\/$/, "");

async function main() {
  const healthRes = await fetch(`${base}/health`);
  const readyRes = await fetch(`${base}/ready`);
  const health = await healthRes.json();
  const ready = await readyRes.json();

  const ok =
    healthRes.status === 200 &&
    readyRes.status === 200 &&
    health?.service === "impulsionando-worker" &&
    ready?.ready === true;

  console.log(JSON.stringify({ ok, base, health, ready }, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
