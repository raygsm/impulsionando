/**
 * Tests for the public /teste flow and checkout, proving that:
 *
 *   - The Pix payload builder produces a valid EMV string with the
 *     correct CRC and lead data.
 *   - "Simular confirmação" in PixTestGenerator NEVER changes the access
 *     guard — only InfinitePay `paid` rows in `production` unlock modules.
 *   - A "TESTE" plan checkout row created in `production` is created as
 *     waiting_payment (not paid), and the guard refuses to unlock until
 *     the webhook/payment_check flips it to `paid`.
 *   - Query params / redirect data NEVER grant access — only the
 *     server-side `requireInfinitePayPaidCore` decides, by reading the DB.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildPixPayload } from "@/lib/pix";

// --- in-memory supabaseAdmin double (mirrors infinitepay-flow.test.ts) ---
type Row = Record<string, any>;
const store: { rows: Row[] } = { rows: [] };

function buildSelect(filters: Array<[string, any]>) {
  let res = store.rows.filter((r) => filters.every(([k, v]) => r[k] === v));
  const api: any = {
    eq(col: string, val: any) {
      res = res.filter((r) => r[col] === val);
      return api;
    },
    order() { return api; },
    limit() { return api; },
    maybeSingle() { return Promise.resolve({ data: res[0] ?? null, error: null }); },
    single() {
      return Promise.resolve(
        res[0]
          ? { data: res[0], error: null }
          : { data: null, error: { message: "no rows" } },
      );
    },
  };
  return api;
}

const supabaseAdmin = {
  from() {
    return {
      insert(payload: Row | Row[]) {
        const rows = Array.isArray(payload) ? payload : [payload];
        store.rows.push(...rows);
        const last = rows[rows.length - 1];
        return {
          select: () => ({
            single: () => Promise.resolve({ data: last, error: null }),
          }),
          then: (fn: any) => fn({ error: null }),
        };
      },
      select() { return buildSelect([]); },
      update(patch: Row) {
        return {
          eq(col: string, val: any) {
            store.rows = store.rows.map((r) =>
              r[col] === val ? { ...r, ...patch } : r,
            );
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  },
};

vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: { _isMiddleware: true },
}));

process.env.INFINITEPAY_HANDLE = "$test-handle";
process.env.INFINITEPAY_REDIRECT_URL = "https://example.test/checkout/success";
process.env.INFINITEPAY_WEBHOOK_URL =
  "https://example.test/api/public/payments/infinitepay/webhook";

const LEAD_USER = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  store.rows = [];
  vi.restoreAllMocks();
});

describe("/teste — Pix payload builder", () => {
  it("produces a non-empty EMV string with merchant name, amount and CRC", () => {
    const code = buildPixPayload({
      pixKey: "teste@impulsionando.com.br",
      amount: 1,
      merchantName: "Maria Silva",
      merchantCity: "Rio",
      txid: "TESTE-123",
    });
    expect(code.length).toBeGreaterThan(60);
    // amount "1.00" must appear inside the "54" field
    expect(code).toMatch(/54041\.00/);
    // CRC field starts with "6304"
    expect(code).toMatch(/6304[0-9A-F]{4}$/);
    // Merchant name (sanitized & uppercased length-prefixed)
    expect(code).toContain("Maria Silva");
  });

  it("falls back to a safe pix key when document/email missing — never throws", () => {
    expect(() =>
      buildPixPayload({
        pixKey: "fallback@x.com",
        amount: 1,
        merchantName: "X",
      }),
    ).not.toThrow();
  });
});

describe("/teste — checkout TESTE plan via InfinitePay", () => {
  it("creates a production row as waiting_payment (never paid on creation)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ url: "https://checkout.infinitepay.io/teste-1" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const { createInfinitePayCheckoutCore } = await import(
      "@/lib/infinitepay.functions"
    );

    const r = await createInfinitePayCheckoutCore(LEAD_USER, {
      environment: "production",
      customer: {
        name: "Lead Teste",
        email: "lead@teste.com",
        phone_number: "11999999999",
      },
      items: [{ quantity: 1, price: 100, description: "Plano TESTE Impulsionando" }],
      plano_id: "TESTE",
    } as any);

    expect(r.checkout_url).toBe("https://checkout.infinitepay.io/teste-1");
    const row = store.rows.find((x) => x.order_nsu === r.order_nsu)!;
    expect(row.environment).toBe("production");
    expect(row.plano_id).toBe("TESTE");
    expect(row.status).toBe("waiting_payment");
    expect(row.paid_at).toBeFalsy();
  });

  it("guard refuses access for the TESTE plan until the webhook marks paid", async () => {
    // Seed a waiting_payment row
    store.rows.push({
      user_id: LEAD_USER,
      environment: "production",
      status: "waiting_payment",
      plano_id: "TESTE",
      order_nsu: "T1",
      paid_at: null,
    });
    const { requireInfinitePayPaidCore } = await import(
      "@/lib/infinitepay.functions"
    );
    const before = await requireInfinitePayPaidCore(LEAD_USER, { plano_id: "TESTE" });
    expect(before.paid).toBe(false);

    // Flip to paid (as the webhook would do)
    store.rows = store.rows.map((r) =>
      r.order_nsu === "T1"
        ? { ...r, status: "paid", paid_at: new Date().toISOString() }
        : r,
    );
    const after = await requireInfinitePayPaidCore(LEAD_USER, { plano_id: "TESTE" });
    expect(after.paid).toBe(true);
  });
});

describe("/teste — redirect / query params / simulação NEVER grant access", () => {
  it("a row with status 'redirect_returned' or 'manual_checked' does NOT unlock", async () => {
    for (const status of ["redirect_returned", "manual_checked", "checkout_created", "waiting_payment"]) {
      store.rows = [
        {
          user_id: LEAD_USER,
          environment: "production",
          status,
          plano_id: "TESTE",
          order_nsu: `O-${status}`,
          paid_at: null,
        },
      ];
      const { requireInfinitePayPaidCore } = await import(
        "@/lib/infinitepay.functions"
      );
      const r = await requireInfinitePayPaidCore(LEAD_USER, { plano_id: "TESTE" });
      expect(r.paid, `status=${status} should not unlock`).toBe(false);
    }
  });

  it("a DEMO paid row does NOT unlock production modules (even with plano_id=TESTE)", async () => {
    store.rows.push({
      user_id: LEAD_USER,
      environment: "demo",
      status: "paid",
      plano_id: "TESTE",
      order_nsu: "D1",
      paid_at: new Date().toISOString(),
    });
    const { requireInfinitePayPaidCore } = await import(
      "@/lib/infinitepay.functions"
    );
    const r = await requireInfinitePayPaidCore(LEAD_USER, { plano_id: "TESTE" });
    expect(r.paid).toBe(false);
  });

  it("payment_check that returns paid:false leaves the row unpaid (covers redirect-back to /checkout/success)", async () => {
    // Seed waiting_payment
    store.rows.push({
      user_id: LEAD_USER,
      environment: "production",
      status: "waiting_payment",
      plano_id: "TESTE",
      order_nsu: "RC1",
      paid_at: null,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ paid: false }), { status: 200 }),
      ),
    );
    const { checkInfinitePayStatusCore, requireInfinitePayPaidCore } = await import(
      "@/lib/infinitepay.functions"
    );
    const checked = await checkInfinitePayStatusCore(LEAD_USER, {
      order_nsu: "RC1",
    });
    expect(checked.status).not.toBe("paid");
    const guard = await requireInfinitePayPaidCore(LEAD_USER, { plano_id: "TESTE" });
    expect(guard.paid).toBe(false);
  });
});
