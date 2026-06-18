/**
 * Canal oficial único — utilitários compartilhados.
 *
 * Mantém em um único lugar:
 *  - número/URL oficial do WhatsApp (21) 99307-5000
 *  - construção de links com UTM + origem + variante (A/B) para rastreio
 *  - rastreamento de cliques e submissões (GA + buffer local p/ painel)
 *  - validação de mensagens que tentem desviar a conversa para canais
 *    não oficiais (outros telefones, e-mails, redes sociais).
 */
import { trackEvent } from "@/lib/analytics";

export const OFFICIAL_WHATSAPP_PHONE_DISPLAY = "(21) 99307-5000";
export const OFFICIAL_WHATSAPP_PHONE_E164 = "+5521993075000";
export const OFFICIAL_WHATSAPP_DIGITS = "5521993075000";
export const OFFICIAL_EMAIL_DOMAIN = "impulsionando.com.br";

export type WhatsAppCTAVariant = "A" | "B" | "control" | string;

export interface WhatsAppLinkOptions {
  /** Onde o link aparece — usado em data-cta, GA e utm_content. */
  origin?: string;
  /** Rota/página onde o CTA está sendo renderizado. */
  path?: string;
  /** Variante para experimentos A/B. */
  variant?: WhatsAppCTAVariant;
  /** Campanha de marketing (utm_campaign). */
  campaign?: string;
  /** Mídia (utm_medium). Default: "whatsapp". */
  medium?: string;
  /** Fonte (utm_source). Default: "site_oficial". */
  source?: string;
}

function appendUTM(message: string, opts: WhatsAppLinkOptions): string {
  const utm = [
    `utm_source=${opts.source ?? "site_oficial"}`,
    `utm_medium=${opts.medium ?? "whatsapp"}`,
    opts.campaign ? `utm_campaign=${encodeURIComponent(opts.campaign)}` : `utm_campaign=canal_oficial`,
    opts.origin ? `utm_content=${encodeURIComponent(opts.origin)}` : undefined,
    opts.variant ? `utm_term=${encodeURIComponent(`v_${opts.variant}`)}` : undefined,
    opts.path ? `utm_path=${encodeURIComponent(opts.path)}` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");
  return `${message}\n\n— ${utm}`;
}

export function buildOfficialWhatsAppUrl(
  message?: string,
  opts: WhatsAppLinkOptions = {},
): string {
  const base = message?.trim() || "Olá! Vim pelo site oficial da Impulsionando.";
  const withUtm = appendUTM(base, opts);
  const url = new URL(`https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}`);
  url.searchParams.set("text", withUtm);
  // UTM também como query no link (alguns trackers leem só da URL).
  url.searchParams.set("utm_source", opts.source ?? "site_oficial");
  url.searchParams.set("utm_medium", opts.medium ?? "whatsapp");
  url.searchParams.set("utm_campaign", opts.campaign ?? "canal_oficial");
  if (opts.origin) url.searchParams.set("utm_content", opts.origin);
  if (opts.variant) url.searchParams.set("utm_term", `v_${opts.variant}`);
  return url.toString();
}

export type WhatsAppCTAEvent =
  | "whatsapp_cta_click"
  | "whatsapp_form_submit"
  | "whatsapp_fab_click"
  | "whatsapp_notice_click"
  | "whatsapp_cta_impression"
  | "whatsapp_cta_sent"; // retorno do WhatsApp (presumido envio)

const METRICS_KEY = "wa_official_metrics_v1";
const ALERTS_KEY = "wa_official_alerts_v1";
const PENDING_KEY = "wa_official_pending_v1";
const ALERT_HISTORY_KEY = "wa_official_alert_history_v1";
const LAST_CLICK_KEY = "wa_official_last_click_v1";
const LAST_SENT_KEY = "wa_official_last_sent_v1";
const LAST_ALERT_KEY = "wa_official_last_alert_notify_v1";
const CLICK_DEDUP_MS = 2_000;
const SENT_DEDUP_MS = 30_000;
const ALERT_NOTIFY_COOLDOWN_MS = 60 * 60_000;
const MAX_BUFFER = 1000;

export interface BufferedEvent {
  ts: number;
  event: WhatsAppCTAEvent;
  origin: string;
  path: string;
  variant?: string;
  campaign?: string;
  ctaText?: string;
  ctaHash?: string;
}

export interface AlertConfig {
  /** CTR mínimo (%). 0 desativa. */
  minCtr: number;
  /** Taxa de envio mínima (%). 0 desativa. */
  minSendRate: number;
  /** Janela em horas para o cálculo. */
  windowHours: number;
  /** Mínimo de amostras antes de validar. */
  minSamples: number;
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  minCtr: 5,
  minSendRate: 30,
  windowHours: 24,
  minSamples: 20,
};

/** Hash curto e determinístico do texto do CTA (versionamento automático). */
export function hashCtaText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).slice(0, 8);
}

