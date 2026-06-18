/**
 * Testes da lógica de deduplicação de logs (realtime + polling fallback).
 *
 * Garante que, quando o realtime cai e o cliente faz polling, ou quando ele
 * reconecta e recebe eventos já vistos, NENHUM log aparece duas vezes na lista.
 */
import { describe, it, expect } from "vitest";

type LogRow = { id: string; request_id: string; created_at: string; status: string };

/**
 * Merge idempotente: chave primária é `id` (UUID do log) e secundária é
 * `(request_id, status, created_at)`. Espelha o comportamento esperado do
 * painel de logs ao consolidar eventos realtime + polling.
 */
export function mergeLogs(existing: LogRow[], incoming: LogRow[]): LogRow[] {
  const seenIds = new Set(existing.map((l) => l.id));
  const seenKeys = new Set(existing.map((l) => `${l.request_id}|${l.status}|${l.created_at}`));
  const merged = [...existing];
  for (const row of incoming) {
    const key = `${row.request_id}|${row.status}|${row.created_at}`;
    if (seenIds.has(row.id) || seenKeys.has(key)) continue;
    seenIds.add(row.id);
    seenKeys.add(key);
    merged.push(row);
  }
  return merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const sample = (id: string, request_id: string, t: string, status = "sent"): LogRow =>
  ({ id, request_id, created_at: t, status });

describe("mergeLogs (dedup realtime + polling)", () => {
  it("não duplica quando o mesmo evento chega via realtime e polling", () => {
    const ev = sample("a", "req-1", "2026-06-18T10:00:00Z");
    const result = mergeLogs([ev], [ev]);
    expect(result).toHaveLength(1);
  });

  it("agrega múltiplos eventos do mesmo request_id sem duplicar", () => {
    const e1 = sample("a", "req-1", "2026-06-18T10:00:00Z", "queued");
    const e2 = sample("b", "req-1", "2026-06-18T10:00:01Z", "sent");
    const result = mergeLogs([e1], [e1, e2]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.status)).toEqual(["sent", "queued"]);
  });

  it("ignora eventos repetidos quando ids batem (replay no reconnect)", () => {
    const base = [sample("a", "req-1", "2026-06-18T10:00:00Z")];
    const replay = [sample("a", "req-1", "2026-06-18T10:00:00Z")];
    expect(mergeLogs(base, replay)).toHaveLength(1);
  });

  it("ignora eventos com ids distintos mas mesma chave lógica (canal diferente reemitindo)", () => {
    const base = [sample("a", "req-1", "2026-06-18T10:00:00Z", "sent")];
    const dup = [sample("b", "req-1", "2026-06-18T10:00:00Z", "sent")];
    expect(mergeLogs(base, dup)).toHaveLength(1);
  });

  it("mantém ordem cronológica decrescente após várias rodadas de polling", () => {
    let acc: LogRow[] = [];
    const r1 = [sample("a", "r1", "2026-06-18T10:00:00Z")];
    const r2 = [sample("b", "r2", "2026-06-18T10:00:05Z"), sample("a", "r1", "2026-06-18T10:00:00Z")];
    const r3 = [sample("c", "r3", "2026-06-18T10:00:10Z")];
    acc = mergeLogs(acc, r1);
    acc = mergeLogs(acc, r2);
    acc = mergeLogs(acc, r3);
    expect(acc.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });

  it("suporta lote vazio sem alterar o estado", () => {
    const base = [sample("a", "req-1", "2026-06-18T10:00:00Z")];
    expect(mergeLogs(base, [])).toEqual(base);
  });
});
