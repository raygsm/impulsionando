/**
 * useDemoCart — carrinho local (somente localStorage) para a demo Bar & Restaurante.
 * Nenhum dado vai ao backend além de telemetria agregada via recordDemoEvent.
 */
import { useCallback, useEffect, useState } from "react";

export type DemoCartItem = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  qty: number;
};

const keyFor = (tenant: string) => `demo-resto-cart:${tenant}`;

function safeRead(tenant: string): DemoCartItem[] {
  try {
    const raw = localStorage.getItem(keyFor(tenant));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useDemoCart(tenant: string) {
  const [items, setItems] = useState<DemoCartItem[]>([]);

  useEffect(() => {
    setItems(safeRead(tenant));
  }, [tenant]);

  const persist = useCallback(
    (next: DemoCartItem[]) => {
      setItems(next);
      try {
        localStorage.setItem(keyFor(tenant), JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [tenant],
  );

  const add = useCallback(
    (item: Omit<DemoCartItem, "qty">, qty = 1) => {
      const current = safeRead(tenant);
      const idx = current.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], qty: current[idx].qty + qty };
      } else {
        current.push({ ...item, qty });
      }
      persist([...current]);
    },
    [tenant, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(safeRead(tenant).filter((c) => c.id !== id));
    },
    [tenant, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const totalCents = items.reduce((acc, i) => acc + i.priceCents * i.qty, 0);
  const count = items.reduce((acc, i) => acc + i.qty, 0);

  return { items, add, remove, clear, totalCents, count };
}

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
