import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  readWhatsAppLocalMetrics,
  clearWhatsAppLocalMetrics,
  readAlertConfig,
  saveAlertConfig,
  evaluateAlerts,
  recordAlertHistory,
  readAlertHistory,
  clearAlertHistory,
  shouldNotifyAlertNow,
  readAlertTemplate,
  saveAlertTemplate,
  renderAlertTemplate,
  DEFAULT_ALERT_CONFIG,
  DEFAULT_ALERT_TEMPLATE,
  type BufferedEvent,
  type AlertConfig,
  type AlertHistoryEntry,
  type AlertTemplate,
} from "@/lib/whatsapp-cta";
import { notifyWhatsAppAlert } from "@/lib/whatsapp-alerts.functions";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle, MousePointerClick, Send, Trash2, RefreshCw,
  Download, AlertTriangle, CheckCircle2, BellRing, History,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/whatsapp-metrics")({
  head: () => ({ meta: [{ title: "Métricas WhatsApp Oficial — Impulsionando" }] }),
  component: WhatsAppMetricsPage,
});

const CLICK_EVENTS = ["whatsapp_cta_click", "whatsapp_fab_click", "whatsapp_notice_click"];
const SEND_EVENTS = ["whatsapp_form_submit", "whatsapp_cta_sent"];

type PeriodKey = "1h" | "24h" | "7d" | "30d" | "all";
const PERIOD_HOURS: Record<PeriodKey, number | null> = {
  "1h": 1, "24h": 24, "7d": 24 * 7, "30d": 24 * 30, all: null,
};

