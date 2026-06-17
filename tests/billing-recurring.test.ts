/**
 * Cobrança recorrente — testes conceituais
 *
 * Valida:
 *  - Cálculo de próximo vencimento por ciclo (mensal/trimestral/anual)
 *  - Geração idempotente de fatura (não duplica para mesma due_date)
 *  - Régua de cobrança: open → overdue → suspended por suspend_offset_days
 *  - Pagamento: contrato volta a active, próximo vencimento avança 1 ciclo,
 *    company_modules são reabilitados
 *  - Upgrade/Downgrade: ranking de planos e modo de proração
 */
import { describe, it, expect } from "vitest";

type Cycle = "monthly" | "quarterly" | "yearly";
type InvoiceStatus = "open" | "overdue" | "paid";
type ContractStatus = "active" | "suspended" | "cancelled";

interface Invoice {
  id: string;
  due_date: Date;
  amount: number;
  status: InvoiceStatus;
  paid_at?: Date;
}
interface Contract {
  id: string;
  cycle: Cycle;
  next_due_date: Date;
  status: ContractStatus;
  invoices: Invoice[];
  modulesEnabled: boolean;
}

function addCycle(d: Date, cycle: Cycle): Date {
  const r = new Date(d);
  if (cycle === "monthly") r.setMonth(r.getMonth() + 1);
  else if (cycle === "quarterly") r.setMonth(r.getMonth() + 3);
  else r.setFullYear(r.getFullYear() + 1);
  return r;
}
function subCycle(d: Date, cycle: Cycle): Date {
  const r = new Date(d);
  if (cycle === "monthly") r.setMonth(r.getMonth() - 1);
  else if (cycle === "quarterly") r.setMonth(r.getMonth() - 3);
  else r.setFullYear(r.getFullYear() - 1);
  return r;
}

function runCycle(c: Contract, today: Date, suspendOffsetDays = 7): {
  generated: number;
  suspended: boolean;
} {
  let generated = 0;
  // Gera fatura se next_due_date <= today + 7d e não existe ainda para essa data
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 7);
  if (
    (c.status === "active" || c.status === "suspended") &&
    c.next_due_date <= horizon &&
    !c.invoices.some((i) => i.due_date.getTime() === c.next_due_date.getTime())
  ) {
    c.invoices.push({
      id: crypto.randomUUID(),
      due_date: new Date(c.next_due_date),
      amount: 100,
      status: "open",
    });
    generated++;
  }

  let suspended = false;
  for (const inv of c.invoices) {
    if (inv.status === "paid") continue;
    if (today > inv.due_date) inv.status = "overdue";
    const suspendAt = new Date(inv.due_date);
    suspendAt.setDate(suspendAt.getDate() + suspendOffsetDays);
    if (today >= suspendAt && c.status === "active") {
      c.status = "suspended";
      c.modulesEnabled = false;
      suspended = true;
    }
  }
  return { generated, suspended };
}

function markPaid(c: Contract, invoiceId: string, paidAt: Date) {
  const inv = c.invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new Error("not found");
  if (inv.status === "paid") return;
  inv.status = "paid";
  inv.paid_at = paidAt;
  c.status = "active";
  c.modulesEnabled = true;
  c.next_due_date = addCycle(inv.due_date, c.cycle);
}

function makeContract(cycle: Cycle, nextDue: Date): Contract {
  return {
    id: crypto.randomUUID(),
    cycle,
    next_due_date: nextDue,
    status: "active",
    invoices: [],
    modulesEnabled: true,
  };
}

