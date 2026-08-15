const enabled = process.env.PULSONITOR_ENABLED === "true";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const probeRegion = process.env.PULSONITOR_PROBE_REGION || "core-primary";

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
  const timer = setTimeout(() => controller.abort(), target.timeout_ms || 10000);
  const start = Date.now();
  try {
    const response = await fetch(target.target, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Impulsionando-Pulsonitor/1.0" },
    });
    const latencyMs = Date.now() - start;
    const expected = target.expected_status || 200;
    return {
      success: response.status === expected,
      statusCode: response.status,
      latencyMs,
      errorCode: response.status === expected ? null : "unexpected_status",
      errorMessage: response.status === expected ? null : `Expected ${expected}, received ${response.status}`,
      meta: { finalUrl: response.url },
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      latencyMs: Date.now() - start,
      errorCode: error?.name === "AbortError" ? "timeout" : "network_error",
      errorMessage: String(error?.message || error).slice(0, 800),
      meta: {},
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
  const result = await checkHttp(target);
  await registerCheck(target, result);
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

  console.log(`[Pulsonitor] started in ${probeRegion}`);
  const nextRun = new Map();

  while (true) {
    const now = Date.now();
    try {
      const targets = await loadTargets();
      for (const target of targets) {
        const dueAt = nextRun.get(target.id) || 0;
        if (now < dueAt) continue;
        nextRun.set(target.id, now + Math.max(30, target.interval_seconds || 30) * 1000);
        runTarget(target).catch((error) => console.error(`[Pulsonitor] ${target.label}:`, error.message));
      }
    } catch (error) {
      console.error("[Pulsonitor] target refresh failed:", error.message);
    }
    await sleep(5000);
  }
}

main().catch((error) => {
  console.error("[Pulsonitor] fatal:", error);
  process.exitCode = 1;
});