function pushLocalBuffer(entry: BufferedEvent) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    const arr: BufferedEvent[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    if (arr.length > MAX_BUFFER) arr.splice(0, arr.length - MAX_BUFFER);
    window.localStorage.setItem(METRICS_KEY, JSON.stringify(arr));
  } catch {
    /* quota / privado — ignorar */
  }
}

export function readWhatsAppLocalMetrics(): BufferedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(METRICS_KEY);
    return raw ? (JSON.parse(raw) as BufferedEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearWhatsAppLocalMetrics() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(METRICS_KEY);
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}

export function readAlertConfig(): AlertConfig {
  if (typeof window === "undefined") return DEFAULT_ALERT_CONFIG;
  try {
    const raw = window.localStorage.getItem(ALERTS_KEY);
    return raw ? { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(raw) } : DEFAULT_ALERT_CONFIG;
  } catch {
    return DEFAULT_ALERT_CONFIG;
  }
}

export function saveAlertConfig(cfg: AlertConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ALERTS_KEY, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

export interface AlertEval {
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  triggered: boolean;
}

export function evaluateAlerts(
  rows: BufferedEvent[],
  cfg: AlertConfig = readAlertConfig(),
): AlertEval {
  const since = Date.now() - cfg.windowHours * 3_600_000;
  const win = rows.filter((r) => r.ts >= since);
  const impressions = win.filter((r) => r.event === "whatsapp_cta_impression").length;
  const clicks = win.filter((r) =>
    ["whatsapp_cta_click", "whatsapp_fab_click", "whatsapp_notice_click"].includes(r.event),
  ).length;
  const sends = win.filter(
    (r) => r.event === "whatsapp_form_submit" || r.event === "whatsapp_cta_sent",
  ).length;
  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const sendRate = clicks ? (sends / clicks) * 100 : 0;
  const ctrBelow = cfg.minCtr > 0 && impressions >= cfg.minSamples && ctr < cfg.minCtr;
  const sendBelow = cfg.minSendRate > 0 && clicks >= cfg.minSamples && sendRate < cfg.minSendRate;
  return { ctr, sendRate, impressions, clicks, sends, ctrBelow, sendBelow, triggered: ctrBelow || sendBelow };
}

export function trackWhatsAppCTA(
  event: WhatsAppCTAEvent,
  params: {
    origin: string;
    variant?: WhatsAppCTAVariant;
    campaign?: string;
    ctaText?: string;
    [key: string]: unknown;
  } = { origin: "unknown" },
) {
  const path =
    (params.path as string | undefined) ??
    (typeof window !== "undefined" ? window.location.pathname : "ssr");
  const variant = params.variant as string | undefined;
  const campaign = params.campaign as string | undefined;
  const ctaText = params.ctaText as string | undefined;
  const ctaHash = ctaText ? hashCtaText(ctaText) : (params.ctaHash as string | undefined);

  // Dedup de cliques repetidos (mesma origem/rota/cta em < 2s) — evita
  // contagem dupla quando o link dispara click + auxlistener, ou quando o
  // usuário clica freneticamente no mesmo CTA.
  const isClick =
    event === "whatsapp_cta_click" ||
    event === "whatsapp_fab_click" ||
    event === "whatsapp_notice_click";
  if (isClick && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LAST_CLICK_KEY);
      const last = raw ? (JSON.parse(raw) as { ts: number; key: string }) : null;
      const key = `${event}|${params.origin}|${path}|${ctaHash ?? ""}`;
      if (last && last.key === key && Date.now() - last.ts < CLICK_DEDUP_MS) return;
      window.localStorage.setItem(LAST_CLICK_KEY, JSON.stringify({ ts: Date.now(), key }));
    } catch {
      /* noop */
    }
  }

  // Dedup do envio presumido: só permite 1 `whatsapp_cta_sent` a cada 30s.
  if (event === "whatsapp_cta_sent" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LAST_SENT_KEY);
      const lastTs = raw ? Number(raw) : 0;
      if (lastTs && Date.now() - lastTs < SENT_DEDUP_MS) return;
      window.localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
  }

  try {
    trackEvent(event, {
      channel: "whatsapp_official",
      phone: OFFICIAL_WHATSAPP_PHONE_DISPLAY,
      path,
      variant,
      campaign,
      cta_hash: ctaHash,
      ...params,
    });
  } catch {
    /* analytics opt-out ou falha — silencioso */
  }
  pushLocalBuffer({
    ts: Date.now(),
    event,
    origin: String(params.origin ?? "unknown"),
    path,
    variant,
    campaign,
    ctaText,
    ctaHash,
  });
  // Marca cliques como pendentes p/ confirmar envio quando o usuário voltar.
  if (isClick) {
    markPendingSend({ origin: String(params.origin ?? "unknown"), path, variant, campaign, ctaText, ctaHash });
  }
}

