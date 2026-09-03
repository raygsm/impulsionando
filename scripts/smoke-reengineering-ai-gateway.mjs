#!/usr/bin/env node
/**
 * Phase 6A–6F smoke — AI gateway capabilities / policy / tools / metrics + pilot chat.
 *
 * Operator (staging only, after API deploy with AiModule + AI_CHAT_ENABLED for 6C):
 * 1. Deploy API image that includes apps/api/src/ai/.
 * 2. Export a staging Bearer as PHASE6_AI_BEARER (or PHASE5G_OPS_BEARER fallback).
 * 3. Export DRY_RUN=0 and run against api.stg only.
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

function hasSecretLeak(bodyText) {
  return (
    /"(secret|password|token|api[_-]?key|authorization)"\s*:\s*"[^"]+/i.test(bodyText) &&
    !/"credentialEnvNames"|policyEnvNames/i.test(bodyText)
  );
}

async function main() {
  assertStagingLikeUrl(base);

  const plan = {
    ok: true,
    dryRun,
    endpoints: [
      {
        id: "capabilities",
        method: "GET",
        url: `${base}/api/v1/ai/capabilities`,
        expectedStatusAuthed: 200,
        expectedStatusUnauthed: 401,
      },
      {
        id: "policy",
        method: "GET",
        url: `${base}/api/v1/ai/policy`,
        expectedStatusAuthed: 200,
        expectedStatusUnauthed: 401,
      },
      {
        id: "tools",
        method: "GET",
        url: `${base}/api/v1/ai/tools`,
        expectedStatusAuthed: 200,
        expectedStatusUnauthed: 401,
      },
      {
        id: "metrics",
        method: "GET",
        url: `${base}/api/v1/ai/metrics`,
        expectedStatusAuthed: 200,
        expectedStatusUnauthed: 401,
      },
      {
        id: "chat-ambiguous",
        method: "POST",
        url: `${base}/api/v1/ai/chat`,
        body: { message: "hello what can you do?" },
        /**
         * 403 AI_CHAT_NOT_ENABLED (flag off) OR 200 refused AI_AMBIGUOUS (6C on).
         */
        /** 200 preferred (@HttpCode OK); 201 tolerated on older images; 403 if AI_CHAT_ENABLED off */
        expectedStatusAuthed: [200, 201, 403],
        expectedStatusUnauthed: 401,
        chatPilot: true,
      },
      {
        id: "chat-list",
        method: "POST",
        url: `${base}/api/v1/ai/chat`,
        body: { message: "list my support tickets" },
        expectedStatusAuthed: [200, 201, 403],
        expectedStatusUnauthed: 401,
        chatPilot: true,
        expectGroundedWhenEnabled: true,
      },
    ],
    authHeader: "Authorization: Bearer <PHASE6_AI_BEARER>",
    notes: [
      "Auth required on all endpoints",
      "Responses must not contain secret/password/token field values",
      "With AI_CHAT_ENABLED: chat returns 200 grounded or refused; without: 403",
      "GET /ai/metrics retention=in-memory-ring; canaryStatus=UNKNOWN",
      "Do not deploy to prod",
    ],
  };

  if (dryRun) {
    console.log(JSON.stringify({ ...plan, message: "DRY_RUN=1 — no HTTP request sent" }, null, 2));
    return;
  }

  const bearer = process.env.PHASE6_AI_BEARER || process.env.PHASE5G_OPS_BEARER;
  if (!bearer) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "Set PHASE6_AI_BEARER (value never logged) or keep DRY_RUN=1",
      }),
    );
    process.exit(1);
  }

  const results = [];
  for (const ep of plan.endpoints) {
    const unauth = await fetch(ep.url, {
      method: ep.method,
      headers: ep.method === "POST" ? { "content-type": "application/json" } : undefined,
      body: ep.method === "POST" ? JSON.stringify(ep.body ?? {}) : undefined,
    });

    const authHeaders = {
      authorization: `Bearer ${bearer}`,
      "x-correlation-id": `phase6-smoke-${Date.now()}`,
    };
    if (ep.method === "POST") {
      authHeaders["content-type"] = "application/json";
    }

    const auth = await fetch(ep.url, {
      method: ep.method,
      headers: authHeaders,
      body: ep.method === "POST" ? JSON.stringify(ep.body ?? {}) : undefined,
    });

    let bodyText = "";
    try {
      bodyText = await auth.text();
    } catch {
      bodyText = "";
    }

    const expectedAuthed = Array.isArray(ep.expectedStatusAuthed)
      ? ep.expectedStatusAuthed
      : [ep.expectedStatusAuthed];

    let chatShapeOk = true;
    if (ep.chatPilot && auth.status === 200) {
      try {
        const json = JSON.parse(bodyText);
        const data = json.data ?? {};
        chatShapeOk =
          typeof data.modelId === "string" &&
          typeof data.promptVersion === "string" &&
          Array.isArray(data.sources) &&
          (data.refused === true || typeof data.answer === "string");
        if (ep.expectGroundedWhenEnabled && data.refused === false) {
          chatShapeOk = chatShapeOk && typeof data.answer === "string" && data.answer.length > 0;
        }
      } catch {
        chatShapeOk = false;
      }
    }

    results.push({
      id: ep.id,
      url: ep.url,
      method: ep.method,
      unauthStatus: unauth.status,
      authStatus: auth.status,
      unauthOk: unauth.status === ep.expectedStatusUnauthed,
      authOk: expectedAuthed.includes(auth.status) && chatShapeOk,
      noSecretLeak: !hasSecretLeak(bodyText),
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
