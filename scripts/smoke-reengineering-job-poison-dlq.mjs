#!/usr/bin/env node
/**
 * Phase 5B smoke — invalid envelope → reengineering_jobs_dlq.
 *
 * Default: DRY_RUN=1 — prints intended poison enqueue + verify steps (no RPC, no SSH).
 * Live (staging only): DRY_RUN=0 enqueues poison via service_role RPC
 *   enqueue_reengineering_job, then optionally checks worker /health dlq counter.
 *
 * Requires migration 20260902130000_phase5b_* on staging. Prefer not SSH;
 * set PHASE5B_DLQ_VERIFY_SSH=1 only if worker health is unreachable otherwise.
 * Never targets prod. Never prints secrets.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { workerHealth } from "./lib/phase5-effect-proof.mjs";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const DLQ_QUEUE = "reengineering_jobs_dlq";
const DLQ_REASON = "INVALID_ENVELOPE";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

const dryRun = process.env.DRY_RUN !== "0";
const waitMs = Number(process.env.JOB_SMOKE_WAIT_MS || 20_000);
const verifySsh = process.env.PHASE5B_DLQ_VERIFY_SSH === "1";
const poisonMarker = `phase5b-poison-${randomUUID()}`;

function assertStaging() {
  const url = process.env.SUPABASE_URL || "";
  if (url.includes(PROD_REF)) throw new Error("Refusing prod Supabase for poison/DLQ smoke");
  if (url && !url.includes(STAGING_REF)) {
    console.warn("WARN: SUPABASE_URL does not match known staging ref");
  }
}

function poisonPayload() {
  // Intentionally fails JobEnvelopeSchema (missing required fields / wrong shape).
  return {
    poison: true,
    marker: poisonMarker,
    type: "reengineering.smoke.echo",
    note: "invalid-envelope-for-dlq",
  };
}

async function main() {
  assertStaging();

  const plan = {
    ok: true,
    dryRun,
    targetQueue: "reengineering_jobs",
    expectedDlqQueue: DLQ_QUEUE,
    expectedDlqReason: DLQ_REASON,
    rpc: "enqueue_reengineering_job",
    poisonShape: {
      poison: true,
      marker: "<uuid>",
      type: "reengineering.smoke.echo",
      note: "invalid-envelope-for-dlq",
    },
    verify: {
      preferred: "worker /health consumer.dlq increments (internal; optional SSH)",
      sshGate: "PHASE5B_DLQ_VERIFY_SSH=1",
      localContract: "npm run test:phase5b:contracts — JQ-05/JQ-08",
    },
    notes: [
      "Invalid envelope moves to DLQ immediately (no attempt budget)",
      "Do not apply ledger GRANT or this smoke to prod",
      "DRY_RUN=1 default — no queue mutation",
    ],
  };

  if (dryRun) {
    console.log(JSON.stringify({ ...plan, message: "DRY_RUN=1 — no RPC / no SSH" }, null, 2));
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.staging (values never logged)",
      }),
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let dlqBefore = null;
  if (verifySsh) {
    try {
      const health = workerHealth();
      dlqBefore = health?.consumer?.dlq ?? health?.dlq ?? null;
    } catch (err) {
      console.log(
        JSON.stringify({
          ok: false,
          step: "health_before",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      process.exit(1);
    }
  }

  const payload = poisonPayload();
  const { data: msgId, error: enqueueError } = await admin.rpc("enqueue_reengineering_job", {
    payload,
  });
  if (enqueueError) {
    console.log(
      JSON.stringify({
        ok: false,
        step: "enqueue_poison",
        error: enqueueError.code || enqueueError.message,
      }),
    );
    process.exit(1);
  }

  let dlqAfter = null;
  let proof = "enqueued_only";
  if (verifySsh) {
    const started = Date.now();
    while (Date.now() - started < waitMs) {
      try {
        const health = workerHealth();
        dlqAfter = health?.consumer?.dlq ?? health?.dlq ?? null;
        if (typeof dlqBefore === "number" && typeof dlqAfter === "number" && dlqAfter > dlqBefore) {
          proof = "worker_health_dlq_increment";
          break;
        }
      } catch {
        // keep waiting
      }
      await new Promise((r) => setTimeout(r, 1_000));
    }
  } else {
    proof = "enqueued_no_ssh_verify";
    await new Promise((r) => setTimeout(r, 2_000));
  }

  const ok =
    proof === "worker_health_dlq_increment" ||
    (proof === "enqueued_no_ssh_verify" && msgId != null);

  console.log(
    JSON.stringify(
      {
        ok,
        dryRun: false,
        msgId,
        poisonMarker,
        expectedDlqQueue: DLQ_QUEUE,
        expectedDlqReason: DLQ_REASON,
        dlqBefore,
        dlqAfter,
        proof,
        verifySsh,
        note:
          proof === "enqueued_no_ssh_verify"
            ? "Poison enqueued; set PHASE5B_DLQ_VERIFY_SSH=1 to assert worker dlq counter, or check worker logs"
            : undefined,
      },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
