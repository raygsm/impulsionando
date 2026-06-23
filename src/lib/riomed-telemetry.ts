/**
 * @deprecated Use `@/lib/core-telemetry` directly.
 * Backward-compat shim for tenants (Rio Med, etc.) still importing
 * from the old path.
 */
export * from "./core-telemetry";
import { downloadTelemetry as _download } from "./core-telemetry";
export const downloadTelemetry = (format: "json" | "csv") =>
  _download(format, "riomed");