function toCSV(rows: BufferedEvent[]): string {
  const head = ["ts", "iso", "event", "origin", "path", "variant", "campaign", "cta_hash", "cta_text"];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [r.ts, new Date(r.ts).toISOString(), r.event, r.origin, r.path,
     r.variant ?? "", r.campaign ?? "", r.ctaHash ?? "", r.ctaText ?? ""]
      .map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function WhatsAppMetricsPage() {
  const [all, setAll] = useState<BufferedEvent[]>([]);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);
  const [tick, setTick] = useState(0);
  const [cfg, setCfg] = useState<AlertConfig>(DEFAULT_ALERT_CONFIG);
  const [tpl, setTpl] = useState<AlertTemplate>(DEFAULT_ALERT_TEMPLATE);
  const notify = useServerFn(notifyWhatsAppAlert);

  // filtros do dashboard
  const [period, setPeriod] = useState<PeriodKey>("24h");
  const [origin, setOrigin] = useState("__all");
  const [campaign, setCampaign] = useState("__all");
  const [cta, setCta] = useState("__all");

  // filtros do histórico
  const today = new Date().toISOString().slice(0, 10);
  const [hFrom, setHFrom] = useState("");
  const [hTo, setHTo] = useState("");
  const [hCta, setHCta] = useState("__all");

  useEffect(() => {
    setAll(readWhatsAppLocalMetrics());
    setCfg(readAlertConfig());
    setHistory(readAlertHistory());
    setTpl(readAlertTemplate());
  }, [tick]);

  const filtered = useMemo(() => {
    const h = PERIOD_HOURS[period];
    const since = h ? Date.now() - h * 3_600_000 : 0;
    return all.filter((r) => {
      if (r.ts < since) return false;
      if (origin !== "__all" && r.origin !== origin) return false;
      if (campaign !== "__all" && (r.campaign ?? "") !== campaign) return false;
      if (cta !== "__all" && (r.ctaHash ?? "") !== cta) return false;
      return true;
    });
  }, [all, period, origin, campaign, cta]);

  const opts = useMemo(() => {
    const o = new Set<string>(), c = new Set<string>(), t = new Set<string>();
    for (const r of all) {
      o.add(r.origin);
      c.add(r.campaign ?? "");
      if (r.ctaHash) t.add(r.ctaHash);
    }
    return {
      origins: Array.from(o).filter(Boolean).sort(),
      campaigns: Array.from(c).filter(Boolean).sort(),
      ctas: Array.from(t).sort(),
    };
  }, [all]);

  const totals = useMemo(() => {
    const impressions = filtered.filter((r) => r.event === "whatsapp_cta_impression").length;
    const clicks = filtered.filter((r) => CLICK_EVENTS.includes(r.event)).length;
    const sends = filtered.filter((r) => SEND_EVENTS.includes(r.event)).length;
    return {
      impressions, clicks, sends,
      ctr: impressions ? (clicks / impressions) * 100 : 0,
      sr: clicks ? (sends / clicks) * 100 : 0,
    };
  }, [filtered]);

  const byRoute = useMemo(() => groupBy(filtered, (r) => r.path || "—"), [filtered]);
  const byVariant = useMemo(() => groupBy(filtered, (r) => r.variant || "control"), [filtered]);
  const byCta = useMemo(
    () => groupBy(filtered.filter((r) => r.ctaHash), (r) => r.ctaHash!),
    [filtered],
  );

  const alertEval = useMemo(() => evaluateAlerts(all, cfg), [all, cfg]);

  // Quando dispara, grava no histórico + tenta notificar (cooldown 1h).
  useEffect(() => {
    if (!alertEval.triggered) return;
    const baseEntry: Omit<AlertHistoryEntry, "notified"> = {
      ts: Date.now(),
      ctr: alertEval.ctr,
      sendRate: alertEval.sendRate,
      impressions: alertEval.impressions,
      clicks: alertEval.clicks,
      sends: alertEval.sends,
      ctrBelow: alertEval.ctrBelow,
      sendBelow: alertEval.sendBelow,
      windowHours: cfg.windowHours,
      minCtr: cfg.minCtr,
      minSendRate: cfg.minSendRate,
      ctaHash: cta !== "__all" ? cta : undefined,
    };
    if (!shouldNotifyAlertNow()) {
      recordAlertHistory({ ...baseEntry, notified: [] });
      return;
    }
    const rendered = renderAlertTemplate(tpl, {
      ctr: alertEval.ctr,
      sendRate: alertEval.sendRate,
      impressions: alertEval.impressions,
      clicks: alertEval.clicks,
      sends: alertEval.sends,
      ctrBelow: alertEval.ctrBelow,
      sendBelow: alertEval.sendBelow,
      minCtr: cfg.minCtr,
      minSendRate: cfg.minSendRate,
      windowHours: cfg.windowHours,
      ctaHash: baseEntry.ctaHash,
      origin: origin !== "__all" ? origin : undefined,
    });
    notify({
      data: {
        ...baseEntry,
        title: rendered.title,
        body: rendered.body,
        origin: origin !== "__all" ? origin : undefined,
      },
    })
      .then((res) => {
        recordAlertHistory({ ...baseEntry, notified: res?.channels ?? [] });
        setTick((t) => t + 1);
      })
      .catch(() => {
        recordAlertHistory({ ...baseEntry, notified: [] });
        setTick((t) => t + 1);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertEval.triggered]);

  const historyCtaOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of history) if (e.ctaHash) s.add(e.ctaHash);
    return Array.from(s).sort();
  }, [history]);

  const historyFiltered = useMemo(() => {
    const from = hFrom ? new Date(hFrom + "T00:00:00").getTime() : 0;
    const to = hTo ? new Date(hTo + "T23:59:59").getTime() : Number.POSITIVE_INFINITY;
    return history
      .filter((e) => e.ts >= from && e.ts <= to)
      .filter((e) => hCta === "__all" || (e.ctaHash ?? "") === hCta)
      .sort((a, b) => b.ts - a.ts);
  }, [history, hFrom, hTo, hCta]);

  function exportHistoryCSV() {
    const head = [
      "ts", "iso", "ctr", "sendRate", "impressions", "clicks", "sends",
      "ctrBelow", "sendBelow", "minCtr", "minSendRate", "windowHours",
      "ctaHash", "notified",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = historyFiltered.map((e) =>
      [e.ts, new Date(e.ts).toISOString(), e.ctr.toFixed(2), e.sendRate.toFixed(2),
       e.impressions, e.clicks, e.sends, e.ctrBelow, e.sendBelow,
       e.minCtr, e.minSendRate, e.windowHours, e.ctaHash ?? "",
       (e.notified ?? []).join("|")].map(esc).join(","),
    );
    download(`wa-alert-history-${Date.now()}.csv`, [head.join(","), ...lines].join("\n"));
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Métricas — WhatsApp Oficial"
        description="Impressões, cliques, envios (form + retorno da aba) por rota, campanha e versão de CTA. Dados do buffer local + GA4."
      />

      {alertEval.triggered && (
        <Card className="p-4 border-amber-400 bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <strong className="block text-amber-900 dark:text-amber-100">Alerta de performance</strong>
            <p className="text-amber-900/90 dark:text-amber-100/90">
              Janela {cfg.windowHours}h:{" "}
              {alertEval.ctrBelow && <>CTR {alertEval.ctr.toFixed(1)}% &lt; {cfg.minCtr}%. </>}
              {alertEval.sendBelow && <>Envio {alertEval.sendRate.toFixed(1)}% &lt; {cfg.minSendRate}%. </>}
              Revise o CTA / página com queda. Notificações são enviadas via Slack/e-mail (cooldown 1h).
            </p>
          </div>
        </Card>
      )}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-1" /> Histórico de alertas
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-2">{history.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* Filtros */}
          <Card className="p-4 grid gap-3 md:grid-cols-5 items-end">
            <div>
              <Label className="text-xs">Período</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FilterSelect label="Origem (CTA)" value={origin} setValue={setOrigin} options={opts.origins} />
            <FilterSelect label="Campanha" value={campaign} setValue={setCampaign} options={opts.campaigns} />
            <FilterSelect label="Versão do CTA (hash)" value={cta} setValue={setCta} options={opts.ctas} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setTick((t) => t + 1)}>
                <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
              </Button>
              <Button
                size="sm"
                onClick={() => download(`wa-metrics-${Date.now()}.csv`, toCSV(filtered))}
                disabled={filtered.length === 0}
              >
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button
                size="sm" variant="ghost"
                onClick={() => { clearWhatsAppLocalMetrics(); setTick((t) => t + 1); }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-5">
            <StatCard icon={MessageCircle} label="Impressões" value={totals.impressions} />
            <StatCard icon={MousePointerClick} label="Cliques" value={totals.clicks} />
            <StatCard icon={Send} label="Envios (form + retorno)" value={totals.sends} />
            <StatCard icon={MousePointerClick} label="CTR" value={`${totals.ctr.toFixed(1)}%`} />
            <StatCard icon={Send} label="Taxa de envio" value={`${totals.sr.toFixed(1)}%`} />
          </div>

          <BreakdownTable title="Por rota" rows={byRoute} firstColLabel="Rota" />
          <BreakdownTable title="Comparativo A/B por variante" rows={byVariant} firstColLabel="Variante" highlight />
          <BreakdownTable title="Por versão do CTA (hash do texto)" rows={byCta} firstColLabel="cta_hash" />

          {/* Configuração de alertas */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              <h2 className="text-lg font-semibold">Alertas</h2>
              {alertEval.triggered ? (
                <Badge variant="destructive" className="ml-2">Disparado</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                </Badge>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <NumField label="CTR mínimo (%)" value={cfg.minCtr}
                onChange={(v) => setCfg({ ...cfg, minCtr: v })} />
              <NumField label="Envio mínimo (%)" value={cfg.minSendRate}
                onChange={(v) => setCfg({ ...cfg, minSendRate: v })} />
              <NumField label="Janela (horas)" value={cfg.windowHours}
                onChange={(v) => setCfg({ ...cfg, windowHours: v })} />
              <NumField label="Amostras mínimas" value={cfg.minSamples}
                onChange={(v) => setCfg({ ...cfg, minSamples: v })} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { saveAlertConfig(cfg); setTick((t) => t + 1); }}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => { saveAlertConfig(DEFAULT_ALERT_CONFIG); setCfg(DEFAULT_ALERT_CONFIG); }}>
                Restaurar padrão
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Avaliação atual: {alertEval.impressions} impr · {alertEval.clicks} cliques ·{" "}
              {alertEval.sends} envios — CTR {alertEval.ctr.toFixed(1)}% · envio{" "}
              {alertEval.sendRate.toFixed(1)}%. Notificações usam{" "}
              <code>SLACK_ALERT_WEBHOOK_URL</code> e/ou <code>ALERT_EMAIL_TO</code>{" "}
              (via Resend). Cooldown de 1h entre envios.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="p-4 grid gap-3 md:grid-cols-4 items-end">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={hFrom} max={today}
                onChange={(e) => setHFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={hTo} max={today}
                onChange={(e) => setHTo(e.target.value)} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button size="sm" variant="outline" onClick={() => { setHFrom(""); setHTo(""); }}>
                Limpar filtro
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => { clearAlertHistory(); setTick((t) => t + 1); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Limpar histórico
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            {historyFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum alerta registrado no período selecionado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                      <th className="py-2 pr-4">Quando</th>
                      <th className="py-2 pr-4">Motivo</th>
                      <th className="py-2 pr-4">CTR</th>
                      <th className="py-2 pr-4">Envio</th>
                      <th className="py-2 pr-4">Janela</th>
                      <th className="py-2 pr-4">Impr/Cliq/Env</th>
                      <th className="py-2 pr-4">CTA hash</th>
                      <th className="py-2">Notificações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyFiltered.map((e) => (
                      <tr key={e.ts} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {new Date(e.ts).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-4">
                          {e.ctrBelow && <Badge variant="destructive" className="mr-1">CTR</Badge>}
                          {e.sendBelow && <Badge variant="destructive">Envio</Badge>}
                        </td>
                        <td className="py-2 pr-4">
                          {e.ctr.toFixed(1)}% / min {e.minCtr}%
                        </td>
                        <td className="py-2 pr-4">
                          {e.sendRate.toFixed(1)}% / min {e.minSendRate}%
                        </td>
                        <td className="py-2 pr-4">{e.windowHours}h</td>
                        <td className="py-2 pr-4 font-mono text-xs">
                          {e.impressions}/{e.clicks}/{e.sends}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{e.ctaHash ?? "—"}</td>
                        <td className="py-2">
                          {e.notified && e.notified.length > 0
                            ? e.notified.map((c) => (
                                <Badge key={c} variant="outline" className="mr-1">{c}</Badge>
                              ))
                            : <span className="text-xs text-muted-foreground">cooldown / não configurado</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FilterSelect({
  label, value, setValue, options,
}: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

interface Agg { key: string; impressions: number; clicks: number; sends: number; ctr: number | null; sr: number | null }
function groupBy(rows: BufferedEvent[], keyFn: (r: BufferedEvent) => string): Agg[] {
  const map = new Map<string, { impressions: number; clicks: number; sends: number }>();
  for (const r of rows) {
    const k = keyFn(r);
    const cur = map.get(k) ?? { impressions: 0, clicks: 0, sends: 0 };
    if (r.event === "whatsapp_cta_impression") cur.impressions++;
    else if (SEND_EVENTS.includes(r.event)) cur.sends++;
    else if (CLICK_EVENTS.includes(r.event)) cur.clicks++;
    map.set(k, cur);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({
      key, ...v,
      ctr: v.impressions ? (v.clicks / v.impressions) * 100 : null,
      sr: v.clicks ? (v.sends / v.clicks) * 100 : null,
    }))
    .sort((a, b) => b.sends + b.clicks - (a.sends + a.clicks));
}

function BreakdownTable({
  title, rows, firstColLabel, highlight,
}: { title: string; rows: Agg[]; firstColLabel: string; highlight?: boolean }) {
  return (
    <Card className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados nesta janela.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-4">{firstColLabel}</th>
                <th className="py-2 pr-4">Impr.</th>
                <th className="py-2 pr-4">Cliques</th>
                <th className="py-2 pr-4">Envios</th>
                <th className="py-2 pr-4">CTR</th>
                <th className="py-2">Envio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">
                    {highlight ? <Badge variant="outline">{r.key}</Badge> : r.key}
                  </td>
                  <td className="py-2 pr-4">{r.impressions}</td>
                  <td className="py-2 pr-4">{r.clicks}</td>
                  <td className="py-2 pr-4">{r.sends}</td>
                  <td className="py-2 pr-4">{r.ctr === null ? "—" : `${r.ctr.toFixed(1)}%`}</td>
                  <td className="py-2">{r.sr === null ? "—" : `${r.sr.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
