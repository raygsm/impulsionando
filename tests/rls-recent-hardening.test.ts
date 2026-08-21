// Ecosystem security regression for the CURRENT Core schema.
// Guarantees that anonymous callers cannot read protected operational data,
// while service_role retains operational access and the public showcase stays readable.

import { describe, it, expect } from "vitest";
import { admin, anonClient } from "./helpers";

const PROTECTED_TABLES = [
  "quotes",
  "billing_pix_charges",
  "audit_logs",
  "core_client_request_intakes",
  "core_inventory_reservations",
  "core_service_access_state",
  "core_settings",
] as const;

const COMPANIES_PII_COLUMNS = [
  "email",
  "phone",
  "document",
  "owner_name",
  "whatsapp",
  "financial_email",
  "support_email",
  "commercial_email",
  "legal_name",
] as const;

function isExpectedAnonDenial(error: { code?: string; message?: string }) {
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.code === "42501" ||
    error.code === "PGRST301" ||
    message.includes("permission") ||
    message.includes("not allowed") ||
    message.includes("row-level security") ||
    message.includes("rls")
  );
}

describe("Core RLS hardening — anonymous access is locked down", () => {
  for (const table of PROTECTED_TABLES) {
    it(`anon cannot read protected rows from ${table}`, async () => {
      const { data, error } = await anonClient().from(table).select("*").limit(1);
      if (!error) {
        expect(data ?? []).toEqual([]);
      } else {
        expect(isExpectedAnonDenial(error)).toBe(true);
      }
    });
  }

  it("anon cannot project PII columns from companies", async () => {
    const a = anonClient();
    for (const col of COMPANIES_PII_COLUMNS) {
      const { data, error } = await a.from("companies").select(col).limit(1);
      expect(Boolean(error) || (data ?? []).length === 0, `column ${col} must not leak to anon`).toBe(true);
    }
  });

  it("anon can read companies_vitrine_public safe contract", async () => {
    const { data, error } = await anonClient()
      .from("companies_vitrine_public")
      .select("id,name,trade_name,logo_url,public_slug")
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("Core RLS hardening — service_role retains operational access", () => {
  for (const table of PROTECTED_TABLES) {
    it(`service_role can SELECT from ${table}`, async () => {
      const { error } = await admin.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
  }
});
