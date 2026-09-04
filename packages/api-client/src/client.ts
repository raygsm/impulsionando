import {
  CORRELATION_ID_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  ErrorEnvelopeSchema,
} from "@impulsionando/contracts";
import { ApiClientError, parseErrorEnvelope } from "./errors";

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  getCorrelationId?: () => string;
};

const IDEMPOTENT = new Set(["GET", "HEAD"]);
const MAX_GET_RETRIES = 2;

function newCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createApiClient(opts: ApiClientOptions) {
  const baseUrl = opts.baseUrl.replace(/\/$/, "");

  async function request<T>(
    method: string,
    path: string,
    init?: {
      body?: unknown;
      query?: Record<string, string | undefined>;
      idempotencyKey?: string;
      accessToken?: string | null;
    },
  ): Promise<{ data: T; correlationId: string; status: number }> {
    if (!baseUrl) {
      throw new ApiClientError({
        status: 503,
        code: "API_NOT_CONFIGURED",
        message: "Nest API base URL is not configured",
        correlationId: newCorrelationId(),
      });
    }

    const correlationId = opts.getCorrelationId?.() ?? newCorrelationId();
    const url = new URL(path.startsWith("http") ? path : `${baseUrl}${path}`);
    if (init?.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v) url.searchParams.set(k, v);
      }
    }

    const token = init?.accessToken ?? (await opts.getAccessToken?.()) ?? null;
    const headers: Record<string, string> = {
      accept: "application/json",
      [CORRELATION_ID_HEADER]: correlationId,
    };
    if (token) headers.authorization = `Bearer ${token}`;
    if (init?.body !== undefined) headers["content-type"] = "application/json";
    if (init?.idempotencyKey) headers[IDEMPOTENCY_KEY_HEADER] = init.idempotencyKey;

    let lastError: unknown;
    const attempts = IDEMPOTENT.has(method) ? MAX_GET_RETRIES : 1;
    for (let i = 0; i < attempts; i += 1) {
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
        });
        let json: unknown = null;
        const text = await res.text();
        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            json = { raw: text };
          }
        }
        if (!res.ok) {
          throw parseErrorEnvelope(json, res.status, correlationId);
        }
        const envelope = json as { data?: T; meta?: { correlationId?: string } };
        return {
          data: envelope.data as T,
          correlationId: envelope.meta?.correlationId ?? correlationId,
          status: res.status,
        };
      } catch (err) {
        lastError = err;
        if (err instanceof ApiClientError) throw err;
        if (i === attempts - 1) break;
      }
    }
    const msg = lastError instanceof Error ? lastError.message : "Network error";
    throw new ApiClientError({
      status: 503,
      code: "NETWORK_UNAVAILABLE",
      message: msg,
      correlationId,
    });
  }

  return {
    baseUrl,
    get: <T>(path: string, query?: Record<string, string | undefined>, accessToken?: string | null) =>
      request<T>("GET", path, { query, accessToken }),
    post: <T>(path: string, body: unknown, extra?: { idempotencyKey?: string; accessToken?: string | null }) =>
      request<T>("POST", path, { body, ...extra }),
    patch: <T>(path: string, body: unknown, extra?: { idempotencyKey?: string; accessToken?: string | null }) =>
      request<T>("PATCH", path, { body, ...extra }),
    isErrorEnvelope: (body: unknown) => ErrorEnvelopeSchema.safeParse(body).success,
  };
}

export type ImpulsionandoApiClient = ReturnType<typeof createApiClient>;
