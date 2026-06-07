import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getMyBillingStatus } from "@/lib/billing.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * Verifica o status do contrato de cobrança da empresa ativa e redireciona
 * para /conta-suspensa quando o contrato estiver suspenso. Staff Impulsionando
 * nunca é redirecionado.
 */
export function BillingGate() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { companyId } = useActiveCompany();
  const { data: me } = useCurrentUser();
  const fn = useServerFn(getMyBillingStatus);

  const enabled = !!companyId && !me?.isSuperAdmin && !me?.isStaff;
  const { data } = useQuery({
    queryKey: ["billing-gate", companyId],
    enabled,
    queryFn: () => fn({ data: { companyId } }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!enabled || !data) return;
    if (!("hasContract" in data) || !data.hasContract) return;
    if (data.contract.status === "suspended" && pathname !== "/conta-suspensa") {
      navigate({ to: "/conta-suspensa" });
    }
  }, [data, enabled, navigate, pathname]);

  return null;
}
