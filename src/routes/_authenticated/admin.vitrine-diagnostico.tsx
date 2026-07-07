/**
 * /admin/vitrine-diagnostico — diagnóstico admin (noindex) para
 * entender por que uma empresa não aparece na vitrine pública.
 *
 * Mostra: contagens gerais, saúde da view `companies_vitrine_public`
 * (usada por `anon`), e uma tabela por tenant com bandeiras de
 * habilitação, presença de public_slug, permissões e visibilidade
 * real na view.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldAlert, XCircle } from "lucide-react";
import { getVitrineDiagnostics, type VitrineTenantDiagnosis } from "@/lib/vitrine-diagnostics.functions";

export const Route = createFileRoute("/_authenticated/admin/vitrine-diagnostico")({
  head: () => ({
    meta: [
      { title: "Vitrine — Diagnóstico | Admin Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "googlebot", content: "noindex,nofollow" },
      { name: "description", content: "Diagnóstico interno da vitrine pública. Acesso restrito." },
    ],
  }),
  component: VitrineDiagnostico,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 max-w-lg mx-auto space-y-3 text-center">
      <ShieldAlert className="mx-auto size-8 text-destructive" />
      <h1 className="text-xl font-semibold">Não foi possível carregar o diagnóstico</h1>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  ),
});

function VitrineDiagnostico() {
  const fn = useServerFn(getVitrineDiagnostics);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "hidden" | "visible">("all");

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["vitrine-diagnostics", search],
    queryFn: () => fn({ data: { search } }),
  });

  const rows = useMemo(() => {
    const list = data?.tenants ?? [];
    if (filter === "hidden") return list.filter((t) => !t.visibleOnPublicView);
    if (filter === "visible") return list.filter((t) => t.visibleOnPublicView);
    return list;
  }, [data, filter]);

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Vitrine — Diagnóstico</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Página admin (noindex). Verifica habilitação por tenant, <code>public_slug</code>,
            permissões da view <code>companies_vitrine_public</code> e visibilidade real para <code>anon</code>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </header>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Kpi label="Empresas" value={data.totals.companies} />
            <Kpi label="Habilitadas" value={data.totals.enabled} tone="ok" />
            <Kpi label="Desabilitadas" value={data.totals.disabled} tone={data.totals.disabled ? "warn" : undefined} />
            <Kpi label="Sem public_slug" value={data.totals.withoutSlug} tone={data.totals.withoutSlug ? "warn" : undefined} />
            <Kpi label="Sem segmento" value={data.totals.withoutSegment} />
            <Kpi label="Visíveis (anon)" value={data.totals.visibleAnon} tone="ok" />
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              {data.publicView.reachable ? (
                <CheckCircle2 className="size-5 text-emerald-500" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  companies_vitrine_public — {data.publicView.reachable ? "acessível para anon" : "não acessível"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.publicView.reachable
                    ? `Retornou ${data.publicView.rowsAnon} linhas via REST anon.`
                    : data.publicView.error ?? "Erro desconhecido"}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, slug, segmento, cidade…"
              className="pl-8"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "hidden", "visible"] as const).map((k) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
                {k === "all" ? "Todos" : k === "hidden" ? "Ocultos" : "Visíveis"}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Carregando diagnóstico…</div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-destructive">{(error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Nenhum tenant encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="p-2">Empresa</th>
                  <th className="p-2">Slug</th>
                  <th className="p-2">Segmento</th>
                  <th className="p-2">Local</th>
                  <th className="p-2">Habilitada</th>
                  <th className="p-2">Visível (anon)</th>
                  <th className="p-2">Motivos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => <TenantRow key={t.id} t={t} />)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TenantRow({ t }: { t: VitrineTenantDiagnosis }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="p-2 font-medium text-foreground">{t.name}</td>
      <td className="p-2 text-muted-foreground">{t.public_slug ?? <em className="text-destructive">—</em>}</td>
      <td className="p-2 text-muted-foreground">{t.segment ?? "—"}</td>
      <td className="p-2 text-muted-foreground">{[t.city, t.state].filter(Boolean).join("/") || "—"}</td>
      <td className="p-2">
        {t.vitrine_enabled ? (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">ON</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">OFF</Badge>
        )}
      </td>
      <td className="p-2">
        {t.visibleOnPublicView ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <XCircle className="size-4 text-destructive" />
        )}
      </td>
      <td className="p-2">
        {t.reasons.length === 0 ? (
          <span className="text-xs text-emerald-600">OK</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {t.reasons.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-3" /> {r}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  const color =
    tone === "ok" ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn" ? "text-amber-600 dark:text-amber-400"
      : "text-foreground";
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}
