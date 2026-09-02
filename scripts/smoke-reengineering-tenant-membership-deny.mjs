#!/usr/bin/env node
/**
 * Phase 4B deny smoke — authenticated user without membership on resolved tenant.
 *
 * Uses a host the smoke user is not a member of (default unknown low-risk host).
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
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
const host =
  process.env.TENANT_MEMBERSHIP_DENY_SMOKE_HOST || "garrido.impulsionando.com.br";

async function getAccessToken() {
  const direct = process.env.TENANT_MEMBERSHIP_SMOKE_ACCESS_TOKEN;
  if (direct) return direct;

  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!email || !password || !url || !key) {
    throw new Error(
      "Set TENANT_MEMBERSHIP_SMOKE_ACCESS_TOKEN or TEST_USER_EMAIL + TEST_USER_PASSWORD + SUPABASE_URL + publishable key",
    );
  }
  if (url.includes(PROD_REF)) {
    throw new Error(`SUPABASE_URL targets prod ref ${PROD_REF} — staging only`);
  }
  if (!url.includes(STAGING_REF)) {
    console.warn(`WARN — SUPABASE_URL ref is not staging ${STAGING_REF}`);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token) {
    throw new Error(error?.message || "signInWithPassword failed");
  }
  return data.session.access_token;
}

async function main() {
  const token = await getAccessToken();
  const url = `${base}/api/v1/tenants/context?host=${encodeURIComponent(host)}`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });
  const body = await res.json();
  const code = body?.error?.code;
  const pass = res.status === 403 && (code === "TENANT_MISMATCH" || code === "TENANT_NOT_FOUND");

  console.log(
    JSON.stringify(
      {
        ok: pass,
        base,
        host,
        status: res.status,
        code: code ?? null,
        error: body?.error ?? null,
      },
      null,
      2,
    ),
  );
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
