import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyTrial } from "@/lib/trial.functions";

export interface TrialRow {
  id: string;
  status: string;
  chosen_plan: string;
  started_at: string | null;
  ends_at: string | null;
  contact_name: string;
}

export function useMyTrial() {
  const fetcher = useServerFn(getMyTrial);
  const query = useQuery({
    queryKey: ["my-trial"],
    queryFn: () => fetcher(),
    staleTime: 60_000,
  });

  const trial = (query.data?.trial as TrialRow | null) ?? null;
  const now = Date.now();
  const ends = trial?.ends_at ? new Date(trial.ends_at).getTime() : null;
  const daysLeft = ends ? Math.max(0, Math.ceil((ends - now) / 86_400_000)) : null;
  const isSuspended = trial?.status === "suspenso" || trial?.status === "expirado_sem_conversao";
  const isActive = trial && ["ativo", "vence_3d", "vence_1d", "vence_hoje"].includes(trial.status);
  const needsPayment = trial?.status === "cobranca_gerada" || trial?.status === "pagamento_pendente";

  return { trial, daysLeft, isSuspended, isActive, needsPayment, ...query };
}
