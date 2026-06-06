/**
 * Contratação simulada de módulos no ambiente DEMO.
 *
 * Persiste apenas no localStorage do navegador do lead — nunca toca banco.
 * Estende a estrutura antiga (Set<slug>) com um registro por módulo contendo
 * contrato fictício, pagamento PAGO — DEMO e timestamps.
 *
 * Mantém a API original (`isDemoContracted`, `contractDemoModule`, etc.)
 * para não quebrar páginas que já usam o módulo.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "imp.demo.contracted.modules.v2";
const LEGACY_KEY = "imp.demo.contracted.modules";
const EVT = "imp:demo-contracts-changed";

export type DemoPaymentMethod = "pix" | "cartao" | "boleto";

export type DemoModuleRecord = {
  slug: string;
  status: "paid_demo"; // único status final na demo
  is_demo: true;
  demo_paid: true;
  payment_status: "paid_demo";
  contract_status: "demo_active";
  module_status: "demo_enabled";
  payment_method: DemoPaymentMethod;
  amount_reference: number; // valor de referência fictício R$
  paid_at: string; // ISO
  contract_accepted_at: string; // ISO
};

type Store = Record<string, DemoModuleRecord>;

function read(): Store {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Store;
    }
    // Migração leve do formato antigo (Set<slug>) — converte para registros simples PAGO — DEMO.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const arr = JSON.parse(legacy);
      if (Array.isArray(arr)) {
        const now = new Date().toISOString();
        const store: Store = {};
        for (const slug of arr) {
          if (typeof slug !== "string") continue;
          store[slug] = {
            slug,
            status: "paid_demo",
            is_demo: true,
            demo_paid: true,
            payment_status: "paid_demo",
            contract_status: "demo_active",
            module_status: "demo_enabled",
            payment_method: "pix",
            amount_reference: 0,
            paid_at: now,
            contract_accepted_at: now,
          };
        }
        write(store);
        return store;
      }
    }
    return {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
}

export function getDemoContracted(): string[] {
  return Object.keys(read());
}

export function getDemoRecord(slug: string): DemoModuleRecord | undefined {
  return read()[slug];
}

export function isDemoContracted(slug: string): boolean {
  return Boolean(read()[slug]);
}

/**
 * Compatibilidade com o fluxo antigo: marca módulo como PAGO — DEMO via Pix
 * sem passar pelo fluxo de contrato. Mantém o comportamento das telas legadas.
 */
export function contractDemoModule(
  slug: string,
  opts?: { paymentMethod?: DemoPaymentMethod; amountReference?: number }
) {
  const store = read();
  if (store[slug]) return;
  const now = new Date().toISOString();
  store[slug] = {
    slug,
    status: "paid_demo",
    is_demo: true,
    demo_paid: true,
    payment_status: "paid_demo",
    contract_status: "demo_active",
    module_status: "demo_enabled",
    payment_method: opts?.paymentMethod ?? "pix",
    amount_reference: opts?.amountReference ?? 0,
    paid_at: now,
    contract_accepted_at: now,
  };
  write(store);
}

export function uncontractDemoModule(slug: string) {
  const store = read();
  if (!store[slug]) return;
  delete store[slug];
  write(store);
}

export function resetDemoContracts() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* ignore */
  }
}

/** Hook React: contratos + registros + helpers. */
export function useDemoContracted(): {
  contracted: Set<string>;
  records: Store;
  isContracted: (slug: string) => boolean;
  getRecord: (slug: string) => DemoModuleRecord | undefined;
  contract: (slug: string, opts?: { paymentMethod?: DemoPaymentMethod; amountReference?: number }) => void;
  uncontract: (slug: string) => void;
  reset: () => void;
} {
  const [store, setStore] = useState<Store>(() => read());

  useEffect(() => {
    const sync = () => setStore(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    contracted: new Set(Object.keys(store)),
    records: store,
    isContracted: (slug) => Boolean(store[slug]),
    getRecord: (slug) => store[slug],
    contract: (slug, opts) => contractDemoModule(slug, opts),
    uncontract: uncontractDemoModule,
    reset: resetDemoContracts,
  };
}
