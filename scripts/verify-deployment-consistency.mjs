#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import {
  compareDeploymentProbes,
  domainsFromCompanies,
  normalizeDomain,
  probeDeployment,
} from "./deployment-consistency-lib.mjs";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rootDomain = process.env.OFFICIAL_ROOT_DOMAIN || "impulsionando.com.br";
const reportPath = process.env.DEPLOYMENT_REPORT_PATH || "artifacts/deployment-consistency.json";

async function loadDomains() {
  if (process.env.OFFICIAL_DOMAINS) {
    return [...new Set(process.env.OFFICIAL_DOMAINS.split(",").map(normalizeDomain))].sort();
  }
  if (!supabaseUrl || !serviceKey) throw new Error("supabase_bootstrap_unavailable");
  const response = await fetch(
    `${supabaseUrl}/rest/v1/companies?select=domain,subdomain&is_active=eq.true&is_master=eq.false&environment=neq.demo`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  if (!response.ok) throw new Error(`tenant_registry_http_${response.status}`);
  return domainsFromCompanies(await response.json(), rootDomain);
}

async function vaultSecret(name) {
  if (!supabaseUrl || !serviceKey) return "";
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_deployment_vault_secret`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ _name: name }),
  });
  if (!response.ok) return "";
  const value = await response.json();
  return typeof value === "string" ? value : "";
}

async function purgeCloudflare(domains, token) {
  if (!token || !domains.length) return [];
  const zonesResponse = await fetch("https://api.cloudflare.com/client/v4/zones?per_page=50", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!zonesResponse.ok) throw new Error(`cloudflare_zones_http_${zonesResponse.status}`);
  const zones = (await zonesResponse.json()).result ?? [];
  const purged = [];
  for (const domain of domains) {
    const zone = zones
      .filter((candidate) => domain === candidate.name || domain.endsWith(`.${candidate.name}`))
      .sort((a, b) => b.name.length - a.name.length)[0];
    if (!zone) continue;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.id}/purge_cache`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          files: [`https://${domain}/`, `https://${domain}/api/public/version`],
        }),
      },
    );
    if (response.ok) purged.push(domain);
  }
  return purged;
}

async function run() {
  const startedAt = new Date().toISOString();
  const domains = await loadDomains();
  if (!domains.length) throw new Error("official_domain_registry_empty");
  let probes = await Promise.all(domains.map((domain) => probeDeployment(domain)));
  let results = compareDeploymentProbes(probes);
  const stale = results.filter((result) => !result.consistent).map((result) => result.domain);
  let purged = [];
  if (stale.length) {
    const token = process.env.CLOUDFLARE_API_TOKEN || (await vaultSecret("CLOUDFLARE_API_TOKEN"));
    purged = await purgeCloudflare(stale, token);
    if (purged.length) {
      await new Promise((resolve) => setTimeout(resolve, 8_000));
      probes = await Promise.all(domains.map((domain) => probeDeployment(domain)));
      results = compareDeploymentProbes(probes);
    }
  }
  const reference = results.find((result) => result.consistent && result.commit) ?? null;
  const report = {
    startedAt,
    completedAt: new Date().toISOString(),
    reference: reference
      ? {
          commit: reference.commit,
          builtAt: reference.builtAt,
          assetFingerprint: reference.assetFingerprint,
        }
      : null,
    discoveredDomains: domains.length,
    purged,
    results,
  };
  await mkdir(reportPath.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  for (const result of results) {
    const marker = result.consistent ? "OK" : "FAIL";
    console.log(
      `${marker} ${result.domain} commit=${result.commit ?? "?"} assets=${result.assetFingerprint?.slice(0, 12) ?? "?"} ${result.reasons.join(",")}`,
    );
  }
  if (results.some((result) => !result.consistent)) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "deployment_consistency_failed");
  process.exitCode = 1;
});
