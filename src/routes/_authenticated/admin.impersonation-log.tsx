import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, LogIn, LogOut } from "lucide-react";
import { listImpersonationAudit } from "@/lib/impersonation-audit.functions";

export const Route = createFileRoute("/_authenticated/admin/impersonation-log")({
  head: () => ({
    meta: [
      { title: "Log de Impersonação — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ImpersonationLogPage,
});

type Row = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  target_company_id: string | null;
  target_company_name: string | null;
  action: "start" | "stop";
  reason: string | null;
  user_agent: string | null;
  created_at: string;
};

function ImpersonationLogPage() {
  const fn = useServerFn(listImpersonationAudit);
  const [tenantFilter, setTenantFilter] = useState("");
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [actionFilter, setActionFilter] = useState<"all" | "start" | "stop">("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["impersonation-audit"],
    queryFn: () => fn({ data: { limit: 500 } } as any).catch(() => ({ rows: [] as Row[] })),
    staleTime: 30_000,
  });

  const rows = (data?.rows ?? []) as Row[];

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "24h" ? now - 24 * 3600 * 1000 :
      range === "7d" ? now - 7 * 24 * 3600 * 1000 :
      range === "30d" ? now - 30 * 24 * 3600 * 1000 :
      0;
    const needle = tenantFilter.trim().toLowerCase();
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (needle) {
        const hay = `${r.target_company_name ?? ""} ${r.target_company_id ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, range, tenantFilter, actionFilter]);

  const totalStart = filtered.filter((r) => r.action === "start").length;
  const totalStop = filtered.filter((r) => r.action === "stop").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log de Impersonação"
        description="Auditoria de start/stop das sessões de impersonação por staff/master. Filtre por tenant, período e tipo de evento."
      />

      <Card className="p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-muted-foreground">Tenant (nome ou id)</label>
          <Input
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            placeholder="Filtrar por tenant…"
            className="h-9"
          />
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Período</label>
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <label className="text-xs text-muted-foreground">Ação</label>
          <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as typeof actionFilter)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="start">Start</SelectItem>
              <SelectItem value="stop">Stop</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} eventos · {totalStart} start · {totalStop} stop
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum evento no período/filtro selecionado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Quando</th>
                  <th className="text-left px-3 py-2">Ação</th>
                  <th className="text-left px-3 py-2">Tenant</th>
                  <th className="text-left px-3 py-2">Ator</th>
                  <th className="text-left px-3 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2">
                      {r.action === "start" ? (
                        <Badge variant="default" className="gap-1"><LogIn className="size-3" /> start</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><LogOut className="size-3" /> stop</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.target_company_name ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{r.target_company_id ?? ""}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{r.actor_email ?? r.actor_user_id ?? "—"}</td>
                    <td className="px-3 py-2 text-xs max-w-[320px]">
                      {r.reason || <span className="text-muted-foreground italic">sem motivo</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
