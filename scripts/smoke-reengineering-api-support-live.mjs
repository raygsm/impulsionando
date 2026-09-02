#!/usr/bin/env node
/**
 * Phase 3 Support live smoke — staging edge (api.stg).
 *
 * Hard pass (exit 0): GET /health + POST /api/v1/support/tickets (public create).
 * Soft pass when unauthenticated: list + update-status skipped with a clear message.
 *
 * Auth (optional, for list + staff status update):
 *   1. SUPPORT_SMOKE_ACCESS_TOKEN — Bearer access token (preferred for CI)
 *   2. TEST_USER_EMAIL + TEST_USER_PASSWORD — signInWithPassword via publishable key
 *      (same pattern as tests/helpers.ts; values may live in .env.staging)
 *
 * Usage:
 *   npm run phase3:smoke:support-live
 *   PHASE3_API_BASE=http://127.0.0.1:3100 npm run phase3:smoke:support-live
 *   SUPPORT_SMOKE_ACCESS_TOKEN=eyJ... npm run phase3:smoke:support-live
 *
 * Loads `.env.staging` (override: true). Never prints secrets.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");

if (existsSync(stagingEnv)) {
  config({ path: stagingEnv, override: true });
}

const base = (process.env.PHASE3_API_BASE || "https://api.stg.impulsionando.com.br").replace(
  /\/$/,
  "",
);

const correlationId = `smoke-support-${randomUUID()}`;
const idempotencyKey = `smoke-list-${Date.now()}`;

function log(msg) {
  console.log(msg);
}

function warn(msg) {
  console.warn(`WARN — ${msg}`);
}

function fail(msg) {
  console.error(`FAIL — ${msg}`);
  process.exit(1);
}

function assertStagingSupabaseUrl(url) {
  if (!url) return;
  if (url.includes(PROD_REF)) {
    fail(`SUPABASE_URL targets prod ref ${PROD_REF} — staging only`);
  }
  if (!url.includes(STAGING_REF)) {
    warn(`SUPABASE_URL does not contain staging ref ${STAGING_REF} — auth sign-in may be wrong project`);
  }
}

async function request(method, path, { token, body, headers = {} } = {}) {
  const reqHeaders = {
    accept: "application/json",
    "x-correlation-id": correlationId,
    ...headers,
  };
  if (token) reqHeaders.authorization = `Bearer ${token}`;
  if (body !== undefined) reqHeaders["content-type"] = "application/json";

  const res = await fetch(`${base}${path}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "follow",
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body: json };
}

function isLikelyJwt(token) {
  if (!token || token.length < 80) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

async function validateAccessToken(token, { url, publishable }) {
  if (!isLikelyJwt(token)) {
    return { ok: false, reason: "not_a_jwt" };
  }
  const sb = createClient(url, publishable, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, reason: error?.message ?? "invalid_or_expired" };
  }
  return { ok: true, userId: data.user.id };
}

async function resolveAccessToken() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const publishable =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  const direct = process.env.SUPPORT_SMOKE_ACCESS_TOKEN?.trim();
  if (direct) {
    if (!url || !publishable) {
      warn(
        "SUPPORT_SMOKE_ACCESS_TOKEN set but SUPABASE_URL + publishable key missing — cannot validate token",
      );
    } else {
      assertStagingSupabaseUrl(url);
      const check = await validateAccessToken(direct, { url, publishable });
      if (check.ok) {
        return { token: direct, source: "SUPPORT_SMOKE_ACCESS_TOKEN" };
      }
      warn(
        `SUPPORT_SMOKE_ACCESS_TOKEN ignored (${check.reason}) — must be a Supabase access_token JWT (eyJ…); falling back to TEST_USER_EMAIL sign-in`,
      );
    }
  }

  const email = process.env.TEST_USER_EMAIL?.trim();
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    return null;
  }

  if (!url || !publishable) {
    warn(
      "TEST_USER_EMAIL/TEST_USER_PASSWORD set but SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY missing — cannot sign in",
    );
    return null;
  }

  assertStagingSupabaseUrl(url);

  const sb = createClient(url, publishable, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    warn(`signInWithPassword failed for TEST_USER_EMAIL (${error?.message ?? "no session"})`);
    return null;
  }

  return { token: data.session.access_token, source: "TEST_USER_EMAIL signInWithPassword" };
}

async function main() {
  const report = {
    base,
    correlationId,
    idempotencyKey,
    health: null,
    create: null,
    list: { skipped: false },
    updateStatus: { skipped: false },
    auth: { present: false, source: null },
  };

  // 1. Health
  const health = await request("GET", "/health");
  report.health = { status: health.status, ok: health.body?.ok, service: health.body?.service };
  const healthOk =
    health.status === 200 && health.body?.ok === true && health.body?.service === "impulsionando-api";
  if (!healthOk) {
    console.log(JSON.stringify(report, null, 2));
    fail(`GET /health expected 200 + ok:true + service:impulsionando-api (got ${health.status})`);
  }
  log(`OK — GET /health (${health.status})`);

  // 2. Public create
  const createBody = {
    subject: `Phase 3 smoke ${new Date().toISOString()}`,
    description: "Automated staging smoke from smoke-reengineering-api-support-live.mjs",
    type: "technical",
    priority: "low",
    requester: {
      name: "Phase3 Smoke",
      email: `smoke+${Date.now()}@impulsionando.test`,
    },
    source: "phase3-smoke-support-live",
  };

  const create = await request("POST", "/api/v1/support/tickets", {
    body: createBody,
    headers: { "idempotency-key": idempotencyKey },
  });
  const ticketId = create.body?.data?.id;
  const createOk = create.status === 201 && typeof ticketId === "string";
  report.create = {
    status: create.status,
    id: ticketId ?? null,
    protocol: create.body?.data?.protocol ?? null,
    replay: Boolean(create.body?.meta?.idempotencyReplay),
  };
  if (!createOk) {
    console.log(JSON.stringify(report, null, 2));
    fail(
      `POST /api/v1/support/tickets expected 201 + data.id (got ${create.status}: ${create.body?.error?.code ?? "unknown"})`,
    );
  }
  log(`OK — POST /api/v1/support/tickets id=${ticketId} protocol=${report.create.protocol}`);

  // 3. Authenticated list (+ optional staff update)
  const auth = await resolveAccessToken();
  if (!auth) {
    report.auth.present = false;
    report.list.skipped = true;
    report.updateStatus.skipped = true;
    warn(
      "No valid auth — skipping GET list and PATCH update-status. " +
        "Set SUPPORT_SMOKE_ACCESS_TOKEN to a Supabase access_token JWT (from sign-in or browser session), " +
        "or TEST_USER_EMAIL + TEST_USER_PASSWORD in .env.staging.",
    );
    console.log(JSON.stringify(report, null, 2));
    log("PASS — health + create (list/update soft-skipped: no token)");
    process.exit(0);
  }

  report.auth = { present: true, source: auth.source };

  const list = await request("GET", "/api/v1/support/tickets?limit=10", { token: auth.token });
  const listData = list.body?.data;
  const listOk = list.status === 200 && Array.isArray(listData);
  report.list = {
    status: list.status,
    count: Array.isArray(listData) ? listData.length : null,
    ok: listOk,
  };

  if (!listOk) {
    console.log(JSON.stringify(report, null, 2));
    fail(
      `GET /api/v1/support/tickets expected 200 + data[] (got ${list.status}: ${list.body?.error?.code ?? "not an array"})`,
    );
  }
  log(`OK — GET /api/v1/support/tickets (${listData.length} rows)`);

  const patch = await request("PATCH", `/api/v1/support/tickets/${ticketId}/status`, {
    token: auth.token,
    body: { status: "received", reason: "phase3-smoke-support-live" },
    headers: { "idempotency-key": `smoke-update-${idempotencyKey}` },
  });

  if (patch.status === 200) {
    report.updateStatus = {
      status: patch.status,
      ok: true,
      staff: true,
      newStatus: patch.body?.data?.status ?? null,
    };
    log(`OK — PATCH status → received (staff user)`);
  } else if (patch.status === 403) {
    report.updateStatus = {
      status: patch.status,
      ok: true,
      staff: false,
      code: patch.body?.error?.code ?? "FORBIDDEN",
    };
    log(`OK — PATCH status skipped (non-staff user, 403 FORBIDDEN as expected)`);
  } else {
    report.updateStatus = {
      status: patch.status,
      ok: false,
      code: patch.body?.error?.code ?? null,
    };
    console.log(JSON.stringify(report, null, 2));
    fail(
      `PATCH /api/v1/support/tickets/${ticketId}/status unexpected ${patch.status} (${patch.body?.error?.code ?? "unknown"})`,
    );
  }

  console.log(JSON.stringify(report, null, 2));
  log("PASS — health + create + list" + (report.updateStatus.staff ? " + staff update-status" : ""));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
