#!/usr/bin/env node
/**
 * Phase 5G smoke skeleton — ops queue metrics + integration registry.
 *
 * Operator (staging only, after 5B + 5G migrations + API deploy):
 * 1. Apply supabase/migrations/20260902240000_phase5g_ops_metrics.sql on staging (not prod).
 * 2. Deploy API with OpsModule.
 * 3. Export a staging Bearer access token as PHASE5G_OPS_BEARER (value never logged).
 * 4. Export DRY_RUN=0 and run against api.stg only.
 *
 * Default: DRY_RUN=1 — prints the intended request shape without sending.
 * Never prints Bearer token or other secrets.
 */
const STAGING_API_DEFAULT = "https://api.stg.impulsionando.com.br";

const dryRun = process.env.DRY_RUN !== "0";
const base = (process.env.PHASE3_API_BASE || STAGING_API_DEFAULT).replace(/\/$/, "");

function assertStagingLikeUrl(url) {
  if (!url.includes("stg.impulsionando") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    console.warn("WARN: target does not look like staging/local API");
  }
}

async function main() {
  assertStagingLikeUrl(base);

  const plan = {
    ok: true,
    dryRun,
    endpoints: [
      {
        method: "GET",
        url: `${base}/api/v1/ops/queue-metrics`,
        expectedStatusAuthed: 200,
        expectedStatusUnauthed: 401,
      },
      {
        method: "GET",
        url: `${base}/api/v1/ops/integrations`,
        expectedStatusAuthed: 200,
        expectedStatusUnauthed: 401,
      },
    ],
    authHeader: "Authorization: Bearer <PHASE5G_OPS_BEARER>",
    notes: [
      "Auth required on both endpoints",
      "Responses must not contain secret/password/token field values",
      "credentialEnvNames may list env *names* only",
      "providerLatencyMsP50/P95 may be null (UNKNOWN) until telemetry exists",
      "Do not apply migration to prod; do not SSH from this smoke",
    ],
  };

  if (dryRun) {
    console.log(JSON.stringify({ ...plan, message: "DRY_RUN=1 — no HTTP request sent" }, null, 2));
    return;
  }

  const bearer = process.env.PHASE5G_OPS_BEARER;
  if (!bearer) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "Set PHASE5G_OPS_BEARER (value never logged) or keep DRY_RUN=1",
      }),
    );
    process.exit(1);
  }

  const results = [];
  for (const ep of plan.endpoints) {
    const unauth = await fetch(ep.url, { method: ep.method });
    const auth = await fetch(ep.url, {
      method: ep.method,
      headers: { authorization: `Bearer ${bearer}`, "x-correlation-id": `phase5g-smoke-${Date.now()}` },
    });

    let bodyText = "";
    try {
      bodyText = await auth.text();
    } catch {
      bodyText = "";
    }

    const secretLeak =
      /"(secret|password|token|api[_-]?key|authorization)"\s*:\s*"[^"]+/i.test(bodyText) &&
      !/"credentialEnvNames"/i.test(bodyText);

    results.push({
      url: ep.url,
      unauthStatus: unauth.status,
      authStatus: auth.status,
      unauthOk: unauth.status === ep.expectedStatusUnauthed,
      authOk: auth.status === ep.expectedStatusAuthed,
      noSecretLeak: !secretLeak,
      bodyBytes: bodyText.length,
    });
  }

  const ok = results.every((r) => r.unauthOk && r.authOk && r.noSecretLeak);
  console.log(
    JSON.stringify(
      {
        ok,
        dryRun: false,
        results,
        // never echo bearer
      },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.log(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
