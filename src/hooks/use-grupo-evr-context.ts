import { useEffect, useMemo, useState } from "react";

export type GrupoEvrContextKey = "grupo" | "instituto_evr" | "dr_responde" | "ativese_pharma";

const STORAGE_KEY = "grupo-evr.activeContext";

export const GRUPO_EVR_CONTEXTS = [
  { key: "grupo" as const, label: "Grupo EVR", description: "Visão consolidada autorizada" },
  { key: "instituto_evr" as const, label: "Instituto EVR", description: "Clínica e jornadas próprias" },
  { key: "dr_responde" as const, label: "Dr. Responde", description: "Operação médica própria" },
  { key: "ativese_pharma" as const, label: "Ative-se Pharma", description: "Farmácia, manipulação, PDV e recorrência" },
];

export function useGrupoEvrContext(allowed?: GrupoEvrContextKey[]) {
  const [context, setContextState] = useState<GrupoEvrContextKey>("grupo");

  const options = useMemo(() => {
    if (!allowed?.length) return GRUPO_EVR_CONTEXTS;
    return GRUPO_EVR_CONTEXTS.filter((item) => allowed.includes(item.key));
  }, [allowed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as GrupoEvrContextKey | null;
    if (stored && options.some((o) => o.key === stored)) setContextState(stored);
    else if (options[0]) setContextState(options[0].key);
  }, [options]);

  function setContext(next: GrupoEvrContextKey) {
    if (!options.some((o) => o.key === next)) return;
    setContextState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next);
  }

  return {
    context,
    setContext,
    options,
    current: GRUPO_EVR_CONTEXTS.find((x) => x.key === context) ?? GRUPO_EVR_CONTEXTS[0],
  };
}
