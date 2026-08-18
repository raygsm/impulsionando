const enabled = process.env.PULSONITOR_ENABLED === "true";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const probeRegion = process.env.PULSONITOR_PROBE_REGION || "core-primary";
const refreshMs = Math.max(5000, Number(process.env.PULSONITOR_REFRESH_MS || 5000));
const maxConcurrency = Math.max(1, Number(process.env.PULSONITOR_MAX_CONCURRENCY || 8));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function headers() {
  return {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
    "Content-Type": "application/json",
  };
}

async function loadTargets() {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/imp_monitoring_targets?is_active=eq.true&select=id,label,target_type,target,interval_seconds,timeout_ms,expected_status`,
    { headers: headers() },
  );
  if (!response.ok) throw new Error(`targets_http_${response.status}`);
  return response.json();
}

async function registerCheck(target, result) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pulsonitor_register_check`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      p_target_id: target.id,
      p_probe_region: probeRegion,
      p_success: result.success,
      p_status_code: result.statusCode,
      p_latency_ms: result.latencyMs,
      p_error_code: result.errorCode,
      p_error_message: result.errorMessage,
      p_response_meta: result.meta || {},
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`register_http_${response.status}:${text.slice(0, 200)}`);
  }
}

async function checkHttp(target) {
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Number(target.timeout_ms || 10000));
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const response = await fetch(target.target, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Impulsionando-Pulsonitor/1.1",
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
      },
    });
    const latencyMs = Date.now() - start;
    const expected = Number(target.expected_status || 200);
    const success = response.status === expected;
    return {
      success,
      statusCode: response.status,
      latencyMs,
      errorCode: success ? null : "unexpected_status",
      errorMessage: success ? null : `Expected ${expected}, received ${response.status}`,
      meta: { finalUrl: response.url, redirected: response.redirected, timeoutMs },
    };
  } catch (error) {
    const cause = error?.cause?.code || error?.cause?.message || null;
    return {
      success: false,
      statusCode: null,
      latencyMs: Date.now() - start,
      errorCode: error?.name === "AbortError" ? "timeout" : "network_error",
      errorMessage: String(cause || error?.message || error).slice(0, 800),
      meta: { timeoutMs, cause: cause ? String(cause).slice(0, 300) : null },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runTarget(target) {
  if (!["https", "http", "health_endpoint"].includes(target.target_type)) {
    await registerCheck(target, {
      success: false,
      statusCode: null,
      latencyMs: null,
      errorCode: "probe_not_implemented",
      errorMessage: `Probe type ${target.target_type} is not implemented by this worker`,
      meta: {},
    });
    return;
  }
  await registerCheck(target, await checkHttp(target));
}

async function main() {
  if (!enabled) {
    console.log("[Pulsonitor] disabled (set PULSONITOR_ENABLED=true to enable)");
    return;
  }
  if (!supabaseUrl || !serviceRole) {
    console.error("[Pulsonitor] disabled: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  console.log(`[Pulsonitor] started in ${probeRegion}; concurrency=${maxConcurrency}`);
  const nextRun = new Map();
  const running = new Set();

  while (true) {
    const now = Date.now();
    try {
      const targets = await loadTargets();
      const due = targets.filter((target) => now >= (nextRun.get(target.id) || 0) && !running.has(target.id));
      for (const target of due.slice(0, Math.max(0, maxConcurrency - running.size))) {
        nextRun.set(target.id, now + Math.max(30, Number(target.interval_seconds || 30)) * 1000);
        running.add(target.id);
        runTarget(target)
          .catch((error) => console.error(`[Pulsonitor] ${target.label}:`, error.message))
          .finally(() => running.delete(target.id));
      }
    } catch (error) {
      console.error("[Pulsonitor] target refresh failed:", error.message);
    }
    await sleep(refreshMs);
  }
}

main().catch((error) => {
  console.error("[Pulsonitor] fatal:", error);
  process.exitCode = 1;
});
