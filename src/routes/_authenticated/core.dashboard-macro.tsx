import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { fetchMacroDashboard, fetchMacroFiltersMeta } from "@/lib/core-dashboard.functions";
import { downloadCsv, downloadTablePdf, fmtBRLCents } from "@/lib/exports";
import { logExport } from "@/lib/core-export-logs.functions";
import { LayoutDashboard, TrendingUp, Users, Activity, Download, FileText, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/dashboard-macro")({
  head: () => ({ meta: [{ title: "Dashboard Macro Cross-Nicho — Core" }, { name: "robots", content: "noindex" }] }),
  component: MacroDashboard,
});

type Filters = {
  days: number;
  from: string;
  to: string;
  companyId: string;
  nicheSlug: string;
  regua: string;
  workflow: string;
  orderBy: "revenue" | "n8nFailures" | "name";
};

function isoDateOnly(iso: string) { return iso.slice(0, 10); }

function MacroDashboard() {
  const fetcher = useServerFn(fetchMacroDashboard);
  const meta = useServerFn(fetchMacroFiltersMeta);
  const [filters, setFilters] = useState<Filters>({
    days: 30, from: "", to: "",
    companyId: "", nicheSlug: "", regua: "", workflow: "",
    orderBy: "revenue",
  });

  const queryArgs = useMemo(() => {
    const arg: Record<string, unknown> = { orderBy: filters.orderBy };
    if (filters.from && filters.to) {
      arg.from = new Date(filters.from + "T00:00:00").toISOString();
      arg.to = new Date(filters.to + "T23:59:59").toISOString();
    } else {
      arg.days = filters.days;
    }
    if (filters.companyId) arg.companyId = filters.companyId;
    if (filters.nicheSlug) arg.nicheSlug = filters.nicheSlug;
    if (filters.regua) arg.regua = filters.regua;
    if (filters.workflow) arg.workflow = filters.workflow;
    return arg;
  }, [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["macro-dashboard", queryArgs],
    queryFn: () => fetcher({ data: queryArgs as never }),
  });
  const { data: filtersMeta } = useQuery({
    queryKey: ["macro-filters-meta"],
    queryFn: () => meta(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  if (error) return <Card className="p-6 text-destructive">{(error as Error).message}</Card>;
  if (!data) return null;

  const t = data.totals;
  const fromLabel = isoDateOnly(data.window.from);
  const toLabel = isoDateOnly(data.window.to);
  const subtitle = `Período: ${fromLabel} → ${toLabel}` +
    (filters.companyId ? ` · Empresa: ${filtersMeta?.companies.find((c) => (c as { id: string }).id === filters.companyId)?.name ?? "—"}` : "") +
    (filters.nicheSlug ? ` · Nicho: ${filters.nicheSlug}` : "") +
    (filters.regua ? ` · Régua: ${filters.regua}` : "") +
    (filters.workflow ? ` · Módulo: ${filters.workflow}` : "");

  function exportCompaniesCsv() {
    downloadCsv(`empresas-${fromLabel}-${toLabel}.csv`,
      ["empresa", "receita_brl", "n8n_total", "n8n_falhas"],
      data!.allCompanies.map((c) => ({
        empresa: c.companyName,
        receita_brl: (c.revenueCents / 100).toFixed(2).replace(".", ","),
        n8n_total: c.n8nTotal,
        n8n_falhas: c.n8nFailed,
      })),
    );
  }
  function exportNichesCsv() {
    downloadCsv(`nichos-${fromLabel}-${toLabel}.csv`,
      ["nicho", "empresas", "receita_brl", "n8n_total", "n8n_falhas"],
      Object.entries(data!.byNiche).map(([k, v]) => ({
        nicho: v.nicheName,
        empresas: v.companies,
        receita_brl: (v.revenueCents / 100).toFixed(2).replace(".", ","),
        n8n_total: v.n8nTotal,
        n8n_falhas: v.n8nFailed,
      })),
    );
  }
  function exportReguasCsv() {
    downloadCsv(`reguas-${fromLabel}-${toLabel}.csv`,
      ["regua", "total", "ok", "falhas"],
      Object.entries(data!.n8nByRegua).map(([k, v]) => ({ regua: k, total: v.total, ok: v.ok, falhas: v.failed })),
    );
  }

  function monthlyPdf() {
    const month = new Date(data!.window.to);
    const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const empresa = filters.companyId
      ? filtersMeta?.companies.find((c) => (c as { id: string }).id === filters.companyId)?.name ?? "—"
      : "Todas as empresas";
    downloadTablePdf({
      filename: `relatorio-${fromLabel}-${toLabel}.pdf`,
      title: `Relatório consolidado — ${monthLabel}`,
      subtitle: `${empresa} · ${fromLabel} → ${toLabel}`,
      columns: [
        { key: "metric", label: "Métrica" },
        { key: "value", label: "Valor", align: "right", width: 180 },
      ],
      rows: [
        { metric: "Receita (faturas pagas)", value: fmtBRLCents(t.revenueCents) },
        { metric: "Faturas pagas / abertas / vencidas", value: `${t.invoicesPaid} / ${t.invoicesOpen} / ${t.invoicesOverdue}` },
        { metric: "Leads no período", value: t.leads },
        { metric: "Trials iniciados / convertidos / perdidos", value: `${t.trialsStarted} / ${t.trialsConverted} / ${t.trialsLost}` },
        { metric: "Conversão de trial", value: `${t.trialConvRate}%` },
        { metric: "Assinaturas ativas", value: t.activeSubs },
        { metric: "Cancelamentos no período", value: t.cancelledSubs },
        { metric: "Churn", value: `${t.churnRate}%` },
        { metric: "Eventos N8N", value: t.n8nEvents },
        { metric: "Falhas N8N", value: t.n8nFailures },
        { metric: "Empresas analisadas", value: t.companies },
      ],
      footer: "Impulsionando Tecnologia — relatório automatizado",
    });

    // segunda página: ranking de empresas
    setTimeout(() => {
      downloadTablePdf({
        filename: `relatorio-empresas-${fromLabel}-${toLabel}.pdf`,
        title: `Empresas — ${monthLabel}`,
        subtitle,
        columns: [
          { key: "empresa", label: "Empresa" },
          { key: "receita", label: "Receita", align: "right", width: 110 },
          { key: "n8n", label: "N8N", align: "right", width: 70 },
          { key: "falhas", label: "Falhas", align: "right", width: 70 },
        ],
        rows: data!.allCompanies.map((c) => ({
          empresa: c.companyName,
          receita: fmtBRLCents(c.revenueCents),
          n8n: c.n8nTotal,
          falhas: c.n8nFailed,
        })),
        footer: "Impulsionando Tecnologia",
      });
    }, 200);
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Dashboard Macro Cross-Nicho
          </h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={exportNichesCsv}><Download className="w-4 h-4 mr-1" /> Nichos CSV</Button>
          <Button size="sm" variant="outline" onClick={exportReguasCsv}><Download className="w-4 h-4 mr-1" /> Réguas CSV</Button>
          <Button size="sm" variant="outline" onClick={exportCompaniesCsv}><Download className="w-4 h-4 mr-1" /> Empresas CSV</Button>
          <Button size="sm" onClick={monthlyPdf}><FileText className="w-4 h-4 mr-1" /> PDF mensal</Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-semibold flex items-center gap-2 mb-3"><Filter className="w-4 h-4" /> Filtros</div>
        <div className="grid md:grid-cols-7 gap-2">
          <div className="space-y-1 md:col-span-1">
            <Label className="text-xs">Janela</Label>
            <select className="w-full border rounded-md p-2 text-sm bg-background"
              value={filters.from || filters.to ? "custom" : String(filters.days)}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  const today = new Date(); const past = new Date(Date.now() - 30 * 86400_000);
                  setFilters({ ...filters, from: past.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) });
                } else {
                  setFilters({ ...filters, days: Number(e.target.value), from: "", to: "" });
                }
              }}>
              <option value="7">7 dias</option><option value="30">30 dias</option>
              <option value="90">90 dias</option><option value="180">180 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Até</Label>
            <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Empresa</Label>
            <select className="w-full border rounded-md p-2 text-sm bg-background"
              value={filters.companyId} onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}>
              <option value="">Todas</option>
              {(filtersMeta?.companies ?? []).map((c) => {
                const o = c as { id: string; name: string };
                return <option key={o.id} value={o.id}>{o.name}</option>;
              })}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nicho</Label>
            <select className="w-full border rounded-md p-2 text-sm bg-background"
              value={filters.nicheSlug} onChange={(e) => setFilters({ ...filters, nicheSlug: e.target.value })}>
              <option value="">Todos</option>
              {(filtersMeta?.niches ?? []).map((n) => {
                const o = n as { slug: string; name: string };
                return <option key={o.slug} value={o.slug}>{o.name}</option>;
              })}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Régua</Label>
            <select className="w-full border rounded-md p-2 text-sm bg-background"
              value={filters.regua} onChange={(e) => setFilters({ ...filters, regua: e.target.value })}>
              <option value="">Todas</option>
              {(filtersMeta?.reguas ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Módulo (workflow)</Label>
            <select className="w-full border rounded-md p-2 text-sm bg-background"
              value={filters.workflow} onChange={(e) => setFilters({ ...filters, workflow: e.target.value })}>
              <option value="">Todos</option>
              {(filtersMeta?.workflows ?? []).map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Label className="text-xs">Ordenação</Label>
          <select className="border rounded-md p-2 text-sm bg-background"
            value={filters.orderBy} onChange={(e) => setFilters({ ...filters, orderBy: e.target.value as Filters["orderBy"] })}>
            <option value="revenue">Receita (maior)</option>
            <option value="n8nFailures">Falhas N8N (maior)</option>
            <option value="name">Nome (A→Z)</option>
          </select>
          <Button size="sm" variant="ghost" onClick={() => setFilters({
            days: 30, from: "", to: "", companyId: "", nicheSlug: "", regua: "", workflow: "", orderBy: "revenue",
          })}>Limpar</Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Receita</div>
          <div className="text-2xl font-bold flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-600" /> {fmtBRLCents(t.revenueCents)}</div>
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
          <div className="text-xs text-muted-foreground mt-1">{t.trialsConverted}/{t.trialsStarted} convertidos · {t.leads} leads</div>
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
                  <td className="p-3 text-right font-mono">{fmtBRLCents(v.revenueCents)}</td>
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
        <div className="p-4 border-b font-semibold">Top empresas ({filters.orderBy === "revenue" ? "receita" : filters.orderBy === "n8nFailures" ? "falhas N8N" : "nome"})</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase">
            <tr><th className="text-left p-3">Empresa</th><th className="text-right p-3">Receita</th><th className="text-right p-3">N8N</th><th className="text-right p-3">Falhas</th></tr>
          </thead>
          <tbody>
            {data.topCompanies.map((c) => (
              <tr key={c.companyId} className="border-t">
                <td className="p-3">{c.companyName}</td>
                <td className="p-3 text-right font-mono">{fmtBRLCents(c.revenueCents)}</td>
                <td className="p-3 text-right">{c.n8nTotal}</td>
                <td className="p-3 text-right text-destructive">{c.n8nFailed}</td>
              </tr>
            ))}
            {data.topCompanies.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem dados no período.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
