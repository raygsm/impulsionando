/**
 * @deprecated Use `@/components/core/DataErrorBanner` directly.
 * Backward-compat shim preserving the old API.
 */
import { DataErrorBanner } from "@/components/core/DataErrorBanner";

export function ProductsErrorBanner(props: {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <DataErrorBanner
      title="Não foi possível carregar os produtos agora."
      message={
        props.message ??
        "Houve uma falha temporária ao consultar o catálogo. Tente novamente em instantes."
      }
      onRetry={props.onRetry}
      isRetrying={props.isRetrying}
    />
  );
}