function markPendingSend(meta: Omit<BufferedEvent, "ts" | "event">) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const arr: Array<Omit<BufferedEvent, "event">> = raw ? JSON.parse(raw) : [];
    arr.push({ ts: Date.now(), ...meta });
    if (arr.length > 20) arr.splice(0, arr.length - 20);
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

/**
 * Listener global de visibilidade: se o usuário sai da aba logo após clicar
 * no link oficial e demora >= 8s para voltar, presumimos que enviou e
 * registramos `whatsapp_cta_sent` no GA4 e no buffer local — uma única vez
 * por clique (o `pending` é consumido após o primeiro retorno qualificado).
 */
export function installWhatsAppReturnTracking() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __waReturnInstalled?: boolean };
  if (w.__waReturnInstalled) return;
  w.__waReturnInstalled = true;

  let hiddenAt: number | null = null;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
      return;
    }
    const away = hiddenAt ? Date.now() - hiddenAt : 0;
    hiddenAt = null;
    if (away < 8_000) return;
    try {
      const raw = window.localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const pending: Array<Omit<BufferedEvent, "event">> = JSON.parse(raw);
      // Apenas pendências frescas (<30min) que ainda não foram consumidas.
      const fresh = pending.filter((p) => Date.now() - p.ts < 30 * 60_000);
      if (fresh.length === 0) {
        window.localStorage.setItem(PENDING_KEY, JSON.stringify([]));
        return;
      }
      const last = fresh[fresh.length - 1];
      // CONSUMIR ANTES de disparar — garante 1 sent por clique mesmo que o
      // usuário alterne de aba várias vezes em sequência.
      window.localStorage.setItem(PENDING_KEY, JSON.stringify([]));
      trackWhatsAppCTA("whatsapp_cta_sent", {
        origin: last.origin,
        path: last.path,
        variant: last.variant,
        campaign: last.campaign,
        ctaText: last.ctaText,
        ctaHash: last.ctaHash,
        away_ms: away,
      });
    } catch {
      /* noop */
    }
  });
}

// ============ Histórico de alertas (auditoria) ============
export type AlertDispatchStatus =
  | "sent" | "partial" | "failed" | "cooldown" | "no_channels";

export interface AlertPayload {
  title: string;
  body: string;
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  minCtr: number;
  minSendRate: number;
  windowHours: number;
  ctaHash?: string;
  origin?: string;
  path?: string;
}

export interface ChannelDelivery {
  channel: AlertChannel;
  status: "sent" | "failed" | "skipped" | "cooldown" | "disabled";
  error?: string;
  ts?: number;
}

export interface AlertHistoryEntry {
  id?: string;
  ts: number;
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  windowHours: number;
  minCtr: number;
  minSendRate: number;
  ctaHash?: string;
  notified?: string[]; // canais que receberam (slack, email)
  // Auditoria
  status?: AlertDispatchStatus;
  error?: string;
  scope?: string;
  ruleId?: string;
  payload?: AlertPayload;
  /** Entrega individual por canal (auditoria + retry seletivo). */
  deliveries?: ChannelDelivery[];
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recordAlertHistory(entry: AlertHistoryEntry) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ALERT_HISTORY_KEY);
    const arr: AlertHistoryEntry[] = raw ? JSON.parse(raw) : [];
    arr.push({ id: entry.id ?? uid(), ...entry });
    if (arr.length > 500) arr.splice(0, arr.length - 500);
    window.localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

