import { useEffect, useState, useCallback } from "react";

const KEY = "imp.impersonate";

export interface ImpersonationState {
  companyId: string;
  companyName: string;
}

function read(): ImpersonationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImpersonationState;
    if (!parsed?.companyId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useImpersonation() {
  const [state, setState] = useState<ImpersonationState | null>(() => read());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEY) setState(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const startImpersonation = useCallback((s: ImpersonationState) => {
    localStorage.setItem(KEY, JSON.stringify(s));
    // NÃO sobrescrever `imp.activeCompanyId` — useActiveCompany já lê o
    // impersonatedCompanyId via useImpersonation e força o escopo. Se
    // gravarmos aqui, ao encerrar a impersonação o master fica ancorado
    // na empresa impersonada no próximo carregamento.
    setState(s);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  const stopImpersonation = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(null);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }, []);

  return {
    isImpersonating: !!state,
    impersonatedCompanyId: state?.companyId ?? null,
    impersonatedCompanyName: state?.companyName ?? null,
    startImpersonation,
    stopImpersonation,
  };
}
