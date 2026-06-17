import { useEffect, useState } from "react";

export interface RecentPage {
  to: string;
  label: string;
  visitedAt: string;
}

const KEY = "impulsionando.recent.v1";
const MAX = 12;

function read(): RecentPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as RecentPage[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: RecentPage[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("recent:changed"));
}

export function pushRecent(to: string, label: string) {
  if (typeof window === "undefined") return;
  const cur = read().filter((p) => p.to !== to);
  const next = [{ to, label, visitedAt: new Date().toISOString() }, ...cur].slice(0, MAX);
  write(next);
}

export function useRecentPages() {
  const [list, setList] = useState<RecentPage[]>(() => read());
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("recent:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("recent:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}
