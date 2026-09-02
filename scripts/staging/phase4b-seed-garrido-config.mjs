#!/usr/bin/env node
/**
 * Apply Phase 4B typed configuration for Garrido pilot tenant on STAGING.
 * Run after staging:seed:garrido-tenant.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const STAGING_REF = "aamorcqznimmleafavai";
const PROD_REF = "arygtqrdpcdkwnuwsgmm";
const SUBDOMAIN = "garrido";

const root = process.cwd();
const stagingEnv = resolve(root, ".env.staging");
if (existsSync(stagingEnv)) config({ path: stagingEnv, override: true });

function fail(msg) {
  console.error(`staging:seed:garrido-config FAIL — ${msg}`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url) fail("SUPABASE_URL missing");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY missing");
if (url.includes(PROD_REF)) fail(`URL is prod — staging only`);

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

const { data: updated, error: updErr } = await admin
  .from("companies")
  .update({
    tagline: "Referência imobiliária no Rio",
    primary_color: "#1a3a5c",
    secondary_color: "#c9a227",
    country_code: "BR",
    locale: "pt-BR",
    currency_code: "BRL",
    phone_country_code: "+55",
    timezone: "America/Sao_Paulo",
    release_channel: "stable",
    updated_at: new Date().toISOString(),
  })
  .eq("id", company.id)
  .select("id, subdomain, tagline, primary_color, locale, timezone")
  .single();

if (updErr) fail(`update: ${updErr.message}`);

const { data: crmModule } = await admin.from("modules").select("id").eq("slug", "crm").maybeSingle();
if (crmModule?.id) {
  const { error: modErr } = await admin.from("company_modules").upsert(
    { company_id: company.id, module_id: crmModule.id, is_enabled: true },
    { onConflict: "company_id,module_id" },
  );
  if (modErr) console.warn(`WARN — company_modules: ${modErr.message}`);
}

console.log(JSON.stringify({ ok: true, pilot: "garrido", company: updated }, null, 2));
