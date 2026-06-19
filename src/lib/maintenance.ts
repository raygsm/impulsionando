export const MAINTENANCE_KEY = "impulsionando:maintenance_mode";

export function isMaintenanceOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MAINTENANCE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMaintenance(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(MAINTENANCE_KEY, "1");
    else window.localStorage.removeItem(MAINTENANCE_KEY);
    window.dispatchEvent(new CustomEvent("maintenance:changed", { detail: { on } }));
  } catch {
    // ignore
  }
}