/** Atualiza uma entrada existente (ex.: marcar reenvio como sent). */
export function updateAlertHistory(id: string, patch: Partial<AlertHistoryEntry>) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ALERT_HISTORY_KEY);
    if (!raw) return;
    const arr: AlertHistoryEntry[] = JSON.parse(raw);
    const idx = arr.findIndex((e) => e.id === id);
    if (idx === -1) return;
    arr[idx] = { ...arr[idx], ...patch };
    window.localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

export function readAlertHistory(): AlertHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ALERT_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AlertHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearAlertHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ALERT_HISTORY_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Cooldown global ou por escopo (rota/variante/regra) para não floodar
 * Slack/e-mail com o mesmo alerta. Retorna `true` se pode disparar agora
 * e já grava o timestamp.
 */
export function shouldNotifyAlertNow(scope = "global"): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = `${LAST_ALERT_KEY}:${scope}`;
    const raw = window.localStorage.getItem(key);
    const last = raw ? Number(raw) : 0;
    if (last && Date.now() - last < ALERT_NOTIFY_COOLDOWN_MS) return false;
    window.localStorage.setItem(key, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

// ============ Regras de alerta por rota / variante ============
const RULES_KEY = "wa_official_alert_rules_v1";

export const ALERT_CHANNELS = ["slack", "email"] as const;
export type AlertChannel = (typeof ALERT_CHANNELS)[number];

export interface ChannelThreshold {
  /** Habilita o canal nesta regra. */
  enabled: boolean;
  /** CTR mínimo (%) override por canal. Vazio = usa o da regra. */
  minCtr?: number;
  /** Taxa de envio mínima (%) override por canal. Vazio = usa o da regra. */
  minSendRate?: number;
  /** Cooldown em minutos (override do padrão de 60). */
  cooldownMinutes?: number;
}

export interface AlertRule {
  id: string;
  label?: string;
  route?: string;   // ex.: "/orcamento" — vazio = qualquer rota
  variant?: string; // ex.: "A" — vazio = qualquer variante
  minCtr: number;
  minSendRate: number;
  windowHours: number;
  minSamples: number;
  enabled: boolean;
  /** Limites e cooldown separados por canal (Slack / e-mail). */
  channels?: { slack?: ChannelThreshold; email?: ChannelThreshold };
}

export const DEFAULT_RULES: AlertRule[] = [];

export function readAlertRules(): AlertRule[] {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = window.localStorage.getItem(RULES_KEY);
    return raw ? (JSON.parse(raw) as AlertRule[]) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveAlertRules(rules: AlertRule[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch {
    /* noop */
  }
}

export function ruleScope(rule: Pick<AlertRule, "route" | "variant">): string {
  const parts: string[] = [];
  if (rule.route) parts.push(`route:${rule.route}`);
  if (rule.variant) parts.push(`variant:${rule.variant}`);
  return parts.join("|") || "global";
}

export function filterByRule(rows: BufferedEvent[], rule: Pick<AlertRule, "route" | "variant">) {
  return rows.filter((r) => {
    if (rule.route && r.path !== rule.route) return false;
    if (rule.variant && (r.variant ?? "control") !== rule.variant) return false;
    return true;
  });
}

export interface RuleEval extends AlertEval {
  rule: AlertRule;
  scope: string;
}

export function evaluateAlertRules(
  rows: BufferedEvent[],
  rules: AlertRule[] = readAlertRules(),
): RuleEval[] {
  return rules
    .filter((r) => r.enabled !== false)
    .map((rule) => {
      const scoped = filterByRule(rows, rule);
      const ev = evaluateAlerts(scoped, {
        minCtr: rule.minCtr,
        minSendRate: rule.minSendRate,
        windowHours: rule.windowHours,
        minSamples: rule.minSamples,
      });
      return { ...ev, rule, scope: ruleScope(rule) };
    });
}

// ============ Despacho por canal (limites + cooldown) ============
export interface ChannelDecision {
  channel: AlertChannel;
  enabled: boolean;
  willFire: boolean;
  ctrBelow: boolean;
  sendBelow: boolean;
  effectiveMinCtr: number;
  effectiveMinSendRate: number;
  cooldownMs: number;
  /** "disabled" | "thresholds_ok" | "below_samples" | "cooldown" */
  reason?: string;
  cooldownUntil?: number;
}

function chCooldownKey(scope: string, channel: AlertChannel) {
  return `${LAST_ALERT_KEY}:${scope}:${channel}`;
}

export function readChannelCooldown(scope: string, channel: AlertChannel): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(chCooldownKey(scope, channel));
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function markChannelDispatched(scope: string, channel: AlertChannel) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chCooldownKey(scope, channel), String(Date.now()));
  } catch {
    /* noop */
  }
}

