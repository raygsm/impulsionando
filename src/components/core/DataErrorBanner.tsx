import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Generic data-load error banner with retry. Tenant-agnostic — promoted
 * from Rio Med's ProductsErrorBanner so any module (catalog, listings,
 * dashboards) can reuse it.
 */
export function DataErrorBanner({
  title = "Não foi possível carregar os dados agora.",
  message,
  onRetry,
  isRetrying,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div role="alert" className="mx-auto max-w-7xl px-4">
      <div className="my-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-90 break-words">
            {message ??
              "Houve uma falha temporária. Tente novamente em instantes."}
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
