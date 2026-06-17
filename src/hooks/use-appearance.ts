import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

const THEME_KEY = "impulsionando.theme.v1";
const DENSITY_KEY = "impulsionando.density.v1";
const EVENT = "appearance:changed";

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_KEY) as Theme | null;
  return v ?? "system";
}

function readDensity(): Density {
  if (typeof window === "undefined") return "comfortable";
  const v = localStorage.getItem(DENSITY_KEY) as Density | null;
  return v ?? "comfortable";
}

export function applyAppearance(theme: Theme, density: Density) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark());
  root.classList.toggle("dark", isDark);
  root.dataset.density = density;
}

export function useAppearance() {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [density, setDensityState] = useState<Density>(readDensity);

  useEffect(() => {
    applyAppearance(theme, density);
  }, [theme, density]);

  useEffect(() => {
    function onChange() {
      setThemeState(readTheme());
      setDensityState(readDensity());
    }
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => applyAppearance(readTheme(), readDensity());
    mq.addEventListener?.("change", onMq);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
      mq.removeEventListener?.("change", onMq);
    };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  const setDensity = useCallback((d: Density) => {
    localStorage.setItem(DENSITY_KEY, d);
    setDensityState(d);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { theme, density, setTheme, setDensity };
}
