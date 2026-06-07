import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useNavigate } from "@tanstack/react-router";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedCompanyName, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 text-sm shadow">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Você está acessando como: <strong className="font-semibold">{impersonatedCompanyName}</strong>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="bg-white/90 hover:bg-white border-amber-900/30 text-amber-950 h-7"
        onClick={() => {
          stopImpersonation();
          navigate({ to: "/core/clientes" });
        }}
      >
        <X className="w-3.5 h-3.5 mr-1" />
        Voltar ao Master
      </Button>
    </div>
  );
}
