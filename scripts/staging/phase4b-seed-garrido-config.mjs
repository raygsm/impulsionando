#!/usr/bin/env node
/**
 * Apply Phase 4B typed configuration for Garrido pilot tenant on STAGING.
 * Run after staging:seed:garrido-tenant.
 *
 * Staging restore may lack cosmetic/locale columns (tagline, country_code, …).
 * Only write columns that exist; skip the rest with a WARN.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const SUBDOMAIN = "garrido";

/** Always-safe on staging restore. */
const SAFE_PATCH = {
  primary_color: "#1a3a5c",
  secondary_color: "#c9a227",
};

/** Present on fuller schemas; omit when 42703. */
const OPTIONAL_PATCH = {
  tagline: "Referência imobiliária no Rio",
  country_code: "BR",
  locale: "pt-BR",
  currency_code: "BRL",
  phone_country_code: "+55",
  timezone: "America/Sao_Paulo",
  release_channel: "stable",
};

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

function fail(msg) {
  console.error(`staging:seed:garrido-config FAIL — ${msg}`);
  process.exit(1);
}

function isMissingColumnError(error) {
  if (!error) return false;
  if (error.code === "42703") return true;
  return /column .* does not exist|Could not find the '\w+' column/i.test(error.message || "");
}

function missingColumnName(error) {
  const msg = error?.message || "";
  const match =
    msg.match(/column\s+[\w.]+\.(\w+)\s+does not exist/i) ||
    msg.match(/Could not find the '(\w+)' column/i);
  return match?.[1] ?? null;
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url) fail("SUPABASE_URL missing");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing");
if (url.includes(PROD_REF)) fail(`URL is prod — staging only`);
if (!url.includes(STAGING_REF)) {
  console.warn(`WARN — URL does not contain staging ref ${STAGING_REF}`);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: company, error: selErr } = await admin
  .from("companies")
  .select("id, name, subdomain")
  .eq("subdomain", SUBDOMAIN)
  .maybeSingle();

if (selErr) fail(`select: ${selErr.message}`);
if (!company?.id) fail(`no company with subdomain ${SUBDOMAIN} — run staging:seed:garrido-tenant first`);

const skipped = [];
let patch = {
  ...SAFE_PATCH,
  ...OPTIONAL_PATCH,
  updated_at: new Date().toISOString(),
};

let updated = null;
for (let attempt = 0; attempt < Object.keys(OPTIONAL_PATCH).length + 3; attempt++) {
  const { data, error: updErr } = await admin
    .from("companies")
    .update(patch)
    .eq("id", company.id)
    .select("id, subdomain, primary_color, secondary_color")
    .single();

  if (!updErr) {
    updated = data;
    break;
  }

  if (!isMissingColumnError(updErr)) {
    fail(`update: ${updErr.message}`);
  }

  const missing = missingColumnName(updErr);
  if (missing && Object.prototype.hasOwnProperty.call(patch, missing)) {
    if (Object.prototype.hasOwnProperty.call(SAFE_PATCH, missing)) {
      fail(`update: required column missing: ${missing}`);
    }
    skipped.push(missing);
    const { [missing]: _drop, ...rest } = patch;
    patch = rest;
    continue;
  }

  // Unknown missing column — strip all optional and retry once.
  for (const key of Object.keys(OPTIONAL_PATCH)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      skipped.push(key);
      delete patch[key];
    }
  }
}

if (!updated) fail("update: exhausted column retries");

if (skipped.length > 0) {
  console.warn(
    `WARN — skipped missing companies columns: ${[...new Set(skipped)].sort().join(", ")}`,
  );
}

const { data: crmModule } = await admin.from("modules").select("id").eq("slug", "crm").maybeSingle();
if (crmModule?.id) {
  const { error: modErr } = await admin.from("company_modules").upsert(
    { company_id: company.id, module_id: crmModule.id, is_enabled: true },
    { onConflict: "company_id,module_id" },
  );
  if (modErr) console.warn(`WARN — company_modules: ${modErr.message}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      pilot: "garrido",
      company: updated,
      skippedColumns: [...new Set(skipped)].sort(),
    },
    null,
    2,
  ),
);
