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
  updateAlertHistory,
  readAlertHistory,
  clearAlertHistory,
  shouldNotifyAlertNow,
  readAlertTemplate,
  saveAlertTemplate,
  renderAlertTemplate,
  readAlertRules,
  saveAlertRules,
  evaluateAlertRules,
  ruleScope,
  buildDailySummary,
  buildDailySummaryRange,
  renderDailySummary,
  dailySummaryAlreadySent,
  markDailySummarySent,
  planChannelDispatch,
  markChannelDispatched,
  readChannelCooldown,
  simulateAlertRules,
  ALERT_CHANNELS,
  DEFAULT_ALERT_CONFIG,
  DEFAULT_ALERT_TEMPLATE,
  type BufferedEvent,
  type AlertConfig,
  type AlertHistoryEntry,
  type AlertTemplate,
  type AlertRule,
  type AlertPayload,
  type AlertChannel,
  type ChannelDelivery,
  type ChannelDecision,
  type SimulationDispatch,
} from "@/lib/whatsapp-cta";
import { notifyWhatsAppAlert } from "@/lib/whatsapp-alerts.functions";
import { PageHeader, StatCard } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle, MousePointerClick, Send, Trash2, RefreshCw,
  Download, AlertTriangle, CheckCircle2, BellRing, History,
  Plus, RotateCcw, Mail, ShieldAlert, ShieldCheck, FlaskConical, Eye,
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
  const [rules, setRules] = useState<AlertRule[]>([]);
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
  const [hStatus, setHStatus] = useState<"__all" | "sent" | "failed" | "cooldown" | "no_channels" | "partial">("__all");

  // simulação
  const [simDays, setSimDays] = useState(7);
  const [simStep, setSimStep] = useState(60); // minutos
  const [simResult, setSimResult] = useState<SimulationDispatch[]>([]);
  const [simIncludeSuppressed, setSimIncludeSuppressed] = useState(true);

  // resumo diário (CSV)
  const [dsFrom, setDsFrom] = useState("");
  const [dsTo, setDsTo] = useState("");
  const [dsRule, setDsRule] = useState("__all");

  useEffect(() => {
    setAll(readWhatsAppLocalMetrics());
    setCfg(readAlertConfig());
    setHistory(readAlertHistory());
    setTpl(readAlertTemplate());
    setRules(readAlertRules());
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
    const o = new Set<string>(), c = new Set<string>(), t = new Set<string>(),
      r2 = new Set<string>(), v = new Set<string>();
    for (const r of all) {
      o.add(r.origin);
      c.add(r.campaign ?? "");
      if (r.ctaHash) t.add(r.ctaHash);
      if (r.path) r2.add(r.path);
      v.add(r.variant ?? "control");
    }
    return {
      origins: Array.from(o).filter(Boolean).sort(),
      campaigns: Array.from(c).filter(Boolean).sort(),
      ctas: Array.from(t).sort(),
      routes: Array.from(r2).sort(),
      variants: Array.from(v).sort(),
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
  const ruleEvals = useMemo(() => evaluateAlertRules(all, rules), [all, rules]);

  /**
   * Dispatch global (não-regra): canais agem em paralelo, ambos com cooldown
   * de escopo `global`. Mantido por compatibilidade.
   */
  async function dispatchAlert(
    scope: string,
    payload: AlertPayload,
    extra: { ruleId?: string; ctaHash?: string },
  ): Promise<AlertHistoryEntry> {
    const baseEntry: AlertHistoryEntry = {
      ts: Date.now(),
      ctr: payload.ctr,
      sendRate: payload.sendRate,
      impressions: payload.impressions,
      clicks: payload.clicks,
      sends: payload.sends,
      ctrBelow: payload.ctrBelow,
      sendBelow: payload.sendBelow,
      windowHours: payload.windowHours,
      minCtr: payload.minCtr,
      minSendRate: payload.minSendRate,
      ctaHash: extra.ctaHash,
      scope,
      ruleId: extra.ruleId,
      payload,
    };
    if (!shouldNotifyAlertNow(scope)) {
      recordAlertHistory({ ...baseEntry, notified: [], status: "cooldown" });
      return baseEntry;
    }
    try {
      const res = await notify({ data: { ...payload } });
      const channels = res?.channels ?? [];
      const deliveries: ChannelDelivery[] = (res?.results ?? []).map((r) => ({
        channel: r.channel as AlertChannel,
        status: r.status as ChannelDelivery["status"],
        error: r.error,
        ts: Date.now(),
      }));
      const status: AlertHistoryEntry["status"] =
        res?.ok === false ? (channels.length > 0 ? "partial" : "failed")
        : channels.length === 0 ? "no_channels"
        : "sent";
      recordAlertHistory({ ...baseEntry, notified: channels, status, error: res?.error, deliveries });
      return baseEntry;
    } catch (err) {
      recordAlertHistory({
        ...baseEntry, notified: [], status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      return baseEntry;
    } finally {
      setTick((t) => t + 1);
    }
  }

  /**
   * Dispatch baseado em regra: usa `planChannelDispatch` para decidir
   * por canal (com limites + cooldown próprios). Cada canal é marcado
   * individualmente e o status agregado da entrada reflete o resultado.
   */
  async function dispatchRuleAlert(
    rule: AlertRule,
    ev: ReturnType<typeof evaluateAlertRules>[number],
    rendered: { title: string; body: string },
  ): Promise<void> {
    const scope = ruleScope(rule);
    const decisions = planChannelDispatch(ev, rule);
    const willFire = decisions.filter((d) => d.willFire);
    const basePayload: AlertPayload = {
      title: rendered.title, body: rendered.body,
      ctr: ev.ctr, sendRate: ev.sendRate,
      impressions: ev.impressions, clicks: ev.clicks, sends: ev.sends,
      ctrBelow: ev.ctrBelow, sendBelow: ev.sendBelow,
      minCtr: rule.minCtr, minSendRate: rule.minSendRate,
      windowHours: rule.windowHours, path: rule.route,
    };
    const baseEntry: AlertHistoryEntry = {
      ts: Date.now(),
      ctr: ev.ctr, sendRate: ev.sendRate,
      impressions: ev.impressions, clicks: ev.clicks, sends: ev.sends,
      ctrBelow: ev.ctrBelow, sendBelow: ev.sendBelow,
      windowHours: rule.windowHours, minCtr: rule.minCtr, minSendRate: rule.minSendRate,
      scope, ruleId: rule.id, payload: basePayload,
    };

    if (willFire.length === 0) {
      const allCooldown = decisions.every((d) => d.reason === "cooldown");
      recordAlertHistory({
        ...baseEntry,
        notified: [],
        status: allCooldown ? "cooldown" : "no_channels",
        deliveries: decisions.map((d) => ({
          channel: d.channel,
          status: d.reason === "cooldown" ? "cooldown"
                : d.reason === "disabled" ? "disabled" : "skipped",
          error: d.reason,
        })),
      });
      setTick((t) => t + 1);
      return;
    }

    try {
      const res = await notify({
        data: {
          ...basePayload,
          channels: {
            slack: willFire.some((d) => d.channel === "slack"),
            email: willFire.some((d) => d.channel === "email"),
          },
        },
      });
      const sentChannels = new Set(res?.channels ?? []);
      const serverResults = new Map((res?.results ?? []).map((r) => [r.channel, r]));
      const deliveries: ChannelDelivery[] = decisions.map((d) => {
        if (!d.willFire) {
          return {
            channel: d.channel,
            status: d.reason === "cooldown" ? "cooldown"
                  : d.reason === "disabled" ? "disabled" : "skipped",
            error: d.reason,
          };
        }
        const r = serverResults.get(d.channel);
        if (r?.status === "sent") {
          markChannelDispatched(scope, d.channel);
          return { channel: d.channel, status: "sent", ts: Date.now() };
        }
        return { channel: d.channel, status: "failed", error: r?.error ?? "no response" };
      });
      const sentCount = deliveries.filter((d) => d.status === "sent").length;
      const failedCount = deliveries.filter((d) => d.status === "failed").length;
      const status: AlertHistoryEntry["status"] =
        sentCount > 0 && failedCount > 0 ? "partial"
        : sentCount > 0 ? "sent"
        : failedCount > 0 ? "failed"
        : "no_channels";
      recordAlertHistory({
        ...baseEntry,
        notified: Array.from(sentChannels),
        status, error: res?.error, deliveries,
      });
    } catch (err) {
      recordAlertHistory({
        ...baseEntry, notified: [], status: "failed",
        error: err instanceof Error ? err.message : String(err),
        deliveries: willFire.map((d) => ({
          channel: d.channel, status: "failed" as const,
          error: err instanceof Error ? err.message : String(err),
        })),
      });
    } finally {
      setTick((t) => t + 1);
    }
  }

  // Alerta global
  useEffect(() => {
    if (!alertEval.triggered) return;
    const ctaHash = cta !== "__all" ? cta : undefined;
    const originVal = origin !== "__all" ? origin : undefined;
    const rendered = renderAlertTemplate(tpl, {
      ...alertEval,
      minCtr: cfg.minCtr,
      minSendRate: cfg.minSendRate,
      windowHours: cfg.windowHours,
      ctaHash,
      origin: originVal,
    });
    dispatchAlert(
      "global",
      {
        title: rendered.title, body: rendered.body,
        ctr: alertEval.ctr, sendRate: alertEval.sendRate,
        impressions: alertEval.impressions, clicks: alertEval.clicks, sends: alertEval.sends,
        ctrBelow: alertEval.ctrBelow, sendBelow: alertEval.sendBelow,
        minCtr: cfg.minCtr, minSendRate: cfg.minSendRate, windowHours: cfg.windowHours,
        ctaHash, origin: originVal,
      },
      { ctaHash },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertEval.triggered]);

  // Alertas por regra (route / variant) — dispatch por canal
  useEffect(() => {
    for (const ev of ruleEvals) {
      if (!ev.triggered) continue;
      const rendered = renderAlertTemplate(tpl, {
        ...ev,
        minCtr: ev.rule.minCtr, minSendRate: ev.rule.minSendRate,
        windowHours: ev.rule.windowHours, path: ev.rule.route,
      });
      const title = `[${ev.rule.label || ev.scope}] ${rendered.title}`;
      dispatchRuleAlert(ev.rule, ev, { title, body: rendered.body });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleEvals.map((e) => `${e.rule.id}:${e.triggered}`).join("|")]);

  // Envio do resumo diário (manual ou auto se ainda não enviado hoje)
  async function sendDailySummary(force = false) {
    if (!force && dailySummaryAlreadySent()) return;
    const summary = buildDailySummary(all, history);
    const { title, body } = renderDailySummary(summary);
    const payload: AlertPayload = {
      title, body,
      ctr: summary.totals.ctr, sendRate: summary.totals.sendRate,
      impressions: summary.totals.impressions, clicks: summary.totals.clicks,
      sends: summary.totals.sends,
      ctrBelow: false, sendBelow: false,
      minCtr: 0, minSendRate: 0, windowHours: 24,
    };
    await dispatchAlert("daily_summary", payload, {});
    markDailySummarySent();
  }

  /** Reenvio manual a partir de uma entrada com falha. */
  async function retryEntry(entry: AlertHistoryEntry) {
    if (!entry.payload || !entry.id) return;
    const failedChannels = (entry.deliveries ?? []).filter((d) => d.status === "failed");
    const channels = failedChannels.length > 0
      ? { slack: failedChannels.some((d) => d.channel === "slack"),
          email: failedChannels.some((d) => d.channel === "email") }
      : undefined;
    try {
      const res = await notify({ data: { ...entry.payload, channels } });
      const sentChannels = new Set(res?.channels ?? []);
      const serverResults = new Map((res?.results ?? []).map((r) => [r.channel, r]));
      const merged: ChannelDelivery[] = (entry.deliveries ?? []).map((d) => {
        if (channels && !channels[d.channel as "slack" | "email"]) return d;
        const r = serverResults.get(d.channel);
        if (r?.status === "sent") return { ...d, status: "sent", error: undefined, ts: Date.now() };
        if (r?.status === "failed") return { ...d, status: "failed", error: r.error, ts: Date.now() };
        return d;
      });
      const sentCount = merged.filter((d) => d.status === "sent").length;
      const failedCount = merged.filter((d) => d.status === "failed").length;
      const status: AlertHistoryEntry["status"] =
        sentCount > 0 && failedCount > 0 ? "partial"
        : sentCount > 0 ? "sent"
        : failedCount > 0 ? "failed"
        : "no_channels";
      updateAlertHistory(entry.id, {
        notified: Array.from(sentChannels), status,
        error: res?.error, deliveries: merged, ts: Date.now(),
      });
    } catch (err) {
      updateAlertHistory(entry.id, {
        notified: [], status: "failed",
        error: err instanceof Error ? err.message : String(err),
        ts: Date.now(),
      });
    }
    setTick((t) => t + 1);
  }




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
      .filter((e) => hStatus === "__all" || (e.status ?? "sent") === hStatus)
      .sort((a, b) => b.ts - a.ts);
  }, [history, hFrom, hTo, hCta, hStatus]);

  function exportHistoryCSV() {
    const head = [
      "ts", "iso", "scope", "status", "error", "ctr", "sendRate",
      "impressions", "clicks", "sends", "ctrBelow", "sendBelow",
      "minCtr", "minSendRate", "windowHours", "ctaHash", "notified",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = historyFiltered.map((e) =>
      [e.ts, new Date(e.ts).toISOString(), e.scope ?? "global", e.status ?? "sent",
       e.error ?? "", e.ctr.toFixed(2), e.sendRate.toFixed(2),
       e.impressions, e.clicks, e.sends, e.ctrBelow, e.sendBelow,
       e.minCtr, e.minSendRate, e.windowHours, e.ctaHash ?? "",
       (e.notified ?? []).join("|")].map(esc).join(","),
    );
    download(`wa-alert-history-${Date.now()}.csv`, [head.join(","), ...lines].join("\n"));
  }

  function runSimulation() {
    const out = simulateAlertRules(all, rules, simDays, {
      stepMinutes: simStep, includeNonFiring: simIncludeSuppressed,
    });
    setSimResult(out);
  }

  function exportSimulationCSV() {
    const head = ["ts", "iso", "ruleId", "ruleLabel", "scope", "channel", "status",
      "ctr", "sendRate", "impressions", "clicks", "sends",
      "ctrBelow", "sendBelow", "effMinCtr", "effMinSendRate", "reason"];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = simResult.map((e) =>
      [e.ts, new Date(e.ts).toISOString(), e.ruleId, e.ruleLabel ?? "", e.scope,
       e.channel, e.status, e.ctr.toFixed(2), e.sendRate.toFixed(2),
       e.impressions, e.clicks, e.sends, e.ctrBelow, e.sendBelow,
       e.effectiveMinCtr, e.effectiveMinSendRate, e.reason ?? ""].map(esc).join(","));
    download(`wa-alert-simulation-${Date.now()}.csv`, [head.join(","), ...lines].join("\n"));
  }

  function exportDailySummaryCSV() {
    const from = dsFrom ? new Date(dsFrom + "T00:00:00")
      : new Date(Date.now() - 7 * 24 * 3_600_000);
    const to = dsTo ? new Date(dsTo + "T23:59:59") : new Date();
    const ruleFilter = dsRule !== "__all" ? dsRule : undefined;
    const rows = buildDailySummaryRange(all, history, from, to, ruleFilter);
    const head = ["date", "ctaHash", "impressions", "clicks", "sends",
      "ctr", "sendRate", "alertsFired"];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((r) => [r.date, r.ctaHash, r.impressions, r.clicks,
      r.sends, r.ctr.toFixed(2), r.sendRate.toFixed(2), r.alertsFired]
      .map(esc).join(","));
    download(`wa-daily-summary-${Date.now()}.csv`, [head.join(","), ...lines].join("\n"));
  }

  // Auditoria atual por regra (decisão por canal agora)
  const auditNow = useMemo(() =>
    ruleEvals.map((ev) => ({
      ev,
      decisions: planChannelDispatch(ev, ev.rule),
    })),
    [ruleEvals],
  );


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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="rules">
            <ShieldAlert className="w-4 h-4 mr-1" /> Regras + Resumo diário
            {rules.length > 0 && <Badge variant="secondary" className="ml-2">{rules.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Eye className="w-4 h-4 mr-1" /> Auditoria por regra
          </TabsTrigger>
          <TabsTrigger value="simulation">
            <FlaskConical className="w-4 h-4 mr-1" /> Simulação
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-1" /> Histórico
            {history.length > 0 && <Badge variant="secondary" className="ml-2">{history.length}</Badge>}
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

        <TabsContent value="rules" className="space-y-4 mt-4">
          <RulesEditor
            rules={rules}
            setRules={setRules}
            routes={opts.routes}
            variants={opts.variants}
            evals={ruleEvals}
            onSave={() => { saveAlertRules(rules); setTick((t) => t + 1); }}
          />

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <h2 className="text-lg font-semibold">Resumo diário por CTA hash</h2>
              {dailySummaryAlreadySent()
                ? <Badge variant="secondary"><ShieldCheck className="w-3 h-3 mr-1" /> Enviado hoje</Badge>
                : <Badge variant="outline">Pendente</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              Envia um e-mail/Slack com totais e quebra por CTA hash do dia. Usa o mesmo
              canal das notificações de alerta e o mesmo cooldown (1 envio/dia + 1h por escopo).
              Pode ser disparado manualmente.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => sendDailySummary(false)}
                disabled={dailySummaryAlreadySent()}>
                Enviar resumo de hoje
              </Button>
              <Button size="sm" variant="outline" onClick={() => sendDailySummary(true)}>
                Forçar reenvio
              </Button>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Pré-visualização</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2">
{(() => {
  const s = buildDailySummary(all, history);
  const r = renderDailySummary(s);
  return `${r.title}\n\n${r.body}`;
})()}
              </pre>
            </details>
          </Card>

          {/* CSV do resumo diário por CTA hash com filtros por data e regra */}
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <h2 className="text-lg font-semibold">Exportar resumo diário por CTA hash</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Gera CSV com CTR, taxa de envio e alertas disparados por dia/CTA hash.
              Filtre por intervalo e regra para análise externa.
            </p>
            <div className="grid gap-3 md:grid-cols-4 items-end">
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" value={dsFrom} max={today}
                  onChange={(e) => setDsFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={dsTo} max={today}
                  onChange={(e) => setDsTo(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Regra</Label>
                <Select value={dsRule} onValueChange={setDsRule}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Todas</SelectItem>
                    {rules.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label || r.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={exportDailySummaryCSV}>
                <Download className="w-4 h-4 mr-1" /> Baixar CSV
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Auditoria por regra/escopo — métrica e motivo de cada decisão agora */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <h2 className="text-lg font-semibold">Auditoria detalhada por regra</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Mostra a métrica que disparou (ou não) cada regra agora, e por que cada
              canal foi enviado, suprimido por cooldown ou por amostragem insuficiente.
              Reflete o estado atual do localStorage de cooldown.
            </p>
          </Card>

          {auditNow.length === 0 && (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                Nenhuma regra configurada. Vá em "Regras + Resumo diário".
              </p>
            </Card>
          )}

          {auditNow.map(({ ev, decisions }) => (
            <Card key={ev.rule.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-sm">{ev.rule.label || ev.rule.id}</strong>
                <code className="text-xs text-muted-foreground">{ev.scope}</code>
                {ev.triggered ? (
                  <Badge variant="destructive">Disparado</Badge>
                ) : (
                  <Badge variant="secondary">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  Janela {ev.rule.windowHours}h · amostras ≥ {ev.rule.minSamples}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-5 text-xs">
                <div><span className="text-muted-foreground">Impressões:</span> <strong>{ev.impressions}</strong></div>
                <div><span className="text-muted-foreground">Cliques:</span> <strong>{ev.clicks}</strong></div>
                <div><span className="text-muted-foreground">Envios:</span> <strong>{ev.sends}</strong></div>
                <div>
                  <span className="text-muted-foreground">CTR:</span>{" "}
                  <strong className={ev.ctrBelow ? "text-destructive" : ""}>
                    {ev.ctr.toFixed(1)}%
                  </strong>{" "}
                  <span className="text-muted-foreground">/ min {ev.rule.minCtr}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Envio:</span>{" "}
                  <strong className={ev.sendBelow ? "text-destructive" : ""}>
                    {ev.sendRate.toFixed(1)}%
                  </strong>{" "}
                  <span className="text-muted-foreground">/ min {ev.rule.minSendRate}%</span>
                </div>
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="text-xs text-muted-foreground mb-1">Decisão por canal:</div>
                {decisions.map((d) => (
                  <DecisionRow key={d.channel} d={d} scope={ev.scope} />
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Simulação histórica das regras */}
        <TabsContent value="simulation" className="space-y-4 mt-4">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              <h2 className="text-lg font-semibold">
                Simular regras sobre o histórico
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Reaplica as regras ativas em janelas deslizantes ao longo dos
              últimos N dias do buffer local, com cooldown e dedup por canal.
              Mostra exatamente quais alertas teriam disparado.
            </p>
            <div className="grid gap-3 md:grid-cols-5 items-end">
              <div>
                <Label className="text-xs">Dias</Label>
                <Input type="number" min={1} max={60} value={simDays}
                  onChange={(e) => setSimDays(Number(e.target.value) || 7)} />
              </div>
              <div>
                <Label className="text-xs">Step (min)</Label>
                <Input type="number" min={5} max={1440} value={simStep}
                  onChange={(e) => setSimStep(Number(e.target.value) || 60)} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={simIncludeSuppressed}
                  onCheckedChange={setSimIncludeSuppressed} />
                <Label className="text-xs">Mostrar suprimidos (cooldown/limite)</Label>
              </div>
              <Button size="sm" onClick={runSimulation} disabled={rules.length === 0}>
                <RefreshCw className="w-4 h-4 mr-1" /> Rodar simulação
              </Button>
              <Button size="sm" variant="outline" onClick={exportSimulationCSV}
                disabled={simResult.length === 0}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            {simResult.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem resultado. Configure regras e clique em "Rodar simulação".
              </p>
            ) : (
              <>
                <div className="text-xs text-muted-foreground mb-2">
                  {simResult.filter((r) => r.status === "fired").length} disparos ·{" "}
                  {simResult.filter((r) => r.status === "suppressed_cooldown").length}{" "}
                  suprimidos por cooldown ·{" "}
                  {simResult.filter((r) => r.status === "suppressed_thresholds").length}{" "}
                  suprimidos por limites
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-3">Quando</th>
                        <th className="py-2 pr-3">Regra</th>
                        <th className="py-2 pr-3">Escopo</th>
                        <th className="py-2 pr-3">Canal</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">CTR/Envio</th>
                        <th className="py-2 pr-3">I/C/E</th>
                        <th className="py-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResult.slice(0, 200).map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap text-xs">
                            {new Date(r.ts).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 pr-3 text-xs">{r.ruleLabel || r.ruleId}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{r.scope}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline">{r.channel}</Badge>
                          </td>
                          <td className="py-2 pr-3">
                            <SimStatusBadge status={r.status} />
                          </td>
                          <td className="py-2 pr-3 text-xs">
                            {r.ctr.toFixed(1)}% / {r.sendRate.toFixed(1)}%
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs">
                            {r.impressions}/{r.clicks}/{r.sends}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {r.reason ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {simResult.length > 200 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Mostrando 200 de {simResult.length}. Exporte CSV para ver todos.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        </TabsContent>


        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="p-4 grid gap-3 md:grid-cols-6 items-end">
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
            <FilterSelect label="CTA hash" value={hCta} setValue={setHCta} options={historyCtaOptions} />
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={hStatus} onValueChange={(v) => setHStatus(v as typeof hStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                  <SelectItem value="cooldown">Cooldown</SelectItem>
                  <SelectItem value="no_channels">Sem canal</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button size="sm" variant="outline"
                onClick={() => { setHFrom(""); setHTo(""); setHCta("__all"); setHStatus("__all"); }}>
                Limpar filtro
              </Button>
              <Button size="sm" onClick={exportHistoryCSV} disabled={historyFiltered.length === 0}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => { clearAlertHistory(); setTick((t) => t + 1); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Limpar histórico
              </Button>
            </div>
          </Card>

          {/* Editor do template de mensagem */}
          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold">Template de mensagem (Slack / e-mail)</h2>
            <p className="text-xs text-muted-foreground">
              Placeholders disponíveis:{" "}
              <code>{"{ctr} {sendRate} {impressions} {clicks} {sends} {minCtr} {minSendRate} {windowHours} {ctaHash} {origin} {path} {reason}"}</code>
            </p>
            <div className="space-y-2">
              <Label className="text-xs">Título</Label>
              <Input value={tpl.title} onChange={(e) => setTpl({ ...tpl, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Corpo</Label>
              <textarea
                className="w-full min-h-[140px] rounded-md border bg-background p-2 text-sm font-mono"
                value={tpl.body}
                onChange={(e) => setTpl({ ...tpl, body: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { saveAlertTemplate(tpl); setTick((t) => t + 1); }}>
                Salvar template
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => { saveAlertTemplate(DEFAULT_ALERT_TEMPLATE); setTpl(DEFAULT_ALERT_TEMPLATE); }}>
                Restaurar padrão
              </Button>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Pré-visualização com a janela atual</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2">
{(() => {
  const r = renderAlertTemplate(tpl, {
    ctr: alertEval.ctr,
    sendRate: alertEval.sendRate,
    impressions: alertEval.impressions,
    clicks: alertEval.clicks,
    sends: alertEval.sends,
    ctrBelow: alertEval.ctrBelow || true,
    sendBelow: alertEval.sendBelow || true,
    minCtr: cfg.minCtr,
    minSendRate: cfg.minSendRate,
    windowHours: cfg.windowHours,
    ctaHash: hCta !== "__all" ? hCta : undefined,
    origin: origin !== "__all" ? origin : undefined,
  });
  return `${r.title}\n\n${r.body}`;
})()}
              </pre>
            </details>
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
                      <th className="py-2 pr-4">Escopo</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Motivo</th>
                      <th className="py-2 pr-4">CTR/Envio</th>
                      <th className="py-2 pr-4">I/C/E</th>
                      <th className="py-2 pr-4">CTA hash</th>
                      <th className="py-2 pr-4">Notificações</th>
                      <th className="py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyFiltered.map((e) => {
                      const status = e.status ?? (e.notified && e.notified.length > 0 ? "sent" : "cooldown");
                      return (
                        <tr key={e.id ?? e.ts} className="border-b last:border-0 align-top">
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {new Date(e.ts).toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">{e.scope ?? "global"}</td>
                          <td className="py-2 pr-4">
                            <StatusBadge status={status} />
                            {e.error && (
                              <div className="text-xs text-destructive mt-1 max-w-[220px] truncate" title={e.error}>
                                {e.error}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            {e.ctrBelow && <Badge variant="destructive" className="mr-1">CTR</Badge>}
                            {e.sendBelow && <Badge variant="destructive">Envio</Badge>}
                          </td>
                          <td className="py-2 pr-4 text-xs">
                            {e.ctr.toFixed(1)}% / {e.sendRate.toFixed(1)}%
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">
                            {e.impressions}/{e.clicks}/{e.sends}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs">{e.ctaHash ?? "—"}</td>
                          <td className="py-2 pr-4">
                            {e.deliveries && e.deliveries.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {e.deliveries.map((d) => (
                                  <DeliveryBadge key={d.channel} d={d} />
                                ))}
                              </div>
                            ) : e.notified && e.notified.length > 0 ? (
                              e.notified.map((c) => (
                                <Badge key={c} variant="outline" className="mr-1">{c}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            {(status === "failed" || status === "no_channels") && e.payload ? (
                              <Button size="sm" variant="outline" onClick={() => retryEntry(e)}>
                                <RotateCcw className="w-3 h-3 mr-1" /> Reenviar
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
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

function SimStatusBadge({ status }: { status: SimulationDispatch["status"] }) {
  const map: Record<SimulationDispatch["status"], { v: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    fired: { v: "destructive", label: "Disparou" },
    suppressed_cooldown: { v: "secondary", label: "Cooldown" },
    suppressed_thresholds: { v: "outline", label: "Limite OK" },
    below_samples: { v: "outline", label: "Amostra baixa" },
    disabled: { v: "outline", label: "Desativado" },
  };
  const c = map[status];
  return <Badge variant={c.v}>{c.label}</Badge>;
}

function DeliveryBadge({ d }: { d: ChannelDelivery }) {
  const variant: "default" | "secondary" | "destructive" | "outline" =
    d.status === "sent" ? "default"
    : d.status === "failed" ? "destructive"
    : "outline";
  const icon = d.channel === "slack" ? "💬" : "✉️";
  return (
    <Badge variant={variant} title={d.error ?? d.status}>
      {icon} {d.channel}: {d.status}
    </Badge>
  );
}

function DecisionRow({ d, scope }: { d: ChannelDecision; scope: string }) {
  const fmtCooldown = (until?: number) => {
    if (!until) return "";
    const left = Math.max(0, until - Date.now());
    const m = Math.ceil(left / 60_000);
    return `${m}min`;
  };
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="min-w-[60px] justify-center">
        {d.channel}
      </Badge>
      {d.willFire ? (
        <Badge variant="destructive">Vai disparar</Badge>
      ) : (
        <Badge variant="secondary">Bloqueado</Badge>
      )}
      <span className="text-muted-foreground">
        limite CTR {d.effectiveMinCtr}% · envio {d.effectiveMinSendRate}% ·
        cooldown {Math.round(d.cooldownMs / 60_000)}min
      </span>
      {d.reason && (
        <span className="ml-auto text-muted-foreground">
          motivo: <strong>{d.reason}</strong>
          {d.reason === "cooldown" && d.cooldownUntil && (
            <> — libera em {fmtCooldown(d.cooldownUntil)}</>
          )}
        </span>
      )}
      <code className="text-[10px] text-muted-foreground">{scope}</code>
    </div>
  );
}

function StatusBadge({ status }: { status: AlertHistoryEntry["status"] }) {
  const cfg: Record<string, { v: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    sent: { v: "default", label: "Enviado" },
    partial: { v: "outline", label: "Parcial" },
    failed: { v: "destructive", label: "Falha" },
    cooldown: { v: "secondary", label: "Cooldown" },
    no_channels: { v: "outline", label: "Sem canal" },
  };
  const c = cfg[status ?? "sent"] ?? cfg.sent;
  return <Badge variant={c.v}>{c.label}</Badge>;
}

function RulesEditor({
  rules, setRules, routes, variants, evals, onSave,
}: {
  rules: AlertRule[];
  setRules: (r: AlertRule[]) => void;
  routes: string[];
  variants: string[];
  evals: ReturnType<typeof evaluateAlertRules>;
  onSave: () => void;
}) {
  const evalById = new Map(evals.map((e) => [e.rule.id, e]));
  function addRule() {
    setRules([
      ...rules,
      {
        id: `rule_${Date.now().toString(36)}`,
        label: "Nova regra",
        route: "",
        variant: "",
        minCtr: 5,
        minSendRate: 30,
        windowHours: 24,
        minSamples: 20,
        enabled: true,
      },
    ]);
  }
  function update(id: string, patch: Partial<AlertRule>) {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: string) {
    setRules(rules.filter((r) => r.id !== id));
  }
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Regras de alerta por rota e variante</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addRule}>
            <Plus className="w-4 h-4 mr-1" /> Nova regra
          </Button>
          <Button size="sm" onClick={onSave}>Salvar regras</Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Cada regra avalia o subconjunto de eventos da rota/variante e dispara alerta
        independente (com cooldown próprio). Deixe em branco para qualquer valor.
      </p>
      {rules.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma regra. Adicione uma para comparar performance por rota ou variante A/B.
        </p>
      )}
      {rules.map((r) => {
        const ev = evalById.get(r.id);
        return (
          <Card key={r.id} className="p-4 space-y-3 border-dashed">
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                className="max-w-[220px]"
                value={r.label ?? ""}
                placeholder="Rótulo"
                onChange={(e) => update(r.id, { label: e.target.value })}
              />
              <Switch checked={r.enabled !== false}
                onCheckedChange={(v) => update(r.id, { enabled: v })} />
              {ev?.triggered ? (
                <Badge variant="destructive">Disparado</Badge>
              ) : (
                <Badge variant="secondary">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {ev ? `${ev.impressions} impr · ${ev.clicks} cliq · ${ev.sends} env — CTR ${ev.ctr.toFixed(1)}% · envio ${ev.sendRate.toFixed(1)}%` : ""}
              </span>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-6">
              <div>
                <Label className="text-xs">Rota</Label>
                <Select value={r.route || "__any"} onValueChange={(v) => update(r.id, { route: v === "__any" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any">Qualquer</SelectItem>
                    {routes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Variante</Label>
                <Select value={r.variant || "__any"} onValueChange={(v) => update(r.id, { variant: v === "__any" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any">Qualquer</SelectItem>
                    {variants.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">CTR mínimo (%)</Label>
                <Input type="number" min={0} value={r.minCtr}
                  onChange={(e) => update(r.id, { minCtr: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Envio mínimo (%)</Label>
                <Input type="number" min={0} value={r.minSendRate}
                  onChange={(e) => update(r.id, { minSendRate: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs">Janela (h)</Label>
                <Input type="number" min={1} value={r.windowHours}
                  onChange={(e) => update(r.id, { windowHours: Number(e.target.value) || 1 })} />
              </div>
              <div>
                <Label className="text-xs">Amostras mín.</Label>
                <Input type="number" min={0} value={r.minSamples}
                  onChange={(e) => update(r.id, { minSamples: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                Limites e cooldown por canal (vazio = usa o da regra; cooldown padrão 60min).
              </div>
              {ALERT_CHANNELS.map((channel) => {
                const c = r.channels?.[channel];
                const setCh = (patch: Partial<NonNullable<typeof c>>) =>
                  update(r.id, {
                    channels: {
                      ...(r.channels ?? {}),
                      [channel]: { enabled: true, ...(c ?? {}), ...patch },
                    },
                  });
                return (
                  <div key={channel} className="grid gap-2 md:grid-cols-5 items-center">
                    <div className="flex items-center gap-2">
                      <Switch checked={c?.enabled ?? true}
                        onCheckedChange={(v) => setCh({ enabled: v })} />
                      <Badge variant="outline">{channel}</Badge>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">CTR min</Label>
                      <Input type="number" min={0} placeholder={String(r.minCtr)}
                        value={c?.minCtr ?? ""}
                        onChange={(e) => setCh({
                          minCtr: e.target.value === "" ? undefined : Number(e.target.value),
                        })} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Envio min</Label>
                      <Input type="number" min={0} placeholder={String(r.minSendRate)}
                        value={c?.minSendRate ?? ""}
                        onChange={(e) => setCh({
                          minSendRate: e.target.value === "" ? undefined : Number(e.target.value),
                        })} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Cooldown (min)</Label>
                      <Input type="number" min={1} placeholder="60"
                        value={c?.cooldownMinutes ?? ""}
                        onChange={(e) => setCh({
                          cooldownMinutes: e.target.value === "" ? undefined : Number(e.target.value),
                        })} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Último envio:{" "}
                      {(() => {
                        const t = readChannelCooldown(ruleScope(r), channel);
                        return t ? new Date(t).toLocaleString("pt-BR") : "—";
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </Card>
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