export function planChannelDispatch(
  ev: AlertEval,
  rule: AlertRule,
  opts: {
    cooldownLookup?: (scope: string, channel: AlertChannel) => number;
    now?: number;
  } = {},
): ChannelDecision[] {
  const now = opts.now ?? Date.now();
  const lookup = opts.cooldownLookup ?? readChannelCooldown;
  const scope = ruleScope(rule);
  const enoughImpr = ev.impressions >= rule.minSamples;
  const enoughClicks = ev.clicks >= rule.minSamples;
  return ALERT_CHANNELS.map<ChannelDecision>((channel) => {
    const c = rule.channels?.[channel];
    const enabled = c?.enabled ?? true;
    const effMinCtr = c?.minCtr ?? rule.minCtr;
    const effMinSendRate = c?.minSendRate ?? rule.minSendRate;
    const cooldownMs = (c?.cooldownMinutes ?? 60) * 60_000;
    if (!enabled) {
      return { channel, enabled, willFire: false, ctrBelow: false, sendBelow: false,
        effectiveMinCtr: effMinCtr, effectiveMinSendRate: effMinSendRate,
        cooldownMs, reason: "disabled" };
    }
    const ctrBelow = effMinCtr > 0 && enoughImpr && ev.ctr < effMinCtr;
    const sendBelow = effMinSendRate > 0 && enoughClicks && ev.sendRate < effMinSendRate;
    if (!ctrBelow && !sendBelow) {
      const reason = !enoughImpr && !enoughClicks ? "below_samples" : "thresholds_ok";
      return { channel, enabled, willFire: false, ctrBelow, sendBelow,
        effectiveMinCtr: effMinCtr, effectiveMinSendRate: effMinSendRate, cooldownMs, reason };
    }
    const last = lookup(scope, channel);
    if (last && now - last < cooldownMs) {
      return { channel, enabled, willFire: false, ctrBelow, sendBelow,
        effectiveMinCtr: effMinCtr, effectiveMinSendRate: effMinSendRate,
        cooldownMs, reason: "cooldown", cooldownUntil: last + cooldownMs };
    }
    return { channel, enabled, willFire: true, ctrBelow, sendBelow,
      effectiveMinCtr: effMinCtr, effectiveMinSendRate: effMinSendRate, cooldownMs };
  });
}

// ============ Simulação histórica de regras ============
export interface SimulationDispatch {
  ts: number;
  ruleId: string;
  ruleLabel?: string;
  scope: string;
  channel: AlertChannel;
  status: "fired" | "suppressed_cooldown" | "suppressed_thresholds" | "below_samples" | "disabled";
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  effectiveMinCtr: number;
  effectiveMinSendRate: number;
  reason?: string;
}