describe("Cobrança recorrente — ciclos", () => {
  it("mensal: próximo vencimento avança 1 mês após pagamento", () => {
    const c = makeContract("monthly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    markPaid(c, c.invoices[0].id, new Date("2026-01-10"));
    expect(c.next_due_date.toISOString().slice(0, 10)).toBe("2026-02-10");
  });

  it("trimestral: próximo vencimento avança 3 meses", () => {
    const c = makeContract("quarterly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    markPaid(c, c.invoices[0].id, new Date("2026-01-10"));
    expect(c.next_due_date.toISOString().slice(0, 10)).toBe("2026-04-10");
  });

  it("anual: próximo vencimento avança 12 meses", () => {
    const c = makeContract("yearly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    markPaid(c, c.invoices[0].id, new Date("2026-01-10"));
    expect(c.next_due_date.toISOString().slice(0, 10)).toBe("2027-01-10");
  });

  it("não duplica fatura para mesma due_date em runs múltiplos", () => {
    const c = makeContract("monthly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    runCycle(c, new Date("2026-01-05"));
    runCycle(c, new Date("2026-01-05"));
    expect(c.invoices).toHaveLength(1);
  });

  it("trimestral: subCycle retorna 3 meses para period_start", () => {
    expect(subCycle(new Date("2026-04-10"), "quarterly").toISOString().slice(0, 10))
      .toBe("2026-01-10");
  });
});

describe("Cobrança recorrente — régua e suspensão", () => {
  it("open → overdue quando passa do due_date", () => {
    const c = makeContract("monthly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    runCycle(c, new Date("2026-01-11")); // 1 dia após vencimento
    expect(c.invoices[0].status).toBe("overdue");
    expect(c.status).toBe("active"); // ainda não suspenso (offset 7d)
  });

  it("suspende automaticamente após suspend_offset_days (7) e desabilita módulos", () => {
    const c = makeContract("monthly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    const r = runCycle(c, new Date("2026-01-17")); // +7d
    expect(r.suspended).toBe(true);
    expect(c.status).toBe("suspended");
    expect(c.modulesEnabled).toBe(false);
  });

  it("pagamento de fatura suspensa reativa contrato e reabilita módulos", () => {
    const c = makeContract("monthly", new Date("2026-01-10"));
    runCycle(c, new Date("2026-01-05"));
    runCycle(c, new Date("2026-01-17"));
    expect(c.status).toBe("suspended");
    markPaid(c, c.invoices[0].id, new Date("2026-01-20"));
    expect(c.status).toBe("active");
    expect(c.modulesEnabled).toBe(true);
    expect(c.next_due_date.toISOString().slice(0, 10)).toBe("2026-02-10");
  });
});

describe("Upgrade / Downgrade — ranking e proração", () => {
  const PLAN_RANK = { essencial_plan: 1, integrado_plan: 2, avancado_plan: 3 };
  function changePlan(current: keyof typeof PLAN_RANK, next: keyof typeof PLAN_RANK) {
    const isUpgrade = PLAN_RANK[next] > PLAN_RANK[current];
    return {
      isUpgrade,
      prorationBillingMode: isUpgrade
        ? "prorated_immediately"
        : "prorated_next_billing_period",
    };
  }

  it("upgrade essencial → integrado: proração imediata", () => {
    const r = changePlan("essencial_plan", "integrado_plan");
    expect(r.isUpgrade).toBe(true);
    expect(r.prorationBillingMode).toBe("prorated_immediately");
  });

  it("downgrade avancado → essencial: proração no próximo ciclo", () => {
    const r = changePlan("avancado_plan", "essencial_plan");
    expect(r.isUpgrade).toBe(false);
    expect(r.prorationBillingMode).toBe("prorated_next_billing_period");
  });

  it("mesmo plano não é considerado upgrade", () => {
    const r = changePlan("integrado_plan", "integrado_plan");
    expect(r.isUpgrade).toBe(false);
  });
});

describe("Idempotência completa: simulação de 12 meses (mensal)", () => {
  it("gera exatamente 12 faturas e cada uma paga avança 1 mês", () => {
    const c = makeContract("monthly", new Date("2026-01-10"));
    for (let m = 0; m < 12; m++) {
      const today = new Date(2026, m, 5);
      runCycle(c, today);
      // paga no dia
      const inv = c.invoices.find((i) => i.status !== "paid");
      if (inv) markPaid(c, inv.id, inv.due_date);
    }
    expect(c.invoices).toHaveLength(12);
    expect(c.invoices.every((i) => i.status === "paid")).toBe(true);
    expect(c.next_due_date.toISOString().slice(0, 10)).toBe("2027-01-10");
  });
});
