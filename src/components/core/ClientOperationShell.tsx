import { Link } from "@tanstack/react-router";
import { Lock, AlertTriangle, Loader2 } from "lucide-react";
import {
  useClientFeatureGate,
  GATE_REASON_LABEL,
  type ClientFeatureGateResult,
} from "@/hooks/use-client-feature-gate";
import { Button } from "@/components/ui/button";

interface ClientOperationShellProps {
  companyId: string | null | undefined;
  companySlug: string;
  moduleSlug: string | null;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * ClientOperationShell — wrapper padrão para qualquer rota operacional de tenant
 * em `/admin/clientes/{slug}/operacao/{modulo}`. Aplica o gate unificado e renderiza
 * a UI de bloqueio quando o cliente / módulo / plano / financeiro não permite.
 */
export function ClientOperationShell({
  companyId,
  companySlug,
  moduleSlug,
  title,
  description,
  children,
}: ClientOperationShellProps) {
  const gate = useClientFeatureGate(companyId, moduleSlug);
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <a
          href={`/admin/clientes/${companySlug}`}
          className="text-xs text-muted-foreground underline"
        >
          ← Voltar ao card do cliente
        </a>
      </header>
      <GateBody gate={gate}>{children}</GateBody>
    </div>
  );
}

function GateBody({
  gate,
  children,
}: {
  gate: ClientFeatureGateResult;
  children: React.ReactNode;
}) {
  if (gate.loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando acesso ao módulo…
      </div>
    );
  }
  if (gate.allowed) return <>{children}</>;

  const isHardBlock =
    gate.reason === "tenant_archived" ||
    gate.reason === "tenant_inactive" ||
    gate.reason === "forbidden";

  return (
    <div className="rounded-md border bg-card p-6">
      <div className="flex items-start gap-3">
        {isHardBlock ? (
          <Lock className="h-5 w-5 text-destructive" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        )}
        <div className="space-y-2">
          <p className="font-medium">Acesso não liberado</p>
          <p className="text-sm text-muted-foreground">
            {GATE_REASON_LABEL[gate.reason]}
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" size="sm">
              <a href="/admin/clientes">Ir para Clientes</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
