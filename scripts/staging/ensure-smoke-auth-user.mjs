#!/usr/bin/env node
/**
 * Ensure TEST_USER_EMAIL exists on STAGING Auth with TEST_USER_PASSWORD.
 * Uses service_role — never prints secrets.
 *
 * Usage: npm run staging:ensure-smoke-user
 * Requires in .env.staging: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD, legacy anon JWT in SUPABASE_PUBLISHABLE_KEY
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

function fail(msg) {
  console.error(`staging:ensure-smoke-user FAIL — ${msg}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anon =
  [process.env.SUPABASE_ANON_KEY, process.env.SUPABASE_PUBLISHABLE_KEY, process.env.VITE_SUPABASE_PUBLISHABLE_KEY]
    .filter(Boolean)
    .find((k) => k.startsWith("eyJ") && k.length > 100) || "";

const email = process.env.TEST_USER_EMAIL?.trim();
const password = process.env.TEST_USER_PASSWORD;

if (!url) fail("SUPABASE_URL missing");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing");
if (url.includes(PROD_REF)) fail(`URL is prod ${PROD_REF} — staging only`);
if (!url.includes(STAGING_REF)) fail(`URL must be staging ${STAGING_REF}`);
if (!email || !password) fail("TEST_USER_EMAIL and TEST_USER_PASSWORD required");
if (!anon) {
  fail(
    "Legacy anon JWT (eyJ… ~200+ chars) required in SUPABASE_PUBLISHABLE_KEY — sb_publishable will not work for sign-in",
  );
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find existing user (first 1000 — staging smoke user should be in first page)
const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listErr) fail(`listUsers: ${listErr.message}`);

const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (existing) {
  const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (updErr) fail(`updateUserById: ${updErr.message}`);
  console.log(`staging:ensure-smoke-user OK — updated password for existing user id=${existing.id}`);
} else {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) fail(`createUser: ${createErr.message}`);
  console.log(`staging:ensure-smoke-user OK — created user id=${created.user?.id}`);
}

// Verify sign-in with anon key (same path as smoke script)
const client = createClient(url, anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error } = await client.auth.signInWithPassword({ email, password });
if (error || !data.session?.access_token) {
  fail(`signInWithPassword after provision: ${error?.message ?? "no session"}`);
}

console.log("signInWithPassword: OK");
console.log("Next: npm run phase3:smoke:support-live");
