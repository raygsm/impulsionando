#!/usr/bin/env node
/**
 * Phase 5D smoke skeleton — secure webhook ingress (DO NOT run live against real providers).
 *
 * Operator (staging only, after migration + API deploy):
 * 1. Apply supabase/migrations/20260902210000_phase5d_webhook_ingress.sql on staging.
 * 2. Set WEBHOOK_SECRET_REENGINEERING_SMOKE on the API (env name only in docs — never commit value).
 * 3. Export DRY_RUN=0 and STAGING vars, then run this script against api.stg only.
 *
 * Default: DRY_RUN=1 — prints the intended request shape without sending.
 * Never points at production providers. Never prints secret values.
 */
import { createHmac, createHash, randomUUID } from "node:crypto";

const STAGING_API_DEFAULT = "https://api.stg.impulsionando.com.br";
const PROVIDER = "reengineering.smoke";
const SECRET_ENV = "WEBHOOK_SECRET_REENGINEERING_SMOKE";

const dryRun = process.env.DRY_RUN !== "0";
const base = (process.env.PHASE3_API_BASE || STAGING_API_DEFAULT).replace(/\/$/, "");

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function sign(secret, timestampSeconds, rawBody) {
  return createHmac("sha256", secret).update(`${timestampSeconds}.${rawBody}`).digest("hex");
}

function assertNotProdProviderUrl(url) {
  // Guardrail: this smoke only targets Impulsionando staging API, never third-party provider URLs.
  if (/mercadopago|stripe|paddle|meta\.com|graph\.facebook|evolution/i.test(url)) {
    throw new Error("Refusing to send webhook smoke to an external provider URL");
  }
  if (!url.includes("stg.impulsionando") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    console.warn("WARN: target does not look like staging/local API");
  }
}

async function main() {
  assertNotProdProviderUrl(base);

  const timestampSeconds = Math.floor(Date.now() / 1000);
  const idempotencyKey = `phase5d-smoke-${randomUUID()}`;
  const correlationId = randomUUID();
  const bodyObj = { event: "reengineering.webhook.smoke", smoke: true };
  const rawBody = JSON.stringify(bodyObj);

  const plan = {
    ok: true,
    dryRun,
    method: "POST",
    url: `${base}/api/v1/webhooks/${PROVIDER}`,
    headers: {
      "content-type": "application/json",
      "x-webhook-timestamp": String(timestampSeconds),
      "x-webhook-idempotency-key": idempotencyKey,
      "x-correlation-id": correlationId,
      "x-webhook-signature": "sha256=<computed-from-env-secret>",
    },
    bodySha256: sha256Hex(rawBody),
    secretEnvName: SECRET_ENV,
    expectedStatus: 202,
    notes: [
      "Signature = HMAC-SHA256(secret, `${timestamp}.${rawBody}`) as hex with sha256= prefix",
      "Duplicate POST with same idempotency key must return 409 REPLAY_DUPLICATE",
      "Stale timestamp beyond 300s must return 400 STALE_TIMESTAMP",
      "Do not apply migration to prod; do not send to real providers",
    ],
  };

  if (dryRun) {
    console.log(JSON.stringify({ ...plan, message: "DRY_RUN=1 — no HTTP request sent" }, null, 2));
    return;
  }

  const secret = process.env[SECRET_ENV];
  if (!secret) {
    console.log(
      JSON.stringify({
        ok: false,
        error: `Set ${SECRET_ENV} (value never logged) or keep DRY_RUN=1`,
      }),
    );
    process.exit(1);
  }

  const signature = sign(secret, timestampSeconds, rawBody);
  const res = await fetch(plan.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-timestamp": String(timestampSeconds),
      "x-webhook-idempotency-key": idempotencyKey,
      "x-correlation-id": correlationId,
      "x-webhook-signature": `sha256=${signature}`,
    },
    body: rawBody,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  console.log(
    JSON.stringify(
      {
        ok: res.status === 202,
        status: res.status,
        correlationId,
        idempotencyKey,
        bodySha256: plan.bodySha256,
        response: json,
      },
      null,
      2,
    ),
  );
  process.exit(res.status === 202 ? 0 : 1);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
