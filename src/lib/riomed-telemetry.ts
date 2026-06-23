/**
 * Rio Med — client-side telemetry buffer.
 *
 * Records timed stages and errors for the public product pipeline so the
 * /riomed/debug page can show timing per stage, full stack traces and
 * export everything as JSON/CSV for support.
 *
 * Pure client utility (no SSR / DB). Buffer is in-memory + mirrored to
 * sessionStorage so a hard reload still shows the last events.
 */

const STORAGE_KEY = "riomed:telemetry:v1";
const MAX_ENTRIES = 500;

export type TelemetryEntry = {
  id: string;
  ts: string; // ISO
  scope: string; // e.g. "listProductos"
  stage: string; // e.g. "fx-query" | "supabase-query" | "transform" | "render" | "error"
  durationMs?: number;
  status: "ok" | "error";
  message?: string;
  stack?: string;
  meta?: Record<string, unknown>;
};

type Listener = (entries: TelemetryEntry[]) => void;

const listeners = new Set<Listener>();
let buffer: TelemetryEntry[] = loadInitial();

function loadInitial(): TelemetryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TelemetryEntry[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-MAX_ENTRIES)));
  } catch {
    /* quota — ignore */
  }
}

function emit() {
  persist();
  for (const l of listeners) l(buffer.slice());
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recordTelemetry(entry: Omit<TelemetryEntry, "id" | "ts"> & { ts?: string }) {
  const full: TelemetryEntry = {
    id: uid(),
    ts: entry.ts ?? new Date().toISOString(),
    ...entry,
  };
  buffer.push(full);
  if (buffer.length > MAX_ENTRIES) buffer = buffer.slice(-MAX_ENTRIES);
  emit();
}

export function getTelemetry(): TelemetryEntry[] {
  return buffer.slice();
}

export function clearTelemetry() {
  buffer = [];
  emit();
}

export function subscribeTelemetry(fn: Listener): () => void {
  listeners.add(fn);
  fn(buffer.slice());
  return () => listeners.delete(fn);
}

/**
 * Measure an async stage. Records OK with duration, or error + stack.
 * Re-throws so the caller can still react.
 */
export async function measureStage<T>(
  scope: string,
  stage: string,
  fn: () => Promise<T> | T,
  meta?: Record<string, unknown>,
): Promise<T> {
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const result = await fn();
    const end =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    recordTelemetry({
      scope,
      stage,
      status: "ok",
      durationMs: +(end - start).toFixed(2),
      meta,
    });
    return result;
  } catch (err) {
    const end =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const e = err as Error;
    recordTelemetry({
      scope,
      stage,
      status: "error",
      durationMs: +(end - start).toFixed(2),
      message: e?.message ?? String(err),
      stack: e?.stack,
      meta,
    });
    throw err;
  }
}

/* ---------------------------- export helpers ---------------------------- */

export function telemetryToJson(): string {
  return JSON.stringify(buffer, null, 2);
}

export function telemetryToCsv(): string {
  const cols = ["ts", "scope", "stage", "status", "durationMs", "message", "stack", "meta"];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""').replace(/\r?\n/g, "\\n")}"`;
  };
  const head = cols.join(",");
  const rows = buffer.map((e) =>
    cols
      .map((c) => escape((e as any)[c]))
      .join(","),
  );
  return [head, ...rows].join("\n");
}

export function downloadTelemetry(format: "json" | "csv") {
  if (typeof window === "undefined") return;
  const content = format === "json" ? telemetryToJson() : telemetryToCsv();
  const mime = format === "json" ? "application/json" : "text/csv";
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `riomed-telemetry-${stamp}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