/** Replay das regras atuais sobre os últimos `days` dias do histórico. */
export function simulateAlertRules(
  events: BufferedEvent[],
  rules: AlertRule[],
  days: number,
  opts: { stepMinutes?: number; now?: number; includeNonFiring?: boolean } = {},
): SimulationDispatch[] {
  const step = Math.max(1, opts.stepMinutes ?? 60) * 60_000;
  const now = opts.now ?? Date.now();
  const from = now - days * 24 * 3_600_000;
  const out: SimulationDispatch[] = [];
  const lastBy = new Map<string, number>();
  const lookup = (scope: string, channel: AlertChannel) =>
    lastBy.get(`${scope}|${channel}`) ?? 0;
  const active = rules.filter((r) => r.enabled !== false);
  if (active.length === 0) return out;
  for (let t = from; t <= now; t += step) {
    for (const rule of active) {
      const since = t - rule.windowHours * 3_600_000;
      const scoped = events.filter(
        (e) => e.ts >= since && e.ts <= t &&
               (!rule.route || e.path === rule.route) &&
               (!rule.variant || (e.variant ?? "control") === rule.variant),
      );
      const impressions = scoped.filter((r) => r.event === "whatsapp_cta_impression").length;
      const clicks = scoped.filter((r) =>
        ["whatsapp_cta_click", "whatsapp_fab_click", "whatsapp_notice_click"].includes(r.event),
      ).length;
      const sends = scoped.filter(
        (r) => r.event === "whatsapp_form_submit" || r.event === "whatsapp_cta_sent",
      ).length;
      const ctr = impressions ? (clicks / impressions) * 100 : 0;
      const sendRate = clicks ? (sends / clicks) * 100 : 0;
      const ev: AlertEval = {
        ctr, sendRate, impressions, clicks, sends,
        ctrBelow: rule.minCtr > 0 && impressions >= rule.minSamples && ctr < rule.minCtr,
        sendBelow: rule.minSendRate > 0 && clicks >= rule.minSamples && sendRate < rule.minSendRate,
        triggered: false,
      };
      ev.triggered = ev.ctrBelow || ev.sendBelow;
      const scope = ruleScope(rule);
      const decisions = planChannelDispatch(ev, rule, { cooldownLookup: lookup, now: t });
      for (const d of decisions) {
        const status: SimulationDispatch["status"] = d.willFire
          ? "fired"
          : d.reason === "cooldown" ? "suppressed_cooldown"
          : d.reason === "disabled" ? "disabled"
          : d.reason === "below_samples" ? "below_samples"
          : "suppressed_thresholds";
        const emit = d.willFire || (opts.includeNonFiring && ev.triggered);
        if (d.willFire) lastBy.set(`${scope}|${d.channel}`, t);
        if (emit) {
          out.push({
            ts: t, ruleId: rule.id, ruleLabel: rule.label, scope,
            channel: d.channel, status,
            ctr, sendRate, impressions, clicks, sends,
            ctrBelow: ev.ctrBelow, sendBelow: ev.sendBelow,
            effectiveMinCtr: d.effectiveMinCtr,
            effectiveMinSendRate: d.effectiveMinSendRate,
            reason: d.reason,
          });
        }
      }
    }
  }
  return out;
}

// ============ Resumo diário multi-data (CSV) ============
export interface DailySummaryRangeRow {
  date: string;
  ctaHash: string;
  impressions: number;
  clicks: number;
  sends: number;
  ctr: number;
  sendRate: number;
  alertsFired: number;
}

export function buildDailySummaryRange(
  events: BufferedEvent[],
  history: AlertHistoryEntry[],
  fromDate: Date,
  toDate: Date,
  ruleFilter?: string,
): DailySummaryRangeRow[] {
  const rows: DailySummaryRangeRow[] = [];
  const start = new Date(fromDate); start.setHours(0, 0, 0, 0);
  const end = new Date(toDate); end.setHours(23, 59, 59, 999);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const summary = buildDailySummary(events, history, new Date(d));
    const dayHistory = history.filter((h) => {
      const hd = new Date(h.ts); hd.setHours(0, 0, 0, 0);
      return ymd(hd) === summary.date && (!ruleFilter || h.ruleId === ruleFilter);
    });
    if (summary.rows.length === 0) {
      rows.push({
        date: summary.date, ctaHash: "—",
        impressions: 0, clicks: 0, sends: 0, ctr: 0, sendRate: 0,
        alertsFired: dayHistory.filter((h) => h.scope !== "daily_summary").length,
      });
      continue;
    }
    for (const row of summary.rows) {
      rows.push({
        date: summary.date,
        ctaHash: row.ctaHash,
        impressions: row.impressions,
        clicks: row.clicks,
        sends: row.sends,
        ctr: row.ctr,
        sendRate: row.sendRate,
        alertsFired: dayHistory.filter(
          (h) => (h.ctaHash ?? "—") === row.ctaHash && h.scope !== "daily_summary",
        ).length,
      });
    }
  }
  return rows;
}

// ============ Resumo diário por CTA hash ============
const DAILY_SUMMARY_KEY = "wa_official_daily_summary_v1"; // "YYYY-MM-DD" last sent

