import { Link } from "@tanstack/react-router";
import { AlertTriangle, XCircle, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function PastDueBanner() {
  const { isPastDue, isSuspended, willCancel, daysUntilSuspension, nextBillingAt } =
    useSubscription();

  // Prioridade: suspended > past_due > willCancel
  if (isSuspended) {
    return (
      <div className="w-full bg-red-100 border-b border-red-300 px-4 py-2.5 text-sm text-red-900 flex items-center justify-center gap-2 flex-wrap">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>
          <strong>Acesso suspenso</strong> — sua assinatura foi suspensa por falta de pagamento.
        </span>
        <Link to="/minha-assinatura" className="underline font-medium hover:text-red-950">
          Regularizar agora
        </Link>
      </div>
    );
  }

  if (isPastDue) {
    return (
      <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2.5 text-sm text-amber-900 flex items-center justify-center gap-2 flex-wrap">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Falha no pagamento da sua assinatura.{" "}
          {daysUntilSuspension !== null && daysUntilSuspension > 0
            ? `Você tem ${daysUntilSuspension} ${daysUntilSuspension === 1 ? "dia" : "dias"} para regularizar antes da suspensão.`
            : "Regularize agora para evitar a suspensão."}
        </span>
        <Link to="/minha-assinatura" className="underline font-medium hover:text-amber-950">
          Atualizar pagamento
        </Link>
      </div>
    );
  }

  if (willCancel) {
    const endDate = nextBillingAt
      ? new Date(nextBillingAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      : null;
    return (
      <div className="w-full bg-zinc-100 border-b border-zinc-300 px-4 py-2.5 text-sm text-zinc-800 flex items-center justify-center gap-2 flex-wrap">
        <Clock className="w-4 h-4 shrink-0" />
        <span>
          Cancelamento agendado{endDate ? ` para ${endDate}` : ""}. Mude de ideia?
        </span>
        <Link to="/minha-assinatura" className="underline font-medium hover:text-zinc-950">
          Reativar assinatura
        </Link>
      </div>
    );
  }

  return null;
}
