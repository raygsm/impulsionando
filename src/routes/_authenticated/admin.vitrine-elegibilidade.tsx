/**
 * /admin/vitrine-elegibilidade — Página admin (noindex) que roda a
 * regra de elegibilidade do plano Core Tenants em cima de `companies`
 * e mostra por tenant por que NÃO está na vitrine.
 *
 * Depende de `getVitrineEligibility` (src/lib/vitrine-eligibility.functions.ts).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, XCircle, PauseCircle, ShieldAlert, RefreshCw } from "lucide-react";
import {
  getVitrineEligibility,
  type EligibilityStatus,
  type TenantEligibility,
} from "@/lib/vitrine-eligibility.functions";

export const Route = createFileRoute("/_authenticated/admin/vitrine-elegibilidade")({
  head: () => ({
    meta: [
      { title: "Vitrine — Elegibilidade | Admin Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Regras de elegibilidade automática da Vitrine." },
    ],
  }),
  component: VitrineElegibilidade,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 max-w-lg mx-auto text-center space-y-3">
      <ShieldAlert className="mx-auto size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  ),
});

const STATUS_META: Record<EligibilityStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  eligible:     { label: "Elegível",       className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", Icon: CheckCircle2 },
  missing_data: { label: "Faltam dados",   className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20", Icon: AlertTriangle },
  disabled:     { label: "Vitrine OFF",    className: "bg-muted text-muted-foreground border-border", Icon: PauseCircle },
  blocked:      { label: "Bloqueada",      className: "bg-destructive/10 text-destructive border-destructive/20", Icon: XCircle },
};

function VitrineElegibilidade() {
  const fn = useServerFn(getVitrineEligibility);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["vitrine-eligibility"],
    queryFn: () => fn(),
  });
  const [filter, setFilter] = useState<"all" | EligibilityStatus>("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = data?.tenants ?? [];
    const needle = search.trim().toLowerCase();
    return list.filter((t) => {
      if (filter !== "all" && t.eligibility !== filter) return false;
      if (!needle) return true;
      return [t.name, t.public_slug, t.segment, t.city].filter(Boolean).some((v) => (v as string).toLowerCase().includes(needle));
    });
  }, [data, filter, search]);

  return (
    <div className="space-y-6 max-w-7xl" data-testid="vitrine-eligibility-page">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Elegibilidade da Vitrine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Regra automática do Core: um tenant só aparece na vitrine quando ativo, com vitrine
            habilitada, nicho, cidade, slug e CTA público.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </header>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Kpi label="Tenants" value={data.totals.companies} />
          <Kpi label="Elegíveis" value={data.totals.eligible} tone="ok" />
          <Kpi label="Faltam dados" value={data.totals.missing_data} tone="warn" />
          <Kpi label="Vitrine OFF" value={data.totals.disabled} />
          <Kpi label="Bloqueados" value={data.totals.blocked} tone={data.totals.blocked ? "danger" : undefined} />
          <Kpi label="Visíveis (anon)" value={data.totals.visible} tone="ok" />
        </div>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, slug, cidade…" className="flex-1" />
          <div className="flex flex-wrap gap-1">
            {(["all", "eligible", "missing_data", "disabled", "blocked"] as const).map((k) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
                {k === "all" ? "Todos" : STATUS_META[k].label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum tenant corresponde.</div>
        ) : (
          <ul className="divide-y" data-testid="eligibility-list">
            {rows.map((t) => <Row key={t.id} t={t} />)}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ t }: { t: TenantEligibility }) {
  const meta = STATUS_META[t.eligibility];
  const Icon = meta.Icon;
  return (
    <li className="py-3 flex items-start gap-3" data-testid={`tenant-${t.id}`} data-eligibility={t.eligibility}>
      <Icon className="size-5 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{t.name}</span>
          <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
          {t.visibleOnPublicView ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">visível anon</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">oculto</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {[t.segment, [t.city, t.state].filter(Boolean).join("/"), t.public_slug ?? "sem slug"]
            .filter(Boolean).join(" · ")}
        </div>
        {t.missing.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2" data-testid="missing-fields">
            {t.missing.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-3" /> {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "danger" }) {
  const color =
    tone === "ok" ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn" ? "text-amber-600 dark:text-amber-400"
      : tone === "danger" ? "text-destructive"
      : "text-foreground";
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}
