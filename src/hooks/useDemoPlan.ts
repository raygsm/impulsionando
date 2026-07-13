import { useCallback, useState } from "react";
import type { DemoPlanId } from "@/data/demo-templates/types";
import { PLAN_ORDER } from "@/data/demo-templates/types";

export function useDemoPlan(initial: DemoPlanId = "ideal") {
  const [plan, setPlanState] = useState<DemoPlanId>(() => {
    if (typeof window === "undefined") return initial;
    const url = new URL(window.location.href);
    const q = url.searchParams.get("plan") as DemoPlanId | null;
    return q && PLAN_ORDER.includes(q) ? q : initial;
  });

  const setPlan = useCallback((next: DemoPlanId) => {
    setPlanState(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("plan", next);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return { plan, setPlan };
}
