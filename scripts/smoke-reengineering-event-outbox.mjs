#!/usr/bin/env node
/**
 * Phase 5C smoke — local contracts by default; live staging when PHASE5C_SMOKE_LIVE=1.
 *
 * Live: create Support ticket on api.stg → assert reengineering_event_outbox row
 * (pending or published) for correlationId. Staging project only.
 * Never prints secrets.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const live = process.env.PHASE5C_SMOKE_LIVE === "1";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);

function assertStaging() {
  const url = process.env.SUPABASE_URL || "";
  if (url.includes(PROD_REF)) throw new Error("Refusing prod Supabase");
  if (!url.includes(STAGING_REF)) {
    console.warn("WARN: SUPABASE_URL does not match known staging ref");
  }
  if (!base.includes("stg.impulsionando") && !base.includes("localhost")) {
    console.warn("WARN: PHASE3_API_BASE does not look like staging/local");
  }
}

async function getAccessToken() {
  const direct =
    process.env.JOB_SMOKE_ACCESS_TOKEN ||
    process.env.SUPPORT_SMOKE_ACCESS_TOKEN ||
    process.env.PHASE5G_OPS_BEARER;
  if (direct) return direct;
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!email || !password || !url || !anon) {
    throw new Error("Need access token or TEST_USER_EMAIL/PASSWORD + anon");
  }
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) throw error || new Error("AUTH_FAILED");
  return data.session.access_token;
}

async function waitForOutbox(correlationId, waitMs) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for outbox assert");
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    const { data, error } = await admin
      .from("reengineering_event_outbox")
      .select("id,status,event_type,correlation_id")
      .eq("correlation_id", correlationId)
      .limit(5);
    if (!error && data?.length) {
      return data;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

async function liveMain() {
  assertStaging();
  const token = await getAccessToken();
  const correlationId = randomUUID();
  const idempotencyKey = `phase5c-outbox-${randomUUID()}`;

  const res = await fetch(`${base}/api/v1/support/tickets`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
      "x-correlation-id": correlationId,
      accept: "application/json",
    },
    body: JSON.stringify({
      subject: `phase5c-outbox-smoke ${correlationId.slice(0, 8)}`,
      description: "Phase 5C live smoke — synthetic ticket for outbox proof",
      priority: "low",
    }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  if (res.status !== 201 && res.status !== 200) {
    console.log(JSON.stringify({ ok: false, phase: "5C", status: res.status, body: json }));
    process.exit(1);
  }

  const rows = await waitForOutbox(correlationId, Number(process.env.PHASE5C_WAIT_MS || 20_000));
  if (!rows?.length) {
    console.log(
      JSON.stringify({
        ok: false,
        phase: "5C",
        mode: "live",
        correlationId,
        error: "no_outbox_row",
        ticketStatus: res.status,
      }),
    );
    process.exit(1);
  }

  const statuses = [...new Set(rows.map((r) => r.status))];
  const ok = statuses.some((s) => s === "pending" || s === "published");
  console.log(
    JSON.stringify({
      ok,
      phase: "5C",
      mode: "live",
      correlationId,
      outboxRows: rows.length,
      statuses,
      eventTypes: [...new Set(rows.map((r) => r.event_type))],
      ticketId: json?.data?.id || json?.data?.ticketId || null,
    }),
  );
  process.exit(ok ? 0 : 1);
}

if (!live) {
  console.log(
    JSON.stringify({
      ok: true,
      phase: "5C",
      mode: "skeleton",
      message:
        "Local contracts only. Set PHASE5C_SMOKE_LIVE=1 after migration+deploy for staging smoke.",
      at: new Date().toISOString(),
    }),
  );
  const res = spawnSync(
    "npx",
    ["vitest", "run", "tests/reengineering/event-outbox.contract.test.ts"],
    { stdio: "inherit", shell: true },
  );
  process.exit(res.status === 0 ? 0 : 1);
}

liveMain().catch((err) => {
  console.log(JSON.stringify({ ok: false, phase: "5C", error: err?.message || String(err) }));
  process.exit(1);
});
