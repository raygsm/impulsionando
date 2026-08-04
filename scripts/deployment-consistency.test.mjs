import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareDeploymentProbes,
  domainsFromCompanies,
  extractAssetPaths,
  fingerprintAssets,
  normalizeDomain,
} from "./deployment-consistency-lib.mjs";

describe("deployment consistency", () => {
  it("normalizes official domains without provider assumptions", () => {
    assert.equal(
      normalizeDomain("https://WMP.IMPULSIONANDO.COM.BR/path"),
      "wmp.impulsionando.com.br",
    );
    assert.throws(() => normalizeDomain("localhost"));
  });
  it("discovers tenants from the registry", () => {
    assert.deepEqual(domainsFromCompanies([{ subdomain: "wmp" }, { domain: "cliente.com.br" }]), [
      "cliente.com.br",
      "wmp.impulsionando.com.br",
    ]);
  });
  it("fingerprints build assets, not tenant-specific HTML", () => {
    const assets = extractAssetPaths(
      '<h1>WMP</h1><script src="/assets/app-123.js"></script><link href="/assets/app-123.css" rel="stylesheet">',
    );
    assert.deepEqual(assets, ["/assets/app-123.css", "/assets/app-123.js"]);
    assert.equal(fingerprintAssets(assets).length, 64);
  });
  it("detects commit and asset divergence against the newest build", () => {
    const results = compareDeploymentProbes([
      {
        domain: "a.com.br",
        ok: true,
        commit: "abcdef1",
        builtAt: "2026-08-04T12:00:00Z",
        assetFingerprint: "one",
        errors: [],
      },
      {
        domain: "b.com.br",
        ok: true,
        commit: "abcdef0",
        builtAt: "2026-08-04T11:00:00Z",
        assetFingerprint: "two",
        errors: [],
      },
    ]);
    assert.equal(results[0].consistent, true);
    assert.deepEqual(results[1].reasons, ["commit_mismatch", "build_id_mismatch"]);
  });
});
