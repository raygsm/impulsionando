import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Headphones, Clock, CheckCircle2, AlertTriangle, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support/cockpit")({
  head: () => ({ meta: [{ title: "Suporte — Cockpit | Impulsionando" }] }),
  component: SupportCockpit,
});

function SupportCockpit() {
  const { data, isLoading } = useQuery({
    queryKey: ["support-cockpit"],
    staleTime: 30_000,
    queryFn: async () => {
      const [sessions, openCount, closedToday] = await Promise.all([
        supabase.from("support_sessions")
          .select("id, company_id, super_user_email, reason, started_at, ended_at, companies:company_id(name)")
          .order("started_at", { ascending: false })
          .limit(50),
        supabase.from("support_sessions").select("id", { count: "exact", head: true }).is("ended_at", null),
        supabase.from("support_sessions").select("id", { count: "exact", head: true })
          .not("ended_at", "is", null)
          .gte("ended_at", new Date(Date.now() - 86400_000).toISOString()),
      ]);
      return {
        sessions: sessions.data ?? [],
        openCount: openCount.count ?? 0,
        closedToday: closedToday.count ?? 0,
      };
    },
  });

  const avgDuration = (() => {
    if (!data?.sessions) return "—";
    const finished = data.sessions.filter((s: any) => s.ended_at);
    if (!finished.length) return "—";
    const total = finished.reduce((acc: number, s: any) =>
      acc + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()), 0);
    const mins = Math.round(total / finished.length / 60000);
    return `${mins} min`;
  })();

  const kpis = [
    { label: "Sessões em andamento", value: data?.openCount ?? 0, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Encerradas (24h)", value: data?.closedToday ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Tempo médio", value: avgDuration, icon: Clock, color: "text-sky-600" },
    { label: "Total recentes", value: data?.sessions.length ?? 0, icon: Headphones, color: "text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Suporte" description="Sessões ativas, tempos de atendimento e histórico recente." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <Badge variant="outline" className="text-[10px]">KPI</Badge>
            </div>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-16" /> : value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Sessões de suporte recentes</h2>
        {isLoading ? <Skeleton className="h-48 w-full" /> : data?.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma sessão de suporte registrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Atendente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.sessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.companies?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{s.super_user_email ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.reason ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(s.started_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    {s.ended_at
                      ? <Badge variant="outline">Encerrada</Badge>
                      : <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">Em andamento</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5 bg-muted/30">
        <div className="flex items-start gap-3">
          <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm flex-1">
            <div className="font-semibold mb-1">Onde abrir um chamado?</div>
            <p className="text-muted-foreground">
              Suporte da Impulsionando funciona via WhatsApp dedicado e sessões assistidas
              registradas aqui. Cada acesso a conta de cliente é auditado em{" "}
              <Link to="/audit" className="underline">Auditoria</Link>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
