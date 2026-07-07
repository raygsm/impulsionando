/**
 * Pill fixa no topo do menu lateral: monitora o ecossistema em tempo
 * real (poll a cada 30s) e navega para /auditoria ao clicar.
 *
 * Verde  → "Todos os Recursos Funcionais"
 * Vermelho → "Há recursos não Funcionais"
 * Cinza → carregando / sem dados
 *
 * Não expõe URLs, emails ou mensagens de erro. Só o resumo permitido
 * pelo server function `getEcosystemHealth`.
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

  const label = loading
    ? "Verificando recursos…"
    : isError
      ? "Auditoria indisponível"
      : ok
        ? "Todos os Recursos Funcionais"
        : "Há recursos não Funcionais";

  const Icon = tone === "ok" ? CheckCircle2 : tone === "bad" ? AlertTriangle : Activity;

  return (
    <Link
      to="/auditoria"
      aria-label={`Auditoria em tempo real — ${label}`}
      data-testid="audit-status-pill"
      data-status={tone}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors border",
        tone === "ok" &&
          "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400",
        tone === "bad" &&
          "bg-red-500/10 border-red-500/50 text-red-600 hover:bg-red-500/15 dark:text-red-400 animate-pulse",
        tone === "warn" &&
          "bg-amber-500/10 border-amber-500/40 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400",
        tone === "loading" &&
          "bg-muted/40 border-border text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "inline-block w-2.5 h-2.5 rounded-full shrink-0",
          tone === "ok" && "bg-emerald-500",
          tone === "bad" && "bg-red-500",
          tone === "warn" && "bg-amber-500",
          tone === "loading" && "bg-muted-foreground/40",
        )}
        aria-hidden="true"
      />
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 truncate font-medium">{label}</span>
      {!loading && failing > 0 && (
        <span
          className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold bg-red-500 text-white"
          data-testid="audit-status-count"
        >
          {failing > 99 ? "99+" : failing}
        </span>
      )}
    </Link>
  );
}
