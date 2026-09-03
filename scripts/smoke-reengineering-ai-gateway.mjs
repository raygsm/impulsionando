#!/usr/bin/env node
/**
 * Phase 6A–6F smoke — AI gateway capabilities / policy / tools / metrics / agents / effects + pilot chat.
 *
 * Modes (PHASE6_SMOKE_MODE):
 *   full (default) — gateway matrix + optional allow tenant agents/effects
 *   deny-only      — only GET /ai/agents/:denyTenantId expecting 403
 *
 * Env:
 *   PHASE6_AI_BEARER | PHASE5G_OPS_BEARER
 *   PHASE6_AI_TENANT_ID
 *   PHASE6_AI_DENY_TENANT_ID
 *   DRY_RUN=0 for live
 *
 * Never prints Bearer token or other secrets.
 */
const STAGING_API_DEFAULT = "https://api.stg.impulsionando.com.br";

const dryRun = process.env.DRY_RUN !== "0";
const base = (process.env.PHASE3_API_BASE || STAGING_API_DEFAULT).replace(/\/$/, "");
const tenantId = process.env.PHASE6_AI_TENANT_ID?.trim() || "";
const denyTenantId = process.env.PHASE6_AI_DENY_TENANT_ID?.trim() || "";
const mode = (process.env.PHASE6_SMOKE_MODE || "full").trim();

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

function buildEndpoints() {
  if (mode === "deny-only") {
    if (!denyTenantId) {
      throw new Error("PHASE6_AI_DENY_TENANT_ID required for deny-only mode");
    }
    return [
      {
        id: "agents-deny",
        method: "GET",
        url: `${base}/api/v1/ai/agents/${denyTenantId}`,
        expectedStatusAuthed: [403],
        expectedStatusUnauthed: 401,
      },
      {
        id: "chat-deny-tenant",
        method: "POST",
        url: `${base}/api/v1/ai/chat`,
        body: {
          message: "list my support tickets",
          tenantId: denyTenantId,
        },
        /**
         * 403 if chat disabled; else 200 with refused AI_UNAUTHORIZED (Wave 1 membership).
         */
        expectedStatusAuthed: [200, 201, 403],
        expectedStatusUnauthed: 401,
        chatPilot: true,
        expectRefuseCode: "AI_UNAUTHORIZED",
      },
    ];
  }

  const endpoints = [
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
  ];

  if (tenantId) {
    endpoints.push({
      id: "agents-get",
      method: "GET",
      url: `${base}/api/v1/ai/agents/${tenantId}`,
      expectedStatusAuthed: [200, 403, 404],
      expectedStatusUnauthed: 401,
    });
    endpoints.push({
      id: "effects-create",
      method: "POST",
      url: `${base}/api/v1/ai/effects/requests`,
      body: {
        tenantId,
        toolId: "effect.gated.noop",
        idempotencyKey: `phase6-smoke-${Date.now()}`,
        reason: "phase6 smoke create (no side effect)",
      },
      expectedStatusAuthed: [200, 201, 403],
      expectedStatusUnauthed: 401,
    });
  }

  return endpoints;
}

async function main() {
  assertStagingLikeUrl(base);
  const endpoints = buildEndpoints();

  const plan = {
    ok: true,
    dryRun,
    mode,
    tenantIdConfigured: Boolean(tenantId),
    denyTenantIdConfigured: Boolean(denyTenantId),
    endpoints,
    authHeader: "Authorization: Bearer <PHASE6_AI_BEARER>",
    notes: [
      "Auth required on all endpoints",
      "Responses must not contain secret/password/token field values",
      "With AI_CHAT_ENABLED: chat returns 200 grounded or refused; without: 403",
      "deny-only mode expects agents 403 + chat refuse AI_UNAUTHORIZED when enabled",
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
  for (const ep of endpoints) {
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
        if (ep.expectRefuseCode) {
          chatShapeOk =
            chatShapeOk && data.refused === true && data.code === ep.expectRefuseCode;
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
        mode,
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
