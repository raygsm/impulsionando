import type { DemoTemplate, DemoPlanId } from "./types";
import { alimentacaoRestaurante } from "./alimentacao-restaurante";
import { saudeClinica } from "./saude-clinica";
import { imobiliariaLocacao } from "./imobiliaria-locacao";
import { belezaSalao } from "./beleza-salao";

const TEMPLATES: DemoTemplate[] = [
  alimentacaoRestaurante,
  saudeClinica,
  imobiliariaLocacao,
  belezaSalao,
];

export function getDemoTemplate(macro: string, sub: string): DemoTemplate | undefined {
  return TEMPLATES.find((t) => t.macro === macro && t.sub === sub && t.status === "active");
}

export function listDemoTemplates(): DemoTemplate[] {
  return TEMPLATES.filter((t) => t.status === "active");
}

export function listByMacro(macro: string): DemoTemplate[] {
  return listDemoTemplates().filter((t) => t.macro === macro);
}

export function filterByPlan<T extends { minPlan?: DemoPlanId }>(items: T[], plan: DemoPlanId): T[] {
  const order: DemoPlanId[] = ["essential", "ideal", "full"];
  const activeIdx = order.indexOf(plan);
  return items.filter((it) => {
    if (!it.minPlan) return true;
    return order.indexOf(it.minPlan) <= activeIdx;
  });
}

export function isLockedByPlan(minPlan: DemoPlanId | undefined, activePlan: DemoPlanId): boolean {
  if (!minPlan) return false;
  const order: DemoPlanId[] = ["essential", "ideal", "full"];
  return order.indexOf(minPlan) > order.indexOf(activePlan);
}
