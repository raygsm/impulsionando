import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function PastDueBanner() {
  const { isPastDue, daysUntilSuspension } = useSubscription();
  if (!isPastDue) return null;

  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2.5 text-sm text-amber-900 flex items-center justify-center gap-2 flex-wrap">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        Falha no pagamento da sua assinatura.{" "}
        {daysUntilSuspension !== null && daysUntilSuspension > 0
          ? `Você tem ${daysUntilSuspension} ${daysUntilSuspension === 1 ? "dia" : "dias"} para regularizar antes da suspensão.`
          : "Regularize agora para evitar a suspensão."}
      </span>
      <Link
        to="/minha-assinatura"
        className="underline font-medium hover:text-amber-950"
      >
        Atualizar pagamento
      </Link>
    </div>
  );
}
