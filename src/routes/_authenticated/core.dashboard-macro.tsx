import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { fetchMacroDashboard } from "@/lib/core-dashboard.functions";
import { LayoutDashboard, TrendingUp, Users, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/dashboard-macro")({
  head: () => ({ meta: [{ title: "Dashboard Macro Cross-Nicho — Core" }, { name: "robots", content: "noindex" }] }),
  component: MacroDashboard,
});

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MacroDashboard() {
  const [days, setDays] = useState(30);
  const fetcher = useServerFn(fetchMacroDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["macro-dashboard", days],
    queryFn: () => fetcher({ data: { days } }),
  });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (error) return <Card className="p-6 text-destructive">{(error as Error).message}</Card>;
  if (!data) return null;

  const t = data.totals;

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Dashboard Macro Cross-Nicho
          </h1>
          <p className="text-sm text-muted-foreground">Visão consolidada por cliente, nicho, régua e módulo.</p>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90, 180].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>{d}d</Button>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Receita ({days}d)</div>
          <div className="text-2xl font-bold flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-600" /> {fmtBRL(t.revenueCents)}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.invoicesPaid} faturas pagas</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Empresas</div>
          <div className="text-2xl font-bold flex items-center gap-1"><Users className="w-4 h-4" /> {t.companies}</div>
          <div className="text-xs text-muted-foreground mt-1">{t.activeSubs} assinaturas ativas</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Funil de Trial</div>
          <div className="text-2xl font-bold">{t.trialConvRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">{t.trialsConverted}/{t.trialsStarted} convertidos</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Saúde N8N</div>
          <div className="text-2xl font-bold flex items-center gap-1"><Activity className="w-4 h-4" /> {t.n8nEvents}</div>
          <div className={`text-xs mt-1 ${t.n8nFailures > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {t.n8nFailures} falhas · churn {t.churnRate}%
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b font-semibold">Por nicho</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr><th className="text-left p-3">Nicho</th><th className="text-right p-3">Empresas</th><th className="text-right p-3">Receita</th><th className="text-right p-3">N8N (falhas)</th></tr>
            </thead>
            <tbody>
              {Object.entries(data.byNiche).sort((a, b) => b[1].revenueCents - a[1].revenueCents).map(([k, v]) => (
                <tr key={k} className="border-t">
                  <td className="p-3">{v.nicheName}</td>
                  <td className="p-3 text-right">{v.companies}</td>
                  <td className="p-3 text-right font-mono">{fmtBRL(v.revenueCents)}</td>
                  <td className="p-3 text-right">{v.n8nTotal} <span className="text-destructive">({v.n8nFailed})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b font-semibold">Saúde N8N por régua</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase">
              <tr><th className="text-left p-3">Régua</th><th className="text-right p-3">Total</th><th className="text-right p-3">OK</th><th className="text-right p-3">Falhas</th></tr>
            </thead>
            <tbody>
              {Object.entries(data.n8nByRegua).map(([k, v]) => (
                <tr key={k} className="border-t">
                  <td className="p-3 capitalize">{k}</td>
                  <td className="p-3 text-right">{v.total}</td>
                  <td className="p-3 text-right text-green-600">{v.ok}</td>
                  <td className="p-3 text-right text-destructive">{v.failed}</td>
                </tr>
              ))}
              {Object.keys(data.n8nByRegua).length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem execuções no período.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b font-semibold">Top 20 empresas por receita</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Empresa</th><th className="text-right p-3">Receita</th><th className="text-right p-3">N8N</th><th className="text-right p-3">Falhas</th></tr>
          </thead>
          <tbody>
            {data.topCompanies.map((c) => (
              <tr key={c.companyId} className="border-t">
                <td className="p-3">{c.companyName}</td>
                <td className="p-3 text-right font-mono">{fmtBRL(c.revenueCents)}</td>
                <td className="p-3 text-right">{c.n8nTotal}</td>
                <td className="p-3 text-right text-destructive">{c.n8nFailed}</td>
              </tr>
            ))}
            {data.topCompanies.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem receita no período.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
