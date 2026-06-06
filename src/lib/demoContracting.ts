/**
 * Contratação simulada de módulos no ambiente DEMO.
 *
 * Persiste apenas no localStorage do navegador do lead — nunca toca banco.
 * Permite que a demonstração se comporte como o ambiente real:
 *  - antes de "contratar", o módulo aparece como vitrine (não-contratado)
 *  - depois de "Contratar Módulo X", o módulo libera os recursos demo
 *
 * Toda a operação é client-side e reversível pelo botão "Zerar dados" do DEMO.
 */

const STORAGE_KEY = "imp.demo.contracted.modules";

function read(): Set<string> {
  try {
    if (typeof window === "undefined") return new Set();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    // Dispara um evento próprio para que componentes na mesma aba reajam.
    window.dispatchEvent(new CustomEvent("imp:demo-contracts-changed"));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function getDemoContracted(): string[] {
  return Array.from(read());
}

export function isDemoContracted(slug: string): boolean {
  return read().has(slug);
}

export function contractDemoModule(slug: string) {
  const s = read();
  if (s.has(slug)) return;
  s.add(slug);
  write(s);
}

export function uncontractDemoModule(slug: string) {
  const s = read();
  if (!s.has(slug)) return;
  s.delete(slug);
  write(s);
}

export function resetDemoContracts() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("imp:demo-contracts-changed"));
  } catch {
    /* ignore */
  }
}

/** Hook React mínimo, sem dependências, para reagir a mudanças. */
import { useEffect, useState } from "react";

export function useDemoContracted(): {
  contracted: Set<string>;
  isContracted: (slug: string) => boolean;
  contract: (slug: string) => void;
  uncontract: (slug: string) => void;
  reset: () => void;
} {
  const [contracted, setContracted] = useState<Set<string>>(() => read());

  useEffect(() => {
    const sync = () => setContracted(read());
    window.addEventListener("imp:demo-contracts-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("imp:demo-contracts-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    contracted,
    isContracted: (slug) => contracted.has(slug),
    contract: contractDemoModule,
    uncontract: uncontractDemoModule,
    reset: resetDemoContracts,
  };
}
