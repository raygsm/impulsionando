/**
 * Unit tests for the InfinitePay flow that prove `paid` is the ONLY path
 * that grants access:
 *
 *  - createInfinitePayCheckoutCore: persists with `checkout_created`/`waiting_payment`, never `paid`.
 *  - checkInfinitePayStatusCore: marks `paid` ONLY when InfinitePay returns paid=true.
 *  - requireInfinitePayPaidCore: only resolves true for a `paid` production row.
 *
 * Supabase is mocked in-memory; fetch is stubbed per test.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// --- in-memory supabaseAdmin double ----------------------------------------
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
            store.rows = store.rows.map((r) => (r[col] === val ? { ...r, ...patch } : r));
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

// env required by the lib
process.env.INFINITEPAY_HANDLE = "$test-handle";
process.env.INFINITEPAY_REDIRECT_URL = "https://example.test/checkout/success";
process.env.INFINITEPAY_WEBHOOK_URL = "https://example.test/api/public/payments/infinitepay/webhook";

const USER_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  store.rows = [];
  vi.restoreAllMocks();
});

describe("createInfinitePayCheckoutCore", () => {
  it("DEMO never calls InfinitePay and marks the row paid in 'demo' env (isolated from production)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any);
    const { createInfinitePayCheckoutCore } = await import("@/lib/infinitepay.functions");

    const r = await createInfinitePayCheckoutCore(USER_ID, {
      environment: "demo",
      customer: { name: "X", email: "x@y.z", phone_number: "11999999999" },
      items: [{ quantity: 1, price: 100, description: "test" }],
    } as any);

    expect(r.demo).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    const row = store.rows[0];
    expect(row.environment).toBe("demo");
    expect(row.status).toBe("paid"); // demo can show paid; production unlock is environment-scoped
  });

  it("PRODUCTION creates row as waiting_payment, never paid, with checkout_url", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ url: "https://checkout.infinitepay.io/abc" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const { createInfinitePayCheckoutCore } = await import("@/lib/infinitepay.functions");

    const r = await createInfinitePayCheckoutCore(USER_ID, {
      environment: "production",
      customer: { name: "X", email: "x@y.z", phone_number: "11999999999" },
      items: [{ quantity: 1, price: 100, description: "test" }],
    } as any);

    expect(r.checkout_url).toBe("https://checkout.infinitepay.io/abc");
    const row = store.rows.find((r) => r.order_nsu === r.order_nsu)!;
    expect(row.environment).toBe("production");
    expect(row.status).toBe("waiting_payment");
  });
});

describe("checkInfinitePayStatusCore (payment_check fallback)", () => {
  async function seed(status = "waiting_payment") {
    const { createInfinitePayCheckoutCore } = await import("@/lib/infinitepay.functions");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ url: "https://checkout.infinitepay.io/abc" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const r = await createInfinitePayCheckoutCore(USER_ID, {
      environment: "production",
      customer: { name: "X", email: "x@y.z", phone_number: "11999999999" },
      items: [{ quantity: 1, price: 100, description: "test" }],
    } as any);
    if (status !== "waiting_payment") {
      store.rows = store.rows.map((row) =>
        row.order_nsu === r.order_nsu ? { ...row, status } : row,
      );
    }
    return r.order_nsu!;
  }

  it("does NOT mark paid when payment_check returns paid:false", async () => {
    const order_nsu = await seed();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ paid: false }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const { checkInfinitePayStatusCore } = await import("@/lib/infinitepay.functions");
    const r = await checkInfinitePayStatusCore(USER_ID, { order_nsu });
    expect(r.status).not.toBe("paid");
    const row = store.rows.find((r) => r.order_nsu === order_nsu)!;
    expect(row.status).not.toBe("paid"); // manual_checked or original
  });

  it("does NOT mark paid when payment_check returns an empty body", async () => {
    const order_nsu = await seed();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const { checkInfinitePayStatusCore } = await import("@/lib/infinitepay.functions");
    const r = await checkInfinitePayStatusCore(USER_ID, { order_nsu });
    expect(r.status).not.toBe("paid");
  });

  it("marks paid ONLY when payment_check explicitly returns paid:true", async () => {
    const order_nsu = await seed();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ paid: true, paid_amount: 100, capture_method: "pix" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
    const { checkInfinitePayStatusCore } = await import("@/lib/infinitepay.functions");
    const r = await checkInfinitePayStatusCore(USER_ID, { order_nsu });
    expect(r.status).toBe("paid");
    const row = store.rows.find((r) => r.order_nsu === order_nsu)!;
    expect(row.status).toBe("paid");
  });

  it("rejects when another user tries to check the order", async () => {
    const order_nsu = await seed();
    const { checkInfinitePayStatusCore } = await import("@/lib/infinitepay.functions");
    await expect(
      checkInfinitePayStatusCore("22222222-2222-2222-2222-222222222222", { order_nsu }),
    ).rejects.toThrow(/Acesso negado/);
  });
});

describe("requireInfinitePayPaidCore (server-side access guard)", () => {
  it("returns paid:false when no payment exists", async () => {
    const { requireInfinitePayPaidCore } = await import("@/lib/infinitepay.functions");
    const r = await requireInfinitePayPaidCore(USER_ID, { modulo_id: "advogados" });
    expect(r.paid).toBe(false);
  });

  it("returns paid:false for a waiting_payment row (no redirect/legacy access path)", async () => {
    store.rows.push({
      user_id: USER_ID, environment: "production", status: "waiting_payment",
      modulo_id: "advogados", order_nsu: "X", paid_at: null,
    });
    const { requireInfinitePayPaidCore } = await import("@/lib/infinitepay.functions");
    const r = await requireInfinitePayPaidCore(USER_ID, { modulo_id: "advogados" });
    expect(r.paid).toBe(false);
  });

  it("returns paid:false for a DEMO paid row — demo NEVER unlocks production modules", async () => {
    store.rows.push({
      user_id: USER_ID, environment: "demo", status: "paid",
      modulo_id: "advogados", order_nsu: "D", paid_at: new Date().toISOString(),
    });
    const { requireInfinitePayPaidCore } = await import("@/lib/infinitepay.functions");
    const r = await requireInfinitePayPaidCore(USER_ID, { modulo_id: "advogados" });
    expect(r.paid).toBe(false);
  });

  it("returns paid:true for a production paid row matching the criteria", async () => {
    store.rows.push({
      user_id: USER_ID, environment: "production", status: "paid",
      modulo_id: "advogados", order_nsu: "P", paid_at: new Date().toISOString(),
    });
    const { requireInfinitePayPaidCore } = await import("@/lib/infinitepay.functions");
    const r = await requireInfinitePayPaidCore(USER_ID, { modulo_id: "advogados" });
    expect(r.paid).toBe(true);
  });

  it("does NOT leak paid rows across users", async () => {
    store.rows.push({
      user_id: "other", environment: "production", status: "paid",
      modulo_id: "advogados", order_nsu: "P", paid_at: new Date().toISOString(),
    });
    const { requireInfinitePayPaidCore } = await import("@/lib/infinitepay.functions");
    const r = await requireInfinitePayPaidCore(USER_ID, { modulo_id: "advogados" });
    expect(r.paid).toBe(false);
  });
});
