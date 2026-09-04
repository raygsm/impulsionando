#!/usr/bin/env node
/**
 * Seed CSI tenant row on STAGING for Phase 7B pilot rehearsal.
 * Staging only — never prod. Does not flip DNS.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const HOST = "csi.impulsionando.com.br";
const SUBDOMAIN = "csi";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

function fail(msg) {
  console.error(`staging:seed:csi-tenant FAIL — ${msg}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url) fail("SUPABASE_URL missing");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing");
if (url.includes(PROD_REF)) fail(`URL is prod ${PROD_REF} — staging only`);
if (!url.includes(STAGING_REF)) fail(`URL must be staging ${STAGING_REF}`);

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: bySub, error: subErr } = await admin
  .from("companies")
  .select("id, name, subdomain, domain, is_active")
  .eq("subdomain", SUBDOMAIN)
  .limit(1);

if (subErr) fail(`select subdomain: ${subErr.message}`);

let target = bySub?.[0];

if (!target) {
  const { data: named, error: namedErr } = await admin
    .from("companies")
    .select("id, name, subdomain, domain, is_active")
    .ilike("name", "%csi%")
    .limit(1);
  if (namedErr) fail(`select named: ${namedErr.message}`);
  target = named?.[0];
}

if (!target) {
  const { data: anyRow, error: anyErr } = await admin
    .from("companies")
    .select("id, name, subdomain, domain, is_active")
    .eq("is_active", true)
    .limit(1);
  if (anyErr) fail(`select fallback: ${anyErr.message}`);
  target = anyRow?.[0];
}

if (!target?.id) fail("no companies row found on staging");

const { data: updated, error: updErr } = await admin
  .from("companies")
  .update({
    name: target.name?.toLowerCase().includes("csi") ? target.name : "CSI (staging seed)",
    subdomain: SUBDOMAIN,
    domain: HOST,
    is_active: true,
    updated_at: new Date().toISOString(),
  })
  .eq("id", target.id)
  .select("id, name, subdomain, domain, is_active")
  .single();

if (updErr) fail(`update: ${updErr.message}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      companyId: updated.id,
      name: updated.name,
      subdomain: updated.subdomain,
      domain: updated.domain,
      host: HOST,
      pilot: "7B-csi",
      note: "Put companyId into operator secrets as PHASE7_PILOT_TENANT_ID (never git). No DNS flip.",
    },
    null,
    2,
  ),
);
