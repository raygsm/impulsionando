import http from "node:http";
import { createWorkerSupabase } from "./queue-client";
import { JobConsumer } from "./job-consumer";
import { OutboxPoller } from "./outbox-poller";
import {
  getJourneyHandlerStats,
  startJourneyHandlerIfEnabled,
  stopJourneyHandler,
} from "./journeys/handler";

const port = Number(process.env.WORKER_PORT || 3200);
const intervalMs = Number(process.env.WORKER_HEARTBEAT_MS || 60_000);
const gitSha = process.env.GIT_SHA || process.env.GITHUB_SHA || "unknown";
const consumerEnabled = process.env.WORKER_CONSUMER_ENABLED !== "false";
/** Phase 5C — default off; does not interfere with 5B job consumer.
 * Safe if enabled before DDL: poller degrades (log once) until RPC exists. */
const outboxEnabled = process.env.WORKER_OUTBOX_ENABLED === "true";
/** Phase 5E — default off; does not change 5B job consumer behavior.
 * Delivery ledger miss: log once, sink continues. */
const communicationEnabled = process.env.WORKER_COMMUNICATION_ENABLED === "true";
/** Phase 5F — default off; journey sink/noop only. */
const journeyEnabled = process.env.WORKER_JOURNEY_ENABLED === "true";

let consumer: JobConsumer | null = null;
let outboxPoller: OutboxPoller | null = null;
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
      outbox: outboxEnabled
        ? { enabled: true, ...(outboxPoller?.getStats() ?? {}) }
        : { enabled: false },
      communicationEnabled,
      journey: journeyEnabled ? getJourneyHandlerStats() : { enabled: false },
    });
    return;
  }

  if (url.pathname === "/ready") {
    sendJson(res, 200, {
      ready: consumerReady || !consumerEnabled,
      service: "impulsionando-worker",
      consumerEnabled,
      outboxEnabled,
      communicationEnabled,
      journeyEnabled,
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
      outboxEnabled,
      communicationEnabled,
      journeyEnabled,
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

if (outboxEnabled) {
  try {
    const client = createWorkerSupabase();
    outboxPoller = new OutboxPoller(client, {
      batchSize: Number(process.env.WORKER_OUTBOX_BATCH_SIZE || 10),
      pollIntervalMs: Number(process.env.WORKER_OUTBOX_POLL_MS || 3_000),
    });
    outboxPoller.start();
    console.log(
      JSON.stringify({
        ok: true,
        service: "impulsionando-worker",
        event: "outbox_poller_started",
        at: new Date().toISOString(),
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        ok: false,
        service: "impulsionando-worker",
        event: "outbox_poller_start_failed",
        message: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      }),
    );
  }
}

if (journeyEnabled) {
  startJourneyHandlerIfEnabled();
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
      outbox: outboxEnabled
        ? { enabled: true, ...(outboxPoller?.getStats() ?? {}) }
        : { enabled: false },
      communicationEnabled,
      journey: journeyEnabled ? getJourneyHandlerStats() : { enabled: false },
      at: new Date().toISOString(),
    }),
  );
}

heartbeat();
setInterval(heartbeat, intervalMs);

process.on("SIGTERM", () => {
  consumer?.stop();
  outboxPoller?.stop();
  stopJourneyHandler();
  server.close();
});
