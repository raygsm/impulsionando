/**
 * Garantias de idempotência:
 *  - clube_journey_log NÃO permite duplicar (user_id, step_id)
 *  - Trigger de Pix grava clube_receipts apenas uma vez por charge
 *    (reference_type, reference_id) e promove pending_upload → available
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { admin, createUser, deleteUser } from "./helpers";

const cleanup: Array<() => Promise<void>> = [];

afterAll(async () => {
  for (const fn of cleanup.reverse()) {
    try { await fn(); } catch {}
  }
});

describe("clube idempotência", () => {
  let userId: string;
  let stepId: string;

  beforeAll(async () => {
    const u = await createUser(`clube-idem-${Date.now()}@test.local`);
    userId = u.id;
    cleanup.push(() => deleteUser(userId));

    await admin.from("consumer_profiles").insert({ user_id: userId, full_name: "Test Member" });
    cleanup.push(async () => { await admin.from("consumer_profiles").delete().eq("user_id", userId); });

    const { data: step, error } = await admin.from("clube_journey_steps").insert({
      day_offset: 999,
      channel: "email",
      audience: "all",
      event_code: `test_idem_${Date.now()}`,
      subject: "x",
      body: "y",
      active: true,
    }).select("id").single();
    if (error) throw error;
    stepId = step!.id;
    cleanup.push(async () => { await admin.from("clube_journey_steps").delete().eq("id", stepId); });
  });

  it("clube_journey_log rejeita (user_id, step_id) duplicado", async () => {
    const first = await admin.from("clube_journey_log").insert({ user_id: userId, step_id: stepId });
    expect(first.error).toBeNull();

    const dup = await admin.from("clube_journey_log").insert({ user_id: userId, step_id: stepId });
    expect(dup.error).not.toBeNull();
    expect((dup.error as any)?.code).toBe("23505"); // unique_violation

    const { count } = await admin
      .from("clube_journey_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("step_id", stepId);
    expect(count).toBe(1);
  });

  it("trigger Pix cria 1 comprovante e promove pending_upload → available", async () => {
    // ID compartilhado: billing_contracts (FK do charge) + consumer_memberships (lookup do trigger)
    const sharedId = crypto.randomUUID();

    // company + plan mínimos para o contrato
    const { data: comp } = await admin.from("companies").insert({
      name: `idem-${Date.now()}`, slug: `idem-${Date.now()}`,
    }).select("id").single();
    cleanup.push(async () => { await admin.from("companies").delete().eq("id", comp!.id); });

    const { data: plan } = await admin.from("billing_plans").insert({
      code: `idem-${Date.now()}`, name: "idem", recurring_amount: 19.9, billing_cycle: "monthly",
    }).select("id").single();
    cleanup.push(async () => { await admin.from("billing_plans").delete().eq("id", plan!.id); });

    const { error: ctErr } = await admin.from("billing_contracts").insert({
      id: sharedId, company_id: comp!.id, plan_id: plan!.id,
      start_date: new Date().toISOString().slice(0, 10),
      next_due_date: new Date().toISOString().slice(0, 10),
      recurring_amount: 19.9, status: "active",
    });
    expect(ctErr).toBeNull();
    cleanup.push(async () => { await admin.from("billing_contracts").delete().eq("id", sharedId); });

    const { error: mErr } = await admin.from("consumer_memberships").insert({
      id: sharedId, user_id: userId, plan: "premium", status: "active",
    });
    expect(mErr).toBeNull();
    cleanup.push(async () => { await admin.from("consumer_memberships").delete().eq("id", sharedId); });

    // 1ª charge sem receipt_url → pending_upload
    const uniq = 100000 + Math.floor(Math.random() * 800000);
    const { data: charge, error: cErr } = await admin.from("billing_pix_charges").insert({
      contract_id: sharedId,
      plan_code: "test-plan",
      base_amount_cents: uniq,
      unique_amount_cents: uniq,
      pix_payload: "00020126test",
      pix_key: "test@key",
      txid: `idem${Date.now()}`,
      status: "pending",
    }).select("id").single();
    expect(cErr).toBeNull();
    cleanup.push(async () => {
      await admin.from("clube_receipts").delete().eq("reference_id", charge!.id);
      await admin.from("billing_pix_charges").delete().eq("id", charge!.id);
    });

    // marca paid sem URL
    const upd1 = await admin.from("billing_pix_charges")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", charge!.id);
    expect(upd1.error).toBeNull();

    const r1 = await admin.from("clube_receipts")
      .select("id, status")
      .eq("reference_type", "billing_pix_charges")
      .eq("reference_id", charge!.id);
    expect(r1.error).toBeNull();
    expect(r1.data?.length).toBe(1);
    expect(r1.data![0].status).toBe("pending_upload");

    // reprocessa transição paid→paid via update qualquer + url agora preenchida
    const upd2 = await admin.from("billing_pix_charges")
      .update({ status: "pending" })
      .eq("id", charge!.id);
    expect(upd2.error).toBeNull();
    const upd3 = await admin.from("billing_pix_charges")
      .update({ status: "paid", receipt_url: "https://example.com/r.pdf" })
      .eq("id", charge!.id);
    expect(upd3.error).toBeNull();

    const r2 = await admin.from("clube_receipts")
      .select("id, status, receipt_url")
      .eq("reference_type", "billing_pix_charges")
      .eq("reference_id", charge!.id);
    expect(r2.data?.length).toBe(1); // sem duplicar
    expect(r2.data![0].status).toBe("available");
    expect(r2.data![0].receipt_url).toBe("https://example.com/r.pdf");

    // notificação criada quando virou available
    const notifs = await admin.from("notifications")
      .select("id, title")
      .eq("user_id", userId)
      .eq("category", "billing");
    expect((notifs.data ?? []).length).toBeGreaterThanOrEqual(1);
  });
});
