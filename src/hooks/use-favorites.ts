import { useCallback, useEffect, useState } from "react";

export interface FavoritePage {
  to: string;
  label: string;
  addedAt: string;
}

const KEY = "impulsionando.favorites.v1";

function read(): FavoritePage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FavoritePage[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: FavoritePage[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("favorites:changed"));
}

export function useFavorites() {
  const [list, setList] = useState<FavoritePage[]>(() => read());

  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("favorites:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("favorites:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFavorite = useCallback((to: string) => list.some((f) => f.to === to), [list]);

  const toggle = useCallback((to: string, label: string) => {
    const cur = read();
    const exists = cur.some((f) => f.to === to);
    const next = exists
      ? cur.filter((f) => f.to !== to)
      : [...cur, { to, label, addedAt: new Date().toISOString() }];
    write(next);
  }, []);

  const remove = useCallback((to: string) => {
    write(read().filter((f) => f.to !== to));
  }, []);

  return { favorites: list, isFavorite, toggle, remove };
}
