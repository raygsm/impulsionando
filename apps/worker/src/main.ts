/**
 * Phase 5 worker seed — independent process heartbeat.
 * No queue consumer yet; proves separate runtime from SSR/API.
 */
const intervalMs = Number(process.env.WORKER_HEARTBEAT_MS || 60_000);
const gitSha = process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown";

function heartbeat() {
  const payload = {
    ok: true,
    service: "impulsionando-worker",
    phase: 5,
    mode: "seed",
    gitSha,
    at: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

heartbeat();
setInterval(heartbeat, intervalMs);
