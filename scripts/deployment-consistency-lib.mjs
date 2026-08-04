import { createHash } from "node:crypto";

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function normalizeDomain(value) {
  const domain = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (!DOMAIN_RE.test(domain)) throw new Error(`invalid_domain:${domain || "empty"}`);
  return domain;
}

export function domainsFromCompanies(rows, rootDomain = "impulsionando.com.br") {
  const domains = new Set();
  for (const row of rows) {
    const candidate = row.domain || (row.subdomain ? `${row.subdomain}.${rootDomain}` : "");
    if (candidate) domains.add(normalizeDomain(candidate));
  }
  return [...domains].sort();
}

export function extractAssetPaths(html) {
  const assets = new Set();
  const pattern = /(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const value = match[1];
    if (!value || /^(?:data:|mailto:|tel:|#)/i.test(value)) continue;
    try {
      const url = new URL(value, "https://deployment.invalid");
      if (url.hostname !== "deployment.invalid") continue;
      if (/\.(?:css|js|mjs|woff2?|png|jpe?g|webp|svg|ico)(?:$|\?)/i.test(value)) {
        assets.add(`${url.pathname}${url.search}`);
      }
    } catch {
      // Malformed markup is ignored; the HTTP/build checks still fail independently.
    }
  }
  return [...assets].sort();
}

export function fingerprintAssets(paths) {
  return createHash("sha256").update(paths.join("\n")).digest("hex");
}

export function chooseReference(probes) {
  const healthy = probes.filter((probe) => probe.ok && probe.commit && probe.builtAt);
  if (!healthy.length) return null;
  return healthy.sort((a, b) => Date.parse(b.builtAt) - Date.parse(a.builtAt))[0];
}

export function compareDeploymentProbes(probes) {
  const reference = chooseReference(probes);
  return probes.map((probe) => {
    const reasons = [...(probe.errors ?? [])];
    if (!reference) reasons.push("reference_unavailable");
    else if (probe.ok) {
      if (probe.commit !== reference.commit) reasons.push("commit_mismatch");
      if (probe.builtAt !== reference.builtAt) reasons.push("build_id_mismatch");
    }
    return { ...probe, consistent: reasons.length === 0, reasons };
  });
}

export async function probeDeployment(domain, fetchImpl = fetch) {
  const normalized = normalizeDomain(domain);
  const nonce = Date.now().toString(36);
  const configuredPath = process.env.DEPLOYMENT_PROBE_PATH || "/";
  const probePath = /^\/[A-Za-z0-9/_-]*$/.test(configuredPath) ? configuredPath : "/";
  try {
    const headers = { accept: "application/json,text/html", "cache-control": "no-cache" };
    const [versionResponse, htmlResponse] = await Promise.all([
      fetchImpl(`https://${normalized}/api/public/version?consistency=${nonce}`, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      }),
      fetchImpl(`https://${normalized}${probePath}?consistency=${nonce}`, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      }),
    ]);
    if (!versionResponse.ok || !htmlResponse.ok) {
      return {
        domain: normalized,
        ok: false,
        errors: [`http:${versionResponse.status}/${htmlResponse.status}`],
      };
    }
    const version = await versionResponse.json();
    const html = await htmlResponse.text();
    const assets = extractAssetPaths(html);
    const commit = typeof version.commit === "string" ? version.commit : "";
    const builtAt = typeof version.builtAt === "string" ? version.builtAt : "";
    const valid = /^[0-9a-f]{7,64}$/i.test(commit) && Number.isFinite(Date.parse(builtAt));
    return {
      domain: normalized,
      ok: valid,
      commit,
      builtAt,
      assetCount: assets.length,
      assetFingerprint: fingerprintAssets(assets),
      endpointHost: version.host ?? normalized,
      cache: {
        version: versionResponse.headers.get("cf-cache-status") ?? "",
        html: htmlResponse.headers.get("cf-cache-status") ?? "",
      },
      errors: valid ? [] : ["invalid_version_contract"],
    };
  } catch (error) {
    return {
      domain: normalized,
      ok: false,
      errors: [error instanceof Error ? error.message : "probe_failed"],
    };
  }
}
