import { useCallback, useEffect, useState } from "react";

export type WidgetId =
  | "stat-companies"
  | "stat-units"
  | "stat-users"
  | "stat-niches"
  | "stat-modules"
  | "stat-audit"
  | "panel-audit"
  | "panel-favorites"
  | "panel-recents";

export const WIDGET_CATALOG: { id: WidgetId; label: string; group: "KPIs" | "Painéis" }[] = [
  { id: "stat-companies", label: "Empresas", group: "KPIs" },
  { id: "stat-units", label: "Unidades", group: "KPIs" },
  { id: "stat-users", label: "Usuários ativos", group: "KPIs" },
  { id: "stat-niches", label: "Nichos", group: "KPIs" },
  { id: "stat-modules", label: "Módulos", group: "KPIs" },
  { id: "stat-audit", label: "Eventos de auditoria", group: "KPIs" },
  { id: "panel-audit", label: "Auditoria recente", group: "Painéis" },
  { id: "panel-favorites", label: "Favoritos", group: "Painéis" },
  { id: "panel-recents", label: "Acessadas recentemente", group: "Painéis" },
];

const KEY = "impulsionando.dashboard.widgets.v1";
const EVENT = "dashboard-widgets:changed";
const DEFAULT_ENABLED: WidgetId[] = [
  "stat-companies", "stat-units", "stat-users", "stat-niches", "stat-modules", "stat-audit",
  "panel-audit", "panel-favorites", "panel-recents",
];

function read(): WidgetId[] {
  if (typeof window === "undefined") return DEFAULT_ENABLED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_ENABLED;
    const parsed = JSON.parse(raw) as WidgetId[];
    return Array.isArray(parsed) ? parsed : DEFAULT_ENABLED;
  } catch {
    return DEFAULT_ENABLED;
  }
}

export function useDashboardWidgets() {
  const [enabled, setEnabled] = useState<WidgetId[]>(read);

  useEffect(() => {
    function onChange() { setEnabled(read()); }
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isEnabled = useCallback((id: WidgetId) => enabled.includes(id), [enabled]);

  const toggle = useCallback((id: WidgetId) => {
    const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
    localStorage.setItem(KEY, JSON.stringify(next));
    setEnabled(next);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, [enabled]);

  const reset = useCallback(() => {
    localStorage.setItem(KEY, JSON.stringify(DEFAULT_ENABLED));
    setEnabled(DEFAULT_ENABLED);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { enabled, isEnabled, toggle, reset };
}
