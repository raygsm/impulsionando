#!/usr/bin/env node
/**
 * Verify local env points at staging Supabase (not prod) and can read schema.
 * Usage: npm run verify:staging-supabase
 * Loads `.env.staging` then `.env.local` (later wins). No secrets printed.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Operator-confirmed staging project (2026-08-31). Older docs mentioned kyiczxt… — superseded.
const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const LEGACY_STAGING_REF = "kyiczxtcoexnvcqgrgkr"; // DNS dead; do not use

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
const stagingLocal = resolve(root, ".env.staging.local");

if (!existsSync(stagingEnv) && !existsSync(stagingLocal)) {
  fail("Create .env.staging from .env.staging.example (staging API keys from Dashboard)");
}
// Always let .env.staging win over shell/.env.local prod leftovers.
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });
if (existsSync(stagingLocal)) config({ path: stagingLocal, override: true });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const publishable =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

function fail(msg) {
  console.error(`verify:staging-supabase FAIL — ${msg}`);
  process.exit(1);
}

if (!url) fail("SUPABASE_URL or VITE_SUPABASE_URL missing (use .env.staging)");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing (staging API → service_role in vault only)");
if (serviceKey.includes("...") || /^eyJ\.\.\./i.test(serviceKey)) {
  fail("SUPABASE_SERVICE_ROLE_KEY looks like a placeholder (contains ...). Paste the real service_role from Dashboard → API");
}
if (!publishable) fail("SUPABASE_PUBLISHABLE_KEY missing");
if (url.includes(PROD_REF)) fail(`URL contains prod ref ${PROD_REF} — use staging only`);
if (!url.includes(STAGING_REF)) {
  fail(`URL must contain staging ref ${STAGING_REF} (got host from .env.staging — wrong project?)`);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const probes = [
  { table: "companies", label: "companies" },
  { table: "user_roles", label: "user_roles" },
];

let ok = 0;
for (const { table, label } of probes) {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  if (error) {
    console.warn(`  ${label}: query error (${error.code ?? "unknown"}) — may still be OK if RLS/table name differs`);
    continue;
  }
  console.log(`  ${label}: count=${count ?? "?"}`);
  ok += 1;
}

if (ok === 0) fail("no probe table returned data — check restore or service_role key");

console.log(`verify:staging-supabase OK — ref ${STAGING_REF}, probes=${ok}/${probes.length}`);
