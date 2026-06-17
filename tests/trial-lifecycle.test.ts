/**
 * Testes conceituais do ciclo de vida do Trial de 7 dias.
 *
 * Estes testes não tocam o banco real — eles validam a lógica de transição
 * que vive em `public.trial_advance_status` (vide migration mais recente)
 * reproduzindo o mesmo cálculo `(ends_at - now)/86400` e o mesmo conjunto
 * de guards por idempotência via `trial_events`.
 *
 * Cobertura:
 *  - Cálculo de days_left fracionário
 *  - Disparo único de D-3, D-1, expirado e suspensão
 *  - Bloqueio automático após 24h de cobrança não paga
 *  - Não regressão: status não recua quando o cron roda múltiplas vezes
 */
import { describe, it, expect } from "vitest";

type TrialStatus =
  | "ativo"
  | "vence_3d"
  | "vence_1d"
  | "vence_hoje"
  | "cobranca_gerada"
  | "pagamento_pendente"
  | "suspenso"
  | "convertido"
  | "regularizado"
  | "cancelado";

interface TrialRow {
  id: string;
  status: TrialStatus;
  started_at: Date;
  ends_at: Date;
  events: Set<string>;
}

interface AdvanceResult {
  status: TrialStatus;
  newEvents: string[];
}

function advance(trial: TrialRow, now: Date): AdvanceResult {
  const daysLeft = (trial.ends_at.getTime() - now.getTime()) / 86_400_000;
  const events: string[] = [];
  let status = trial.status;

  const fire = (evt: string) => {
    if (!trial.events.has(evt)) {
      events.push(evt);
      trial.events.add(evt);
      return true;
    }
    return false;
  };

  if (daysLeft <= 3 && daysLeft > 1 && status === "ativo") {
    if (fire("comm.day3_left")) status = "vence_3d";
  } else if (daysLeft <= 1 && daysLeft > 0 && (status === "ativo" || status === "vence_3d")) {
    if (fire("comm.day1_left")) status = "vence_1d";
  } else if (
    daysLeft <= 0 &&
    ["ativo", "vence_3d", "vence_1d", "vence_hoje"].includes(status)
  ) {
    if (fire("comm.expired")) {
      fire("billing.generated");
      status = "cobranca_gerada";
    }
  } else if (
    status === "cobranca_gerada" &&
    now.getTime() >= trial.ends_at.getTime() + 24 * 3_600_000
  ) {
    if (fire("access.suspended")) status = "suspenso";
  }

  trial.status = status;
  return { status, newEvents: events };
}

function makeTrial(daysFromNow: number, now = new Date()): TrialRow {
  const started = new Date(now.getTime() - (7 - daysFromNow) * 86_400_000);
  const ends = new Date(now.getTime() + daysFromNow * 86_400_000);
  return {
    id: crypto.randomUUID(),
    status: "ativo",
    started_at: started,
    ends_at: ends,
    events: new Set(),
  };
}

describe("Trial 7d — ciclo de vida ponta-a-ponta", () => {
  it("ends_at é exatamente 7 dias após started_at na criação", () => {
    const t = makeTrial(7);
    const days = Math.round(
      (t.ends_at.getTime() - t.started_at.getTime()) / 86_400_000,
    );
    expect(days).toBe(7);
  });

  it("não dispara nenhum aviso enquanto faltam >3 dias", () => {
    const now = new Date();
    const t = makeTrial(5, now);
    const r = advance(t, now);
    expect(r.newEvents).toEqual([]);
    expect(t.status).toBe("ativo");
  });

  it("D-3: dispara comm.day3_left quando faltam 2.5 dias e move para vence_3d", () => {
    const now = new Date();
    const t = makeTrial(2.5, now);
    const r = advance(t, now);
    expect(r.newEvents).toContain("comm.day3_left");
    expect(t.status).toBe("vence_3d");
  });

  it("D-3 é idempotente: roda 5x no mesmo dia, dispara só uma vez", () => {
    const now = new Date();
    const t = makeTrial(2.5, now);
    advance(t, now);
    const fired = [0, 0, 0, 0].map(() => advance(t, now).newEvents).flat();
    expect(fired).toEqual([]);
  });

  it("D-1: dispara comm.day1_left quando falta ~12h e move para vence_1d", () => {
    const now = new Date();
    const t = makeTrial(0.5, now);
    const r = advance(t, now);
    expect(r.newEvents).toContain("comm.day1_left");
    expect(t.status).toBe("vence_1d");
  });

  it("expirado: ao passar de ends_at gera cobranca_gerada + eventos comm.expired e billing.generated", () => {
    const now = new Date();
    const t = makeTrial(-0.01, now);
    const r = advance(t, now);
    expect(t.status).toBe("cobranca_gerada");
    expect(r.newEvents).toContain("comm.expired");
    expect(r.newEvents).toContain("billing.generated");
  });

  it("bloqueio automático: 24h após ends_at sem pagamento => suspenso", () => {
    const past = new Date(Date.now() - 26 * 3_600_000);
    const t: TrialRow = {
      id: "x",
      status: "cobranca_gerada",
      started_at: new Date(past.getTime() - 7 * 86_400_000),
      ends_at: past,
      events: new Set(["comm.expired", "billing.generated"]),
    };
    const r = advance(t, new Date());
    expect(t.status).toBe("suspenso");
    expect(r.newEvents).toContain("access.suspended");
  });

  it("não regride: trial convertido permanece convertido após advance", () => {
    const t = makeTrial(-1);
    t.status = "convertido";
    advance(t, new Date());
    expect(t.status).toBe("convertido");
  });

  it("simulação completa dos 7 dias: emite cada notificação exatamente uma vez", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const t: TrialRow = {
      id: "full",
      status: "ativo",
      started_at: start,
      ends_at: new Date(start.getTime() + 7 * 86_400_000),
      events: new Set(),
    };
    // Roda o "cron" a cada hora por 9 dias
    const fired: string[] = [];
    for (let h = 0; h <= 24 * 9; h++) {
      const now = new Date(start.getTime() + h * 3_600_000);
      fired.push(...advance(t, now).newEvents);
    }
    const counts = fired.reduce<Record<string, number>>((acc, e) => {
      acc[e] = (acc[e] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts["comm.day3_left"]).toBe(1);
    expect(counts["comm.day1_left"]).toBe(1);
    expect(counts["comm.expired"]).toBe(1);
    expect(counts["billing.generated"]).toBe(1);
    expect(counts["access.suspended"]).toBe(1);
    expect(t.status).toBe("suspenso");
  });

  it("conversão antes do vencimento interrompe a régua de avisos", () => {
    const now = new Date();
    const t = makeTrial(2, now);
    advance(t, now); // dispara D-3
    t.status = "convertido";
    const later = new Date(now.getTime() + 3 * 86_400_000);
    const r = advance(t, later);
    expect(r.newEvents).toEqual([]);
    expect(t.status).toBe("convertido");
  });
});
