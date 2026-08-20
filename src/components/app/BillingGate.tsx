import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getMyBillingStatus } from "@/lib/billing.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { useCurrentUser } from "@/hooks/use-current-user";

function isFinancialPath(pathname: string) {
  return (
    pathname.startsWith("/finance") ||
    pathname.startsWith("/minha-assinatura") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/auth")
  );
}

function isPlanActivationPath(pathname: string) {
  return isFinancialPath(pathname) || pathname.startsWith("/planos");
}

/**
 * Gate financeiro universal do Core.
 *
 * Regras:
 * - Staff Impulsionando não é bloqueado.
 * - Empresa sem contrato válido fica em onboarding financeiro até contratar.
 * - Empresa suspensa por inadimplência mantém somente acesso financeiro.
 * - O dashboard continua visível, porém bloqueado por uma camada de marca-d'água.
 * - O status é reconsultado automaticamente para liberar a conta assim que o
 *   pagamento for identificado e o contrato voltar a active.
 */
export function BillingGate() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { companyId } = useActiveCompany();
  const { data: me } = useCurrentUser();
  const fn = useServerFn(getMyBillingStatus);

  const enabled = !!companyId && !me?.isSuperAdmin && !me?.isImpulsionandoStaff;
  const { data } = useQuery({
    queryKey: ["billing-gate", companyId],
    enabled,
    queryFn: () => fn({ data: { companyId } }),
    staleTime: 15_000,
    refetchInterval: enabled ? 15_000 : false,
    refetchOnWindowFocus: true,
  });

  const hasContract = !!data && "hasContract" in data && data.hasContract;
  const planRequired = !!data && "hasContract" in data && !data.hasContract;
  const suspended = hasContract && data.contract.status === "suspended";
  const restricted = planRequired || suspended;

  useEffect(() => {
    if (!enabled || !data || !restricted) return;

    const allowed = suspended
      ? isFinancialPath(pathname)
      : isPlanActivationPath(pathname);

    // O dashboard pode ser visto como referência, mas fica totalmente bloqueado
    // pela marca-d'água abaixo. Demais áreas são redirecionadas ao financeiro.
    if (pathname === "/dashboard" || allowed) return;

    navigate({
      to: planRequired ? "/planos" : "/minha-assinatura",
      replace: true,
    });
  }, [data, enabled, navigate, pathname, planRequired, restricted, suspended]);

  if (!enabled || !data || !restricted || pathname !== "/dashboard") return null;

  const title = suspended ? "Conta suspensa por inadimplência" : "Ativação do plano necessária";
  const message = suspended
    ? "Seu dashboard permanece visível somente para consulta. O restante do sistema está bloqueado até a identificação do pagamento."
    : "Seu ambiente já faz parte do Core, mas o acesso operacional será liberado após a contratação e ativação do plano.";
  const actionLabel = suspended ? "Regularizar pagamento" : "Escolher e ativar plano";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/75 backdrop-blur-[1px] p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 whitespace-nowrap text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.18em] text-foreground/5">
          ACESSO FINANCEIRO
        </div>
      </div>

      <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl text-center">
        <div className="mx-auto mb-3 h-2 w-16 rounded-full bg-amber-500" />
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Assim que o pagamento for confirmado pelo Core, o acesso completo é restabelecido automaticamente.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() =>
            navigate({
              to: suspended ? "/minha-assinatura" : "/planos",
            })
          }
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