export interface DailySummaryRow {
  ctaHash: string;
  impressions: number;
  clicks: number;
  sends: number;
  ctr: number;
  sendRate: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  rows: DailySummaryRow[];
  totals: { impressions: number; clicks: number; sends: number; ctr: number; sendRate: number };
  alertsFired: number;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildDailySummary(
  events: BufferedEvent[],
  history: AlertHistoryEntry[],
  date = new Date(),
): DailySummary {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  const inDay = (ts: number) => ts >= dayStart.getTime() && ts <= dayEnd.getTime();
  const win = events.filter((e) => inDay(e.ts));
  const byHash = new Map<string, { impressions: number; clicks: number; sends: number }>();
  let ti = 0, tc = 0, ts = 0;
  for (const r of win) {
    const k = r.ctaHash || "—";
    const cur = byHash.get(k) ?? { impressions: 0, clicks: 0, sends: 0 };
    if (r.event === "whatsapp_cta_impression") { cur.impressions++; ti++; }
    else if (r.event === "whatsapp_form_submit" || r.event === "whatsapp_cta_sent") { cur.sends++; ts++; }
    else if (
      r.event === "whatsapp_cta_click" || r.event === "whatsapp_fab_click" || r.event === "whatsapp_notice_click"
    ) { cur.clicks++; tc++; }
    byHash.set(k, cur);
  }
  const rows: DailySummaryRow[] = Array.from(byHash.entries()).map(([ctaHash, v]) => ({
    ctaHash,
    ...v,
    ctr: v.impressions ? (v.clicks / v.impressions) * 100 : 0,
    sendRate: v.clicks ? (v.sends / v.clicks) * 100 : 0,
  })).sort((a, b) => b.clicks + b.sends - (a.clicks + a.sends));
  const alertsFired = history.filter((h) => inDay(h.ts) && h.scope !== "daily_summary").length;
  return {
    date: ymd(date),
    rows,
    totals: {
      impressions: ti, clicks: tc, sends: ts,
      ctr: ti ? (tc / ti) * 100 : 0,
      sendRate: tc ? (ts / tc) * 100 : 0,
    },
    alertsFired,
  };
}

export function renderDailySummary(s: DailySummary): { title: string; body: string } {
  const title = `📊 Resumo diário — WhatsApp Oficial (${s.date})`;
  const head = `Totais: ${s.totals.impressions} impr · ${s.totals.clicks} cliques · ${s.totals.sends} envios — CTR ${s.totals.ctr.toFixed(1)}% · envio ${s.totals.sendRate.toFixed(1)}%\nAlertas disparados no dia: ${s.alertsFired}\n`;
  const tbl = s.rows.length
    ? "\nPor CTA hash:\n" + s.rows.map((r) =>
        ` • ${r.ctaHash}: ${r.impressions} impr / ${r.clicks} cliq / ${r.sends} env — CTR ${r.ctr.toFixed(1)}% · envio ${r.sendRate.toFixed(1)}%`,
      ).join("\n")
    : "\nSem cliques registrados no dia.";
  return { title, body: head + tbl };
}

/** Verifica se o resumo de hoje já foi enviado (respeita cooldown diário). */
export function dailySummaryAlreadySent(date = new Date()): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DAILY_SUMMARY_KEY) === ymd(date);
  } catch {
    return true;
  }
}

export function markDailySummarySent(date = new Date()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DAILY_SUMMARY_KEY, ymd(date));
  } catch {
    /* noop */
  }
}


/**
 * Bloqueia mensagens que tentem desviar a conversa para canais não oficiais.
 * Retorna `null` se ok, ou uma string com o motivo da rejeição.
 */
export function validateOfficialChannelMessage(text: string): string | null {
  const lower = text.toLowerCase();

  // 1) telefones alternativos
  const phoneMatches = lower.match(/(?:\+?\d[\s\-().]*){10,}/g) ?? [];
  const hasForeignPhone = phoneMatches.some((m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 10 && !digits.endsWith("993075000");
  });
  if (hasForeignPhone) {
    return "Identificamos outro número de telefone na mensagem. Use somente o WhatsApp oficial (21) 99307-5000.";
  }

  // 2) e-mails de domínios não oficiais
  const emailMatches = lower.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
  const hasForeignEmail = emailMatches.some(
    (e) => !e.endsWith(`@${OFFICIAL_EMAIL_DOMAIN}`),
  );
  if (hasForeignEmail) {
    return "Identificamos um e-mail de terceiros na mensagem. Comunique-se apenas pelo WhatsApp oficial (21) 99307-5000 ou pelo domínio @impulsionando.com.br.";
  }

  // 3) redes sociais e mensageiros alternativos
  const forbidden = [
    "t.me/", "telegram", "instagram.com/", "facebook.com/", "fb.me/",
    "tiktok.com/", "discord.gg/", "skype:", "viber", "signal.me",
    "linkedin.com/in/", "twitter.com/", "x.com/",
  ];
  if (forbidden.some((p) => lower.includes(p))) {
    return "Removemos canais alternativos por segurança. Use somente o WhatsApp oficial (21) 99307-5000.";
  }

  // 4) menções a outro número de WhatsApp
  const hasForeignWhatsapp =
    (lower.includes("wa.me/") || lower.includes("whatsapp")) &&
    !lower.includes(OFFICIAL_WHATSAPP_DIGITS) &&
    !lower.includes("99307-5000") &&
    !lower.includes("993075000");
  if (hasForeignWhatsapp) {
    return "Para sua segurança, o único WhatsApp aceito é o (21) 99307-5000.";
  }

  return null;
}

