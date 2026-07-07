/**
 * Pill fixa no topo do menu lateral: monitora o ecossistema em tempo
 * real (poll a cada 30s) e navega para /auditoria ao clicar.
 *
 * Nome fixo: "Status do Sistema".
 *
 * Cores com contraste WCAG AA garantido (fundo sólido + texto claro):
 *  - Verde sólido → todos os recursos funcionais
 *  - Vermelho sólido (pulsando) → há recursos não funcionais
 *  - Âmbar sólido → auditoria indisponível
 *  - Slate sólido → carregando
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEcosystemHealth } from "@/lib/ecosystem-health.functions";

export function AuditStatusPill() {
  const fn = useServerFn(getEcosystemHealth);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ecosystem-health-pill"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const ok = !!data?.overallOk;
  const failing = (data?.down ?? 0) + (data?.openIncidents ?? 0);
  const loading = isLoading || (!data && !isError);

  const tone = loading
    ? "loading"
    : isError
      ? "warn"
      : ok
        ? "ok"
        : "bad";

  const label = "Status do Sistema";
  const sub = loading
    ? "verificando…"
    : isError
      ? "auditoria indisponível"
      : ok
        ? "todos funcionais"
        : `${failing} recurso(s) com falha`;

  const Icon = tone === "ok" ? CheckCircle2 : tone === "bad" ? AlertTriangle : Activity;

  return (
    <Link
      to="/auditoria"
      aria-label={`Status do Sistema — ${sub}`}
      data-testid="audit-status-pill"
      data-status={tone}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Fundos sólidos + texto branco para contraste AA
        tone === "ok" &&
          "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700",
        tone === "bad" &&
          "bg-red-600 border-red-700 text-white hover:bg-red-700 animate-pulse",
        tone === "warn" &&
          "bg-amber-600 border-amber-700 text-white hover:bg-amber-700",
        tone === "loading" &&
          "bg-slate-700 border-slate-800 text-white hover:bg-slate-800",
      )}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 flex flex-col leading-tight">
        <span className="truncate">{label}</span>
        <span className="truncate text-[10px] font-normal opacity-90">{sub}</span>
      </span>
      {!loading && failing > 0 && (
        <span
          className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold bg-white text-red-700"
          data-testid="audit-status-count"
        >
          {failing > 99 ? "99+" : failing}
        </span>
      )}
    </Link>
  );
}
