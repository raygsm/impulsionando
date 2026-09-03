#!/usr/bin/env node
/**
 * Phase 5B smoke — publish job via API, wait for worker effect ledger row.
 *
 * Requires migration 20260902130000_phase5b_* applied on staging.
 * Worker must be running with WORKER_CONSUMER_ENABLED=true.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { readEffectRow, workerLogsMentionJob } from "./lib/phase5-effect-proof.mjs";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const DEFAULT_TENANT = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);
const tenantId = process.env.JOB_SMOKE_TENANT_ID || DEFAULT_TENANT;
const waitMs = Number(process.env.JOB_SMOKE_WAIT_MS || 15_000);

function assertStaging() {
  const url = process.env.SUPABASE_URL || "";
  if (url.includes(PROD_REF)) throw new Error("Refusing prod Supabase for job smoke");
  if (!url.includes(STAGING_REF)) {
    console.warn("WARN: SUPABASE_URL does not match known staging ref");
  }
}

async function getAccessToken() {
  const direct = process.env.JOB_SMOKE_ACCESS_TOKEN || process.env.TENANT_MEMBERSHIP_SMOKE_ACCESS_TOKEN;
  if (direct) return direct;

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!email || !password || !url || !anon) {
    throw new Error("Set JOB_SMOKE_ACCESS_TOKEN or TEST_USER_EMAIL + TEST_USER_PASSWORD");
  }

  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) throw error || new Error("AUTH_FAILED");
  return data.session.access_token;
}

async function main() {
  assertStaging();
  const token = await getAccessToken();
  const idempotencyKey = `phase5b-smoke-${randomUUID()}`;
  const correlationId = randomUUID();
  const scopeKey = `${tenantId}:reengineering.smoke.echo:${idempotencyKey}`;

  const enqueueRes = await fetch(`${base}/api/v1/jobs/enqueue`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      "x-correlation-id": correlationId,
    },
    body: JSON.stringify({
      type: "reengineering.smoke.echo",
      tenantId,
      payload: { smoke: true },
    }),
  });

  const enqueueBody = await enqueueRes.json();
  if (enqueueRes.status !== 202) {
    console.log(JSON.stringify({ ok: false, step: "enqueue", status: enqueueRes.status, enqueueBody }, null, 2));
    process.exit(1);
  }

  const jobId = enqueueBody?.data?.jobId;
  const admin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const started = Date.now();
  let effect = null;
  let proof = "none";
  let readError = null;
  while (Date.now() - started < waitMs) {
    const got = await readEffectRow(admin, scopeKey);
    readError = got.error;
    if (got.row) {
      effect = got.row;
      proof = got.source;
      break;
    }
    if (jobId && workerLogsMentionJob(jobId)) {
      effect = { job_id: jobId, scope_key: scopeKey, effect_type: "reengineering.smoke.echo" };
      proof = "worker_log";
      break;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }

  const ok = Boolean(effect && effect.job_id === jobId);
  console.log(
    JSON.stringify(
      {
        ok,
        base,
        tenantId,
        jobId,
        scopeKey,
        effect,
        proof,
        readError,
        waitedMs: Date.now() - started,
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
