// Configuração local de notificações SLA — por tipo de serviço.
// Armazenado em localStorage para que o usuário ajuste sem deploy.

import { MAROCAS_SLA_MINUTES } from "@/lib/marocas.functions";

export type NotifyChannel = "cockpit" | "whatsapp" | "email";
export type NotifyTypeConfig = {
  enabled: boolean;
  warningPct: number; // 0–100, dispara quando elapsed atinge X% do SLA
  lateOffsetMin: number; // minutos depois do SLA para soar "atrasado" (geralmente 0)
  channels: NotifyChannel[];
};
export type ReportSchedule = { enabled: boolean; channels: NotifyChannel[]; hour: number; weekday?: number };
export type NotifyConfig = {
  types: Record<string, NotifyTypeConfig>;
  reports: { daily: ReportSchedule; weekly: ReportSchedule };
};

const STORAGE_KEY = "marocas.notify.config.v1";

export function defaultNotifyConfig(): NotifyConfig {
  const types: Record<string, NotifyTypeConfig> = {};
  for (const k of Object.keys(MAROCAS_SLA_MINUTES)) {
    types[k] = { enabled: true, warningPct: 80, lateOffsetMin: 0, channels: ["cockpit"] };
  }
  return {
    types,
    reports: {
      daily: { enabled: false, channels: ["cockpit"], hour: 8 },
      weekly: { enabled: false, channels: ["cockpit"], hour: 8, weekday: 1 },
    },
  };
}

export function loadNotifyConfig(): NotifyConfig {
  if (typeof window === "undefined") return defaultNotifyConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotifyConfig();
    const parsed = JSON.parse(raw) as Partial<NotifyConfig>;
    const base = defaultNotifyConfig();
    const types = { ...base.types, ...(parsed.types ?? {}) };
    const reports = {
      daily: { ...base.reports.daily, ...(parsed.reports?.daily ?? {}) },
      weekly: { ...base.reports.weekly, ...(parsed.reports?.weekly ?? {}) },
    };
    return { types, reports };
  } catch {
    return defaultNotifyConfig();
  }
}

export function saveNotifyConfig(cfg: NotifyConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function shouldNotify(
  cfg: NotifyConfig,
  serviceType: string,
  pct: number,
  late: boolean,
): "warning" | "late" | null {
  const c = cfg.types[serviceType] ?? defaultNotifyConfig().types[serviceType];
  if (!c?.enabled) return null;
  if (late) return "late";
  if (pct >= c.warningPct) return "warning";
  return null;
}
