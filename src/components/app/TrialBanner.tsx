import { Link } from "@tanstack/react-router";
import { Sparkles, AlertTriangle, Clock } from "lucide-react";
import { useMyTrial } from "@/hooks/use-trial";
import { Button } from "@/components/ui/button";

export function TrialBanner() {
  const { trial, daysLeft, isActive, needsPayment, isSuspended } = useMyTrial();
  if (!trial) return null;

  if (isSuspended) {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/40 px-4 py-3 text-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="font-medium text-destructive">
            Você está inadimplente. Seu acesso foi suspenso temporariamente.
          </span>
          <span className="text-muted-foreground">
            Para regularizar sua conta, acesse a área financeira e realize o pagamento pendente.
          </span>
          <Button asChild size="sm" variant="destructive" className="ml-auto">
            <Link to="/finance">Ir para financeiro</Link>
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
            Para continuar usando a plataforma, regularize o pagamento na área financeira.
          </span>
          <Button asChild size="sm" className="ml-auto">
            <Link to="/finance">Pagar agora</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isActive && daysLeft !== null) {
    const isLast = daysLeft <= 1;
    return (
      <div
        className={`w-full border-b px-4 py-2 text-sm ${
          isLast ? "bg-orange-100 border-orange-300 text-orange-900" : "bg-primary/10 border-primary/30"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            {isLast ? "Seu Trial termina amanhã." : `Trial ativo — faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
          </span>
          <span className="text-muted-foreground hidden md:inline">
            {isLast
              ? "Escolha ou confirme seu plano para manter o acesso ativo."
              : "Você está testando a Impulsionando Tecnologia com todos os recursos ativos."}
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
