/**
 * /auditoria — dashboard em tempo real do ecossistema Impulsionando.
 *
 * Visível a todos os usuários autenticados (gestores, clientes,
 * funcionários, consumidores). O server function `getEcosystemHealth`
 * filtra os dados por `show_on_public` e nunca devolve URLs, emails
 * ou mensagens de erro sensíveis.
 *
 * Botão "CORRIGIR" aciona o agente Impulsionito via
 * `triggerImpulsionitoFix`, que registra o pedido em
 * `automation_approvals` (mesmo pipeline de aprovações já auditado).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Wrench } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getEcosystemHealth,
  triggerImpulsionitoFix,
  type EcosystemCheck,
} from "@/lib/ecosystem-health.functions";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria em Tempo Real — Impulsionando" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content:
          "Central de auditoria em tempo real do ecossistema Impulsionando: recursos, sistemas, ferramentas, configurações e integrações monitorados 24/7.",
      },
    ],
  }),
  component: AuditoriaPage,
});

function fmtRelative(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `há ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `há ${days} d`;
}

function AuditoriaPage() {
  const fn = useServerFn(getEcosystemHealth);
  const fixFn = useServerFn(triggerImpulsionitoFix);
  const qc = useQueryClient();
  const [lastTriggerAt, setLastTriggerAt] = useState<number>(0);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ecosystem-health"],
    queryFn: () => fn(),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

  const failing = useMemo<EcosystemCheck[]>(
    () => (data?.checks ?? []).filter((c) => !c.paused && !c.isUp),
    [data],
  );
  const healthy = useMemo<EcosystemCheck[]>(
    () => (data?.checks ?? []).filter((c) => !c.paused && c.isUp),
    [data],
  );

  const chartData = useMemo(
    () =>
      (data?.checks ?? [])
        .filter((c) => !c.paused)
        .map((c) => ({
          name: c.label,
          uptime: c.uptime24hPct,
          isUp: c.isUp,
        }))
        .sort((a, b) => a.uptime - b.uptime)
        .slice(0, 24),
    [data],
  );

  const corrigir = useMutation({
    mutationFn: async () => {
      const labels = failing.map((c) => c.label);
      const result = await fixFn({
        data: {
          failingLabels: labels,
          note: `CORRIGIR acionado pela Auditoria — ${labels.length} recurso(s) inativo(s).`,
        },
      });
      return result;
    },
    onSuccess: () => {
      setLastTriggerAt(Date.now());
      toast.success("Impulsionito acionado", {
        description:
          "Recursos inativos encaminhados ao pipeline de aprovações. Acompanhe em /core/automacao/aprovacoes.",
      });
      qc.invalidateQueries({ queryKey: ["ecosystem-health"] });
      qc.invalidateQueries({ queryKey: ["ecosystem-health-pill"] });
    },
    onError: (e) =>
      toast.error("Não foi possível acionar Impulsionito", {
        description: (e as Error).message,
      }),
  });

  const cooldownMs = 30_000;
  const inCooldown = Date.now() - lastTriggerAt < cooldownMs;
  const ok = !!data?.overallOk;

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <PageHeader
        title="Auditoria em Tempo Real"
        description="Monitoramento 24/7 de todos os recursos, sistemas, ferramentas, configurações e integrações do ecossistema Impulsionando."
      />

      {/* Banner de status geral */}
      <Card
        data-testid="audit-banner"
        data-status={ok ? "ok" : "bad"}
        className={cn(
          "p-5 border-l-4 transition-colors",
          ok
            ? "border-l-emerald-500 bg-emerald-500/5"
            : "border-l-red-500 bg-red-500/5",
        )}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            {ok ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
            )}
            <div>
              <div
                className={cn(
                  "text-lg font-semibold",
                  ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}
              >
                {ok ? "Todos os Recursos Funcionais" : "Há recursos não Funcionais"}
              </div>
              <div className="text-xs text-muted-foreground">
                Atualizado {fmtRelative(data?.checkedAt ?? null)} · auto-refresh a cada 15s
              </div>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="btn-refresh"
            >
              <RefreshCw className={cn("w-4 h-4 mr-1.5", isFetching && "animate-spin")} />
              Atualizar agora
            </Button>
            <Button
              variant={ok ? "outline" : "default"}
              size="sm"
              disabled={ok || failing.length === 0 || corrigir.isPending || inCooldown}
              onClick={() => corrigir.mutate()}
              data-testid="btn-corrigir"
              className={cn(!ok && "bg-red-600 hover:bg-red-700 text-white")}
            >
              <Wrench className="w-4 h-4 mr-1.5" />
              {corrigir.isPending
                ? "Acionando Impulsionito…"
                : inCooldown
                  ? "Aguarde…"
                  : "CORRIGIR"}
            </Button>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Recursos monitorados" value={String(data?.total ?? 0)} />
        <StatCard label="Funcionais" value={String(data?.up ?? 0)} />
        <StatCard label="Inativos" value={String(data?.down ?? 0)} />
        <StatCard
          label="Uptime 24h"
          value={`${(data?.uptime24hPct ?? 100).toFixed(2)}%`}
        />
      </div>

      {/* Erro / carregamento */}
      {isError && (
        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-500/5 text-sm">
          Não foi possível carregar a auditoria agora: {(error as Error).message}
        </Card>
      )}
      {isLoading && (
        <Card className="p-6 text-sm text-muted-foreground">Carregando estado do ecossistema…</Card>
      )}

      {/* Recursos inativos */}
      {failing.length > 0 && (
        <section aria-labelledby="failing-title">
          <div className="flex items-center justify-between mb-3">
            <h2 id="failing-title" className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Recursos inativos ({failing.length})
            </h2>
          </div>
          <Card className="divide-y" data-testid="failing-list">
            {failing.map((c) => (
              <div key={c.id} className="p-3 flex items-center gap-3 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.category ?? "geral"} · inativo desde {fmtRelative(c.since)} · uptime 24h {c.uptime24hPct.toFixed(2)}%
                  </div>
                </div>
                <Badge variant="destructive" className="text-[10px]">
                  {c.consecutiveFailures} falha(s)
                </Badge>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Gráfico de uptime 24h por recurso */}
      {chartData.length > 0 && (
        <section aria-labelledby="chart-title">
          <h2 id="chart-title" className="text-lg font-semibold mb-3">
            Uptime 24h por recurso
          </h2>
          <Card className="p-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(2)}%`, "Uptime 24h"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="uptime" radius={[4, 4, 0, 0]}>
                    {chartData.map((c, i) => (
                      <Cell
                        key={i}
                        fill={c.isUp ? "hsl(142 71% 45%)" : "hsl(0 84% 60%)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Barras verdes: recurso ativo. Barras vermelhas: recurso inativo agora. Altura = %
              de tempo ativo nas últimas 24 horas.
            </p>
          </Card>
        </section>
      )}

      {/* Recursos funcionais */}
      {healthy.length > 0 && (
        <section aria-labelledby="healthy-title">
          <h2 id="healthy-title" className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Recursos funcionais ({healthy.length})
          </h2>
          <Card className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" data-testid="healthy-list">
            {healthy.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate flex-1">{c.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {c.uptime24hPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      <Card className="p-4 text-xs text-muted-foreground flex items-start gap-2">
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <div>
          O botão <b>CORRIGIR</b> aciona o agente Impulsionito registrando o pedido em{" "}
          <Link to="/core/automacao/aprovacoes" className="underline hover:text-foreground">
            aprovações de automação
          </Link>
          . O agente analisa cada recurso inativo, propõe correções (via codex ou fluxos N8N
          aprovados) e o pipeline aplica automaticamente após validação.
        </div>
      </Card>
    </div>
  );
}
