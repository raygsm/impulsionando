import {
  ErrorEnvelopeSchema,
  type ErrorBody,
} from "@impulsionando/contracts";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | null;
  readonly envelope: ErrorBody | null;

  constructor(input: {
    status: number;
    message: string;
    code?: string;
    correlationId?: string | null;
    envelope?: ErrorBody | null;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.code = input.code ?? "INTERNAL";
    this.correlationId = input.correlationId ?? null;
    this.envelope = input.envelope ?? null;
  }

  get unauthenticated(): boolean {
    return this.status === 401 || this.code === "UNAUTHENTICATED";
  }

  get forbidden(): boolean {
    return this.status === 403 || this.code === "FORBIDDEN";
  }

  get notFound(): boolean {
    return this.status === 404 || this.code === "NOT_FOUND";
  }

  get conflict(): boolean {
    return this.status === 409 || this.code === "CONFLICT" || this.code === "IDEMPOTENCY_REPLAY";
  }

  get degraded(): boolean {
    return this.status >= 500 || this.code === "INTERNAL" || this.code.endsWith("_UNAVAILABLE");
  }
}

export function parseErrorEnvelope(body: unknown, status: number, fallbackCorrelationId: string): ApiClientError {
  const parsed = ErrorEnvelopeSchema.safeParse(body);
  if (parsed.success) {
    return new ApiClientError({
      status,
      message: parsed.data.error.message,
      code: parsed.data.error.code,
      correlationId: parsed.data.error.correlationId,
      envelope: parsed.data.error,
    });
  }
  return new ApiClientError({
    status,
    message: `HTTP ${status}`,
    code: status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "INTERNAL",
    correlationId: fallbackCorrelationId,
  });
}
