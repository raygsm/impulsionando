// Carrinho Marocas — estado local (localStorage) 100% frontend.
// Preparado para futura substituição por createServerFn/RLS por sessão/CPF.
// Reutilizável por qualquer tenant do nicho food service.
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "marocas.cart.v1";

export interface CartLine {
  id: string;              // hash único da linha (item + adicionais)
  slug: string;
  nome: string;
  precoUnit: number;
  qtd: number;
  adicionais: { nome: string; preco: number }[];
  observacao?: string;
}

export interface CartState {
  linhas: CartLine[];
  modo: "delivery" | "retirada" | "salao";
  mesa?: string;
  pulseira?: string;       // preparado para módulo de comandas por pulseira numerada
  cupom?: string;
}

const initial: CartState = { linhas: [], modo: "delivery" };

function read(): CartState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

function write(s: CartState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("marocas:cart"));
}

export function useMarocasCart() {
  const [state, setState] = useState<CartState>(initial);

  useEffect(() => {
    setState(read());
    const sync = () => setState(read());
    window.addEventListener("marocas:cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("marocas:cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((updater: (s: CartState) => CartState) => {
    setState((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (line: Omit<CartLine, "id">) => {
      const id =
        line.slug +
        "::" +
        line.adicionais.map((a) => a.nome).sort().join("|") +
        "::" +
        (line.observacao || "");
      persist((s) => {
        const existing = s.linhas.find((l) => l.id === id);
        if (existing) {
          return {
            ...s,
            linhas: s.linhas.map((l) =>
              l.id === id ? { ...l, qtd: l.qtd + line.qtd } : l,
            ),
          };
        }
        return { ...s, linhas: [...s.linhas, { ...line, id }] };
      });
    },
    [persist],
  );

  const remove = useCallback((id: string) => persist((s) => ({ ...s, linhas: s.linhas.filter((l) => l.id !== id) })), [persist]);
  const setQtd = useCallback(
    (id: string, qtd: number) =>
      persist((s) => ({
        ...s,
        linhas: qtd <= 0 ? s.linhas.filter((l) => l.id !== id) : s.linhas.map((l) => (l.id === id ? { ...l, qtd } : l)),
      })),
    [persist],
  );
  const setModo = useCallback((modo: CartState["modo"], extras?: { mesa?: string; pulseira?: string }) =>
    persist((s) => ({ ...s, modo, mesa: extras?.mesa ?? s.mesa, pulseira: extras?.pulseira ?? s.pulseira })), [persist]);
  const clear = useCallback(() => persist(() => initial), [persist]);

  const subtotal = state.linhas.reduce((acc, l) => acc + (l.precoUnit + l.adicionais.reduce((a, x) => a + x.preco, 0)) * l.qtd, 0);
  const totalItens = state.linhas.reduce((acc, l) => acc + l.qtd, 0);

  return { state, add, remove, setQtd, setModo, clear, subtotal, totalItens };
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
