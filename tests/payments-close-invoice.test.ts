/**
 * Testes do webhook genérico /api/public/payments/close-invoice
 *
 * Cobre:
 * 1) Verificação HMAC (assinatura inválida → 401).
 * 2) Validação de payload (zod).
 * 3) Modo simulação (x-simulate: 1) — descreve o efeito sem executar.
 * 4) Idempotência: reentregas com o mesmo event_id retornam o resultado anterior
 *    e NÃO chamam a RPC de baixa duas vezes.
 *
 * Não dependem de banco real: o `webhook-idempotency.server` e o cliente admin
 * Supabase são mockados via vi.mock(). Validamos comportamento puro do handler.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHmac } from "node:crypto";

const WEBHOOK_SECRET = "test-secret-1234567890";
process.env.INFINITEPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

function sign(body: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

// ----- Mocks: cliente admin Supabase e helpers de idempotência -------------

const rpcMock = vi.fn();
const supabaseAdminMock = { rpc: rpcMock };

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: supabaseAdminMock,
}));

const claimMock = vi.fn();
const recordMock = vi.fn();
const computeEventIdMock = vi.fn((body: string, header: string | null) =>
  header ?? `hash:${body.length}`,
);

vi.mock("@/lib/webhook-idempotency.server", () => ({
  claimWebhookEvent: (...args: any[]) => claimMock(...args),
  recordWebhookResult: (...args: any[]) => recordMock(...args),
  computeEventId: (...args: any[]) => computeEventIdMock(...args),
}));

vi.mock("@/lib/restaurant-customer-notify.server", () => ({
  notifyTableBillClosed: vi.fn().mockResolvedValue({ skipped: "test" }),
}));

// O handler é exportado via Route.options.server.handlers.POST; importamos
// depois dos mocks para que o módulo enxergue as versões mockadas.
async function importHandler() {
  const mod = await import("../src/routes/api/public/payments/close-invoice");
  // @tanstack/react-router expõe a config em Route.options
  const handlers = (mod as any).Route.options.server.handlers;
  return handlers.POST as (ctx: { request: Request }) => Promise<Response>;
}

function makeRequest(body: object, opts: { signature?: string | null; simulate?: boolean; eventId?: string } = {}) {
  const raw = JSON.stringify(body);
  const sig = opts.signature === null ? null : (opts.signature ?? sign(raw));
  const headers = new Headers({ "Content-Type": "application/json" });
  if (sig) headers.set("x-webhook-signature", sig);
  if (opts.simulate) headers.set("x-simulate", "1");
  if (opts.eventId) headers.set("x-event-id", opts.eventId);
  return new Request("http://test.local/api/public/payments/close-invoice", {
    method: "POST",
    headers,
    body: raw,
  });
}

const VALID_PAYLOAD = {
  kind: "consumer" as const,
  invoice_id: "11111111-2222-3333-4444-555555555555",
  status: "paid" as const,
};

beforeEach(() => {
  rpcMock.mockReset();
  claimMock.mockReset();
  recordMock.mockReset();
  computeEventIdMock.mockClear();
});

describe("POST /api/public/payments/close-invoice", () => {
  it("rejects requests without a valid HMAC signature", async () => {
    const handler = await importHandler();
    const req = makeRequest(VALID_PAYLOAD, { signature: null });
    const res = await handler({ request: req });
    expect(res.status).toBe(401);
    expect(claimMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects payloads that fail zod validation", async () => {
    const handler = await importHandler();
    const req = makeRequest({ kind: "consumer", status: "paid" } as any);
    const res = await handler({ request: req });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_payload");
    expect(claimMock).not.toHaveBeenCalled();
  });

  it("simulation mode validates but never writes to the database", async () => {
    const handler = await importHandler();
    const req = makeRequest(VALID_PAYLOAD, { simulate: true });
    const res = await handler({ request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      simulated: true,
      would_call: "mark_membership_invoice_paid",
      kind: "consumer",
    });
    expect(claimMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("processes a new event: claims idempotency slot, calls RPC, records result", async () => {
    claimMock.mockResolvedValueOnce({ duplicate: false });
    rpcMock.mockResolvedValueOnce({ data: { ok: true, membership_id: "abc" }, error: null });

    const handler = await importHandler();
    const req = makeRequest(VALID_PAYLOAD, { eventId: "evt-1" });
    const res = await handler({ request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(claimMock).toHaveBeenCalledOnce();
    expect(rpcMock).toHaveBeenCalledOnce();
    expect(rpcMock).toHaveBeenCalledWith("mark_membership_invoice_paid", {
      _invoice_id: VALID_PAYLOAD.invoice_id,
    });
    expect(recordMock).toHaveBeenCalledOnce();
  });

  it("duplicate delivery returns previous result without calling RPC again", async () => {
    const previous = { ok: true, rpc: "mark_membership_invoice_paid", data: { ok: true } };
    claimMock.mockResolvedValueOnce({ duplicate: true, previous_result: previous });

    const handler = await importHandler();
    const req = makeRequest(VALID_PAYLOAD, { eventId: "evt-1" });
    const res = await handler({ request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, duplicate: true, previous_result: previous });
    expect(rpcMock).not.toHaveBeenCalled();
    expect(recordMock).not.toHaveBeenCalled();
  });

  it("kind=table dispatches the table-bill closed notification once", async () => {
    claimMock.mockResolvedValueOnce({ duplicate: false });
    rpcMock.mockResolvedValueOnce({ data: { ok: true, session_id: "sess-1" }, error: null });

    const notifyMod = await import("../src/lib/restaurant-customer-notify.server");
    const notifySpy = notifyMod.notifyTableBillClosed as unknown as ReturnType<typeof vi.fn>;
    notifySpy.mockClear();

    const handler = await importHandler();
    const req = makeRequest({ ...VALID_PAYLOAD, kind: "table" }, { eventId: "evt-table-1" });
    const res = await handler({ request: req });
    expect(res.status).toBe(200);
    expect(rpcMock).toHaveBeenCalledWith("restaurant_mark_table_invoice_paid", {
      _invoice_id: VALID_PAYLOAD.invoice_id,
    });
    expect(notifySpy).toHaveBeenCalledWith("sess-1");
  });
});
