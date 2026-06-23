/**
 * useCheckoutCart — carrinho persistente (sessionStorage) que carrega o
 * contexto da contratação entre /planos → /checkout/$plano (Mercado Pago)
 * e também do simulador de demonstração para a contratação real.
 *
 * Estrutura mínima para o checkout via Mercado Pago (Pix/cartão/boleto):
 *  - planCode  → "essencial" | "integrado" | "avancado"
 *  - billing   → "monthly" | "annual"
 *  - modules   → slugs escolhidos (incluídos + extras além da quota)
 *  - setupCents / monthlyCents / extrasMonthlyCents → preços já calculados
 *
 * O carrinho é fonte da verdade para a tela /checkout/$plano apresentar
 * o resumo "Setup + 1ª mensalidade + recorrência" e os módulos contratados.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "impulsionando:checkout-cart:v1";

export type CheckoutBilling = "monthly" | "annual";

export type CheckoutCart = {
  planCode: "essencial" | "integrado" | "avancado";
  planName: string;
  billing: CheckoutBilling;
  modulesIncluded: string[];
  modulesExtra: string[];
  setupCents: number;
  monthlyCents: number; // mensalidade já com desconto anual quando billing === "annual"
  extrasMonthlyCents: number;
  origin: "planos" | "simulador" | "demo" | "outro";
  nicho?: string;
  createdAt: string;
};

export const PLAN_NAME_TO_CODE: Record<string, CheckoutCart["planCode"]> = {
  Essencial: "essencial",
  Integrado: "integrado",
  Avançado: "avancado",
};

function safeRead(): CheckoutCart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutCart;
  } catch {
    return null;
  }
}

export function saveCheckoutCart(
  cart: Omit<CheckoutCart, "createdAt"> & { createdAt?: string },
): CheckoutCart {
  const full: CheckoutCart = { ...cart, createdAt: cart.createdAt ?? new Date().toISOString() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    /* ignore */
  }
  return full;
}

export function clearCheckoutCart() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readCheckoutCart(planCode?: CheckoutCart["planCode"]): CheckoutCart | null {
  const c = safeRead();
  if (!c) return null;
  if (planCode && c.planCode !== planCode) return null;
  return c;
}

export function useCheckoutCart() {
  const [cart, setCart] = useState<CheckoutCart | null>(null);

  useEffect(() => {
    setCart(safeRead());
  }, []);

  const set = useCallback((next: Parameters<typeof saveCheckoutCart>[0]) => {
    setCart(saveCheckoutCart(next));
  }, []);

  const clear = useCallback(() => {
    clearCheckoutCart();
    setCart(null);
  }, []);

  return { cart, set, clear };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Resumo financeiro padrão exibido em qualquer tela de checkout. */
export function summarizeCart(cart: CheckoutCart) {
  const cycleMonths = cart.billing === "annual" ? 12 : 3;
  const recurringMonthlyCents = cart.monthlyCents + cart.extrasMonthlyCents;
  const firstChargeCents = cart.setupCents + recurringMonthlyCents;
  const cycleTotalCents = cart.setupCents + recurringMonthlyCents * cycleMonths;
  return {
    cycleMonths,
    recurringMonthlyCents,
    firstChargeCents,
    cycleTotalCents,
  };
}
