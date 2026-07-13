// Client HTTP para a API pública da Hostinger.
// SERVER-ONLY: usa HOSTINGER_API_TOKEN (secret). Nunca importar do bundle client.
// Docs: https://developers.hostinger.com/
//
// Regras:
// - Lê process.env.HOSTINGER_API_TOKEN DENTRO da função (Cloudflare Workers).
// - Backoff simples em 429/5xx (até 3 tentativas).
// - Grava log em core_integration_logs para auditoria/diagnóstico.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://developers.hostinger.com/api";

export interface HostingerRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string; // ex.: "/domains/v1/portfolio"
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Nome curto pra log/observabilidade. */
  op: string;
}

export interface HostingerResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

function buildUrl(path: string, query?: HostingerRequestOptions["query"]): string {
  const url = new URL(path.startsWith("/") ? `${BASE_URL}${path}` : path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function logCall(op: string, status: number, ok: boolean, error?: string) {
  try {
    await (supabaseAdmin as any)
      .from("core_integration_logs")
      .insert({
        integration_slug: "hostinger",
        op,
        http_status: status,
        success: ok,
        error_message: error ?? null,
      });
  } catch {
    // silencioso — log é best-effort
  }
}

export async function hostingerFetch<T = unknown>(
  opts: HostingerRequestOptions,
): Promise<HostingerResponse<T>> {
  const token = process.env.HOSTINGER_API_TOKEN;
  if (!token) {
    return { ok: false, status: 0, data: null, error: "HOSTINGER_API_TOKEN ausente" };
  }

  const url = buildUrl(opts.path, opts.query);
  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  };

  let lastStatus = 0;
  let lastError: string | undefined;
  let lastData: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, init);
      lastStatus = res.status;
      const text = await res.text();
      try {
        lastData = text ? JSON.parse(text) : null;
      } catch {
        lastData = text;
      }
      if (res.ok) {
        await logCall(opts.op, res.status, true);
        return { ok: true, status: res.status, data: lastData as T };
      }
      // 429/5xx → retry com backoff
      if (res.status === 429 || res.status >= 500) {
        lastError = typeof lastData === "string" ? lastData : JSON.stringify(lastData);
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      // erro definitivo (4xx)
      const msg =
        (lastData as any)?.message ??
        (lastData as any)?.error ??
        `HTTP ${res.status}`;
      await logCall(opts.op, res.status, false, String(msg));
      return { ok: false, status: res.status, data: lastData as T, error: String(msg) };
    } catch (err: any) {
      lastError = err?.message ?? String(err);
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }

  await logCall(opts.op, lastStatus, false, lastError ?? "erro de rede");
  return { ok: false, status: lastStatus, data: lastData as T, error: lastError };
}
