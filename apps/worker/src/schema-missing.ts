/**
 * Detect PostgREST / Postgres errors that mean migration/RPC/table is absent.
 * Used so optional Phase 5C–5F worker features degrade once instead of spamming.
 */

export type SchemaMissingLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function asLikeError(err: unknown): SchemaMissingLikeError | null {
  if (!err || typeof err !== "object") {
    if (typeof err === "string") return { message: err };
    return null;
  }
  const e = err as Record<string, unknown>;
  return {
    code: typeof e.code === "string" ? e.code : null,
    message: typeof e.message === "string" ? e.message : null,
    details: typeof e.details === "string" ? e.details : null,
    hint: typeof e.hint === "string" ? e.hint : null,
  };
}

export function schemaMissingErrorMessage(err: unknown): string {
  const e = asLikeError(err);
  if (!e) return err instanceof Error ? err.message : String(err);
  const parts = [e.code, e.message, e.details, e.hint].filter(Boolean);
  return parts.join(" | ") || String(err);
}

/**
 * True when the failure is almost certainly "DDL/RPC not applied yet"
 * (safe to degrade + probe later) rather than a transient network blip.
 */
export function isSchemaOrRpcMissingError(err: unknown): boolean {
  const e = asLikeError(err);
  if (!e) return false;

  const code = (e.code ?? "").toUpperCase();
  // PostgREST schema-cache / missing RPC or relation
  if (
    code === "PGRST202" ||
    code === "PGRST203" ||
    code === "PGRST204" ||
    code === "PGRST205"
  ) {
    return true;
  }
  // Postgres undefined_function / undefined_table
  if (code === "42883" || code === "42P01") {
    return true;
  }

  const blob = `${e.message ?? ""} ${e.details ?? ""} ${e.hint ?? ""}`.toLowerCase();
  if (blob.includes("could not find the function")) return true;
  if (blob.includes("schema cache")) return true;
  if (blob.includes("does not exist")) {
    return (
      blob.includes("function") ||
      blob.includes("relation") ||
      blob.includes("table") ||
      blob.includes("rpc")
    );
  }
  return false;
}

/** Log a structured worker event at most once until reset(). */
export function createOnceLogger(eventName: string) {
  let logged = false;
  return {
    get hasLogged() {
      return logged;
    },
    reset() {
      logged = false;
    },
    log(message: string, extra: Record<string, unknown> = {}): boolean {
      if (logged) return false;
      logged = true;
      console.error(
        JSON.stringify({
          ok: false,
          service: "impulsionando-worker",
          event: eventName,
          message,
          ...extra,
          at: new Date().toISOString(),
        }),
      );
      return true;
    },
  };
}
