import { Link } from "@tanstack/react-router";
import { Sparkles, AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useMyTrial } from "@/hooks/use-trial";
import { Button } from "@/components/ui/button";

function useCountdown(endsAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0 };
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s, total: diff };
}

export function TrialBanner() {
  const { trial, daysLeft, isActive, needsPayment, isSuspended } = useMyTrial();
  const cd = useCountdown(trial?.ends_at);
  if (!trial) return null;

  if (isSuspended) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/40 px-4 py-3 text-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="font-medium text-destructive">
            Acesso suspenso — Trial expirado sem pagamento.
          </span>
          <span className="text-muted-foreground">
            Regularize sua conta na área financeira para retomar o acesso.
          </span>
          <Button asChild size="sm" variant="destructive" className="ml-auto">
            <Link to="/finance">Regularizar agora</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (needsPayment) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-3 text-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <Clock className="w-4 h-4 text-orange-700 shrink-0" />
          <span className="font-medium text-orange-900">Seu Trial terminou.</span>
          <span className="text-orange-900/80">
            Você tem até 24h para regularizar antes da suspensão automática.
          </span>
          <Button asChild size="sm" className="ml-auto">
            <Link to="/finance">Pagar agora</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isActive && daysLeft !== null && cd) {
    const isLast = daysLeft <= 1;
    const countdownLabel =
      cd.d > 0
        ? `${cd.d}d ${String(cd.h).padStart(2, "0")}h ${String(cd.m).padStart(2, "0")}m`
        : `${String(cd.h).padStart(2, "0")}h ${String(cd.m).padStart(2, "0")}m ${String(cd.s).padStart(2, "0")}s`;
    return (
      <div
        className={`w-full border-b px-4 py-2 text-sm ${
          isLast ? "bg-orange-100 border-orange-300 text-orange-900" : "bg-primary/10 border-primary/30"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            {isLast ? "Últimas horas do seu Trial:" : "Trial ativo —"}
          </span>
          <span className="font-mono tabular-nums text-base font-semibold">{countdownLabel}</span>
          <span className="text-muted-foreground hidden md:inline">
            {isLast
              ? "Escolha ou confirme seu plano para manter o acesso ativo."
              : "Você está testando a Impulsionando com todos os recursos liberados."}
          </span>
          <div className="ml-auto flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/planos">Ver planos</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/finance">Ir para financeiro</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
