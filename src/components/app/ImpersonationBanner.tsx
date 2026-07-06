import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { logImpersonation } from "@/lib/impersonation-audit.functions";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner() {
  const {
    isImpersonating,
    impersonatedCompanyId,
    impersonatedCompanyName,
    stopImpersonation,
  } = useImpersonation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logFn = useServerFn(logImpersonation);

  if (!isImpersonating) return null;

  async function handleStop() {
    // Auditoria — não bloqueia o retorno ao master se falhar.
    if (impersonatedCompanyId) {
      try {
        await logFn({
          data: {
            targetCompanyId: impersonatedCompanyId,
            targetCompanyName: impersonatedCompanyName,
            action: "stop",
            userAgent:
              typeof navigator !== "undefined"
                ? navigator.userAgent.slice(0, 400)
                : null,
          },
        } as any);
      } catch {
        /* non-blocking */
      }
    }
    // Cancela queries em voo e limpa cache para evitar que dados do tenant
    // impersonado vazem para a visão do master.
    await queryClient.cancelQueries();
    queryClient.clear();
    stopImpersonation();
    navigate({ to: "/core/clientes", replace: true } as any);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 text-sm shadow"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 shrink-0" aria-hidden />
        <span className="truncate">
          Você está acessando como:{" "}
          <strong className="font-semibold">{impersonatedCompanyName}</strong>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-white/90 hover:bg-white border-amber-900/30 text-amber-950 h-7"
        onClick={handleStop}
      >
        <X className="w-3.5 h-3.5 mr-1" />
        Voltar ao Master
      </Button>
    </div>
  );
}