/**
 * Instala um listener global delegado que registra TODO clique em qualquer
 * link/elemento apontando para o WhatsApp oficial.
 */
export function installGlobalWhatsAppClickTracking() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __waOfficialTrackingInstalled?: boolean };
  if (w.__waOfficialTrackingInstalled) return;
  w.__waOfficialTrackingInstalled = true;

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest<HTMLAnchorElement>(
        `a[href*="${OFFICIAL_WHATSAPP_DIGITS}"], a[href*="993075000"]`,
      );
      if (!anchor) return;
      const cta = anchor.dataset.cta || "anchor";
      const variant = anchor.dataset.variant;
      const campaign = anchor.dataset.campaign;
      const ctaText = anchor.dataset.ctaText || (anchor.textContent || "").trim().slice(0, 120);
      trackWhatsAppCTA("whatsapp_cta_click", {
        origin: cta,
        variant,
        campaign,
        ctaText,
        path: window.location.pathname,
        href: anchor.href,
      });
    },
    { capture: true },
  );
}

// ============ Template de mensagem para alertas ============
const ALERT_TEMPLATE_KEY = "wa_official_alert_template_v1";

export interface AlertTemplate {
  title: string;
  body: string;
}

export const DEFAULT_ALERT_TEMPLATE: AlertTemplate = {
  title: "⚠️ WhatsApp Oficial — performance abaixo do limite",
  body:
    "Motivo: {reason}\n" +
    "Janela: {windowHours}h\n" +
    "CTR: {ctr}% (mínimo {minCtr}%)\n" +
    "Taxa de envio: {sendRate}% (mínimo {minSendRate}%)\n" +
    "Volume: {impressions} impr · {clicks} cliques · {sends} envios\n" +
    "CTA hash: {ctaHash}\n" +
    "Rota: {path}",
};

export function readAlertTemplate(): AlertTemplate {
  if (typeof window === "undefined") return DEFAULT_ALERT_TEMPLATE;
  try {
    const raw = window.localStorage.getItem(ALERT_TEMPLATE_KEY);
    return raw ? { ...DEFAULT_ALERT_TEMPLATE, ...JSON.parse(raw) } : DEFAULT_ALERT_TEMPLATE;
  } catch {
    return DEFAULT_ALERT_TEMPLATE;
  }
}

export function saveAlertTemplate(tpl: AlertTemplate) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ALERT_TEMPLATE_KEY, JSON.stringify(tpl));
  } catch {
    /* noop */
  }
}

export interface AlertTemplateVars {
  ctr: number;
  sendRate: number;
  impressions: number;
  clicks: number;
  sends: number;
  minCtr: number;
  minSendRate: number;
  windowHours: number;
  ctrBelow: boolean;
  sendBelow: boolean;
  ctaHash?: string;
  origin?: string;
  path?: string;
}

export function renderAlertTemplate(
  tpl: AlertTemplate,
  v: AlertTemplateVars,
): AlertTemplate {
  const reasons: string[] = [];
  if (v.ctrBelow) reasons.push(`CTR ${v.ctr.toFixed(1)}% < ${v.minCtr}%`);
  if (v.sendBelow) reasons.push(`Envio ${v.sendRate.toFixed(1)}% < ${v.minSendRate}%`);
  const dict: Record<string, string> = {
    ctr: v.ctr.toFixed(1),
    sendRate: v.sendRate.toFixed(1),
    impressions: String(v.impressions),
    clicks: String(v.clicks),
    sends: String(v.sends),
    minCtr: String(v.minCtr),
    minSendRate: String(v.minSendRate),
    windowHours: String(v.windowHours),
    ctaHash: v.ctaHash ?? "—",
    origin: v.origin ?? "—",
    path: v.path ?? "—",
    reason: reasons.join(" | ") || "—",
  };
  const apply = (s: string) =>
    s.replace(/\{(\w+)\}/g, (_, k: string) => (k in dict ? dict[k] : `{${k}}`));
  return { title: apply(tpl.title), body: apply(tpl.body) };
}
