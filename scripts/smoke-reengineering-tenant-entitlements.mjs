#!/usr/bin/env node
/**
 * Phase 4B entitlements smoke — authenticated member reads config + entitlements.
 *
 * Requires TENANT_ENTITLEMENTS_SMOKE_TENANT_ID (Chrismed company id on staging)
 * and auth token (same vars as membership allow smoke).
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
const tenantId = process.env.TENANT_ENTITLEMENTS_SMOKE_TENANT_ID;

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
    throw new Error("Missing auth env for entitlements smoke");
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

async function fetchJson(path, token) {
  const res = await fetch(`${base}${path}`, {
    headers: { accept: "application/json", authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  if (!tenantId) {
    throw new Error("Set TENANT_ENTITLEMENTS_SMOKE_TENANT_ID (Chrismed company UUID on staging)");
  }

  const token = await getAccessToken();
  const configRes = await fetchJson(`/api/v1/tenants/${tenantId}/config`, token);
  const entRes = await fetchJson(`/api/v1/tenants/${tenantId}/entitlements`, token);
  const unknownFlagRes = await fetchJson(
    `/api/v1/tenants/${tenantId}/flags/unknown.phase4b.flag`,
    token,
  );

  const configOk =
    configRes.status === 200 && configRes.body?.data?.schemaVersion === 1;
  const entOk =
    entRes.status === 200 &&
    entRes.body?.data?.schemaVersion === 1 &&
    Array.isArray(entRes.body?.data?.modules);
  const denyOk =
    unknownFlagRes.status === 200 &&
    unknownFlagRes.body?.data?.value === false &&
    unknownFlagRes.body?.data?.known === false;

  const ok = configOk && entOk && denyOk;
  console.log(
    JSON.stringify(
      {
        ok,
        base,
        tenantId,
        config: { status: configRes.status, schemaVersion: configRes.body?.data?.schemaVersion },
        entitlements: {
          status: entRes.status,
          modules: entRes.body?.data?.modules ?? null,
          flagCount: Object.keys(entRes.body?.data?.flags ?? {}).length,
        },
        unknownFlag: unknownFlagRes.body?.data ?? null,
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
