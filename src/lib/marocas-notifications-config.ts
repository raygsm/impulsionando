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
export type NotifyConfig = Record<string, NotifyTypeConfig>;

const STORAGE_KEY = "marocas.notify.config.v1";

export function defaultNotifyConfig(): NotifyConfig {
  const cfg: NotifyConfig = {};
  for (const k of Object.keys(MAROCAS_SLA_MINUTES)) {
    cfg[k] = { enabled: true, warningPct: 80, lateOffsetMin: 0, channels: ["cockpit"] };
  }
  return cfg;
}

export function loadNotifyConfig(): NotifyConfig {
  if (typeof window === "undefined") return defaultNotifyConfig();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotifyConfig();
    const parsed = JSON.parse(raw) as Partial<NotifyConfig>;
    return { ...defaultNotifyConfig(), ...parsed };
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
  const c = cfg[serviceType] ?? defaultNotifyConfig()[serviceType];
  if (!c?.enabled) return null;
  if (late) return "late";
  if (pct >= c.warningPct) return "warning";
  return null;
}
