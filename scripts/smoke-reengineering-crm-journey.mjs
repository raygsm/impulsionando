#!/usr/bin/env node
/**
 * Phase 5F smoke — DRY_RUN contracts by default; live when PHASE5F_SMOKE_LIVE=1.
 *
 * Live: create invite (allowlisted) → click → first-login → assert journey status.
 * Requires JOURNEY_RECIPIENT_ALLOWLIST on API matching recipientAddress.
 * Never real provider sends. Staging only. Never prints secrets/tokens.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const DEFAULT_TENANT = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";
const SYNTHETIC_RECIPIENT = "phase5f-smoke@example.invalid";

const dryRun = process.env.DRY_RUN !== "0" && process.env.PHASE5F_SMOKE_LIVE !== "1";

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
}

async function getAccessToken() {
  const direct =
    process.env.JOB_SMOKE_ACCESS_TOKEN ||
    process.env.PHASE5G_OPS_BEARER ||
    process.env.SUPPORT_SMOKE_ACCESS_TOKEN;
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

async function liveMain() {
  assertStaging();
  const allowlist = (process.env.JOURNEY_RECIPIENT_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const recipient =
    process.env.JOURNEY_SMOKE_RECIPIENT ||
    allowlist[0] ||
    SYNTHETIC_RECIPIENT;
  if (allowlist.length && !allowlist.includes(recipient)) {
    console.log(
      JSON.stringify({
        ok: false,
        phase: "5F",
        error: "recipient_not_in_JOURNEY_RECIPIENT_ALLOWLIST",
        hint: "Set JOURNEY_RECIPIENT_ALLOWLIST on API + smoke env to the same synthetic address",
      }),
    );
    process.exit(1);
  }

  const token = await getAccessToken();
  const tenantId = process.env.JOB_SMOKE_TENANT_ID || DEFAULT_TENANT;
  const correlationId = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const createRes = await fetch(`${base}/api/v1/journeys/invites`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "idempotency-key": `phase5f-${randomUUID()}`,
      "x-correlation-id": correlationId,
      accept: "application/json",
    },
    body: JSON.stringify({
      tenantId,
      contactRef: `smoke-${correlationId.slice(0, 8)}`,
      recipientAddress: recipient,
      expiresAt,
      channel: "sink",
    }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  if (createRes.status !== 201) {
    console.log(
      JSON.stringify({
        ok: false,
        phase: "5F",
        step: "create",
        status: createRes.status,
        code: createBody?.error?.code || null,
        message: createBody?.error?.message || null,
      }),
    );
    process.exit(1);
  }

  const inviteId = createBody?.data?.inviteId;
  const inviteToken = createBody?.data?.token;
  const journeyId = createBody?.data?.journeyId;
  if (!inviteId || !inviteToken) {
    console.log(JSON.stringify({ ok: false, phase: "5F", error: "missing_invite_fields" }));
    process.exit(1);
  }

  const clickRes = await fetch(`${base}/api/v1/journeys/invites/${inviteId}/click`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": correlationId,
      accept: "application/json",
    },
    body: JSON.stringify({ tenantId, token: inviteToken }),
  });
  const clickBody = await clickRes.json().catch(() => ({}));
  if (clickRes.status !== 200) {
    console.log(
      JSON.stringify({
        ok: false,
        phase: "5F",
        step: "click",
        status: clickRes.status,
        code: clickBody?.error?.code || null,
      }),
    );
    process.exit(1);
  }

  const loginRes = await fetch(`${base}/api/v1/journeys/invites/${inviteId}/first-login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": correlationId,
      accept: "application/json",
    },
    body: JSON.stringify({ tenantId, token: inviteToken }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (loginRes.status !== 200) {
    console.log(
      JSON.stringify({
        ok: false,
        phase: "5F",
        step: "first-login",
        status: loginRes.status,
        code: loginBody?.error?.code || null,
      }),
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      ok: true,
      phase: "5F",
      mode: "live",
      correlationId,
      journeyId,
      inviteId,
      createStatus: createBody?.data?.journeyStatus || createBody?.data?.status || null,
      afterClick: clickBody?.data?.journeyStatus || null,
      afterLogin: loginBody?.data?.journeyStatus || null,
      // never echo invite token
      tokenReturned: Boolean(inviteToken),
    }),
  );
}

if (dryRun) {
  console.log(
    JSON.stringify({
      ok: true,
      phase: "5F",
      mode: "DRY_RUN",
      message:
        "Local contracts only. No staging/prod, no real sends. Set PHASE5F_SMOKE_LIVE=1 after migration+deploy for operator smoke.",
      at: new Date().toISOString(),
    }),
  );
  const res = spawnSync(
    "npx",
    ["vitest", "run", "tests/reengineering/crm-journey.contract.test.ts"],
    { stdio: "inherit", shell: true },
  );
  process.exit(res.status === 0 ? 0 : 1);
}

liveMain().catch((err) => {
  console.log(JSON.stringify({ ok: false, phase: "5F", error: err?.message || String(err) }));
  process.exit(1);
});
