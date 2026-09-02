#!/usr/bin/env node
/**
 * Seed user_roles membership for Phase 4B smokes on STAGING.
 *
 * Requires:
 *   TENANT_MEMBERSHIP_SMOKE_USER_ID  (auth.users id) OR resolves TEST_USER_EMAIL
 *   TENANT_MEMBERSHIP_SMOKE_COMPANY_ID (default: Chrismed seed company)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const DEFAULT_COMPANY = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

function fail(msg) {
  console.error(`staging:seed:membership FAIL — ${msg}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const companyId = process.env.TENANT_MEMBERSHIP_SMOKE_COMPANY_ID || DEFAULT_COMPANY;

if (!url) fail("SUPABASE_URL missing");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing");
if (url.includes(PROD_REF)) fail(`URL is prod ${PROD_REF} — staging only`);
if (!url.includes(STAGING_REF)) fail(`URL must be staging ${STAGING_REF}`);

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = process.env.TENANT_MEMBERSHIP_SMOKE_USER_ID || "";

if (!userId) {
  const email = process.env.TEST_USER_EMAIL;
  if (!email) fail("Set TENANT_MEMBERSHIP_SMOKE_USER_ID or TEST_USER_EMAIL");
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) fail(`listUsers: ${error.message}`);
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user?.id) fail(`user not found for email ${email}`);
  userId = user.id;
}

const { data: existing, error: selErr } = await admin
  .from("user_roles")
  .select("id, role")
  .eq("user_id", userId)
  .eq("company_id", companyId)
  .limit(1);

if (selErr) fail(`select user_roles: ${selErr.message}`);

if (existing?.length) {
  console.log(
    JSON.stringify(
      { ok: true, action: "exists", userId, companyId, role: existing[0].role },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { data: inserted, error: insErr } = await admin
  .from("user_roles")
  .insert({ user_id: userId, company_id: companyId, role: "admin" })
  .select("id, role")
  .single();

if (insErr) fail(`insert user_roles: ${insErr.message}`);

console.log(
  JSON.stringify(
    { ok: true, action: "inserted", userId, companyId, role: inserted.role },
    null,
    2,
  ),
);
console.log("Next: npm run phase4:smoke:tenant-membership-allow");
