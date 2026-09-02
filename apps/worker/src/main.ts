import http from "node:http";
import { createWorkerSupabase } from "./queue-client";
import { JobConsumer } from "./job-consumer";

const port = Number(process.env.WORKER_PORT || 3200);
const intervalMs = Number(process.env.WORKER_HEARTBEAT_MS || 60_000);
const gitSha = process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown";
const consumerEnabled = process.env.WORKER_CONSUMER_ENABLED !== "false";

let consumer: JobConsumer | null = null;
let consumerReady = false;

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      service: "impulsionando-worker",
      phase: 5,
      mode: consumerEnabled ? "queue-consumer" : "seed",
      gitSha,
      heartbeatMs: intervalMs,
      consumer: consumer?.getStats() ?? null,
    });
    return;
  }

  if (url.pathname === "/ready") {
    sendJson(res, 200, {
      ready: consumerReady || !consumerEnabled,
      service: "impulsionando-worker",
      consumerEnabled,
    });
    return;
  }

  sendJson(res, 404, {
    error: { code: "NOT_FOUND", message: "Worker exposes /health and /ready only" },
  });
});

server.listen(port, () => {
  console.log(
    JSON.stringify({
      ok: true,
      service: "impulsionando-worker",
      listening: port,
      gitSha,
      consumerEnabled,
      at: new Date().toISOString(),
    }),
  );
});

if (consumerEnabled) {
  try {
    const client = createWorkerSupabase();
    consumer = new JobConsumer(client, {
      batchSize: Number(process.env.WORKER_BATCH_SIZE || 5),
      visibilityTimeoutSeconds: Number(process.env.WORKER_VT_SECONDS || 30),
      pollIntervalMs: Number(process.env.WORKER_POLL_MS || 2_000),
    });
    consumer.start();
    consumerReady = true;
    console.log(
      JSON.stringify({
        ok: true,
        service: "impulsionando-worker",
        event: "consumer_started",
        at: new Date().toISOString(),
      }),
    );
  } catch (err) {
    consumerReady = false;
    console.error(
      JSON.stringify({
        ok: false,
        service: "impulsionando-worker",
        event: "consumer_start_failed",
        message: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      }),
    );
  }
}

function heartbeat() {
  console.log(
    JSON.stringify({
      ok: true,
      service: "impulsionando-worker",
      event: "heartbeat",
      phase: 5,
      mode: consumerEnabled ? "queue-consumer" : "seed",
      gitSha,
      stats: consumer?.getStats() ?? null,
      at: new Date().toISOString(),
    }),
  );
}

heartbeat();
setInterval(heartbeat, intervalMs);

process.on("SIGTERM", () => {
  consumer?.stop();
  server.close();
});
