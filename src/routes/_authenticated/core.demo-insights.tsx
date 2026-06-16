import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { fetchDemoInsights } from "@/lib/demo-track.functions";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/core/demo-insights")({
  head: () => ({
    meta: [{ title: "Demo Insights — Core" }],
  }),
  component: DemoInsightsPage,
});

function DemoInsightsPage() {
  const fetcher = useServerFn(fetchDemoInsights);
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ["demo-insights", days],
    queryFn: () => fetcher({ data: { days } }),
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Demo Insights"
        description="Engajamento, score e funil das sessões de demo por nicho."
      />

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Janela:</span>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <Card className="p-6">Carregando…</Card>}
      {error && (
        <Card className="p-6 text-destructive">
          {(error as Error).message}
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Sessões" value={data.totals.sessions} />
            <KpiCard label="Ações executadas" value={data.totals.actions} />
            <KpiCard label="Nichos ativos" value={data.totals.niches} />
          </div>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">Funil por nicho</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nicho</TableHead>
                  <TableHead className="text-right">Sessões</TableHead>
                  <TableHead className="text-right">Finalizadas</TableHead>
                  <TableHead className="text-right">Score médio</TableHead>
                  <TableHead className="text-right">Duração média</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                  <TableHead>Top módulos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(data.byNiche).map(([slug, b]) => (
                  <TableRow key={slug}>
                    <TableCell className="font-medium">{slug}</TableCell>
                    <TableCell className="text-right">{b.sessions}</TableCell>
                    <TableCell className="text-right">{b.finished}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={b.avgScore >= 70 ? "default" : b.avgScore >= 40 ? "secondary" : "outline"}>
                        {b.avgScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(b.avgDurationSec / 60)} min
                    </TableCell>
                    <TableCell className="text-right">{b.actions}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.topModules.map((m) => `${m.module}(${m.count})`).join(" • ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {Object.keys(data.byNiche).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma sessão de demo registrada no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">Sessões recentes</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Nicho</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">
                      {new Date(s.started_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{s.niche_slug}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {(s.user_id ?? "").slice(0, 8) || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} min` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.score != null ? <Badge>{s.score}</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      {s.ended_at
                        ? <Badge variant="secondary">finalizada</Badge>
                        : <Badge>em andamento</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-6">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </Card>
  );
}
