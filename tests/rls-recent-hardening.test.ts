// Validates the security review hardening migrations of 2026-06-18:
//  - anon must not see PII columns on `companies`, only the safe vitrine table
//  - anon must not read `quotes`, `billing_pix_charges`, `contract_signatures`,
//    `contract_documents`, `evt_events`, `restaurant_table_invoices`,
//    `contab_irpf_journeys`, `contab_irpf_steps`, `contab_contracts`,
//    `core_settings`
//  - staff (super-admin via service role) can read those tables

import { describe, it, expect } from "vitest";
import { admin, anonClient } from "./helpers";

const PROTECTED_TABLES = [
  "quotes",
  "billing_pix_charges",
  "contract_signatures",
  "contract_documents",
  "evt_events",
  "restaurant_table_invoices",
  "contab_irpf_journeys",
  "contab_irpf_steps",
  "contab_contracts",
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

describe("RLS hardening — anonymous access is locked down", () => {
  for (const table of PROTECTED_TABLES) {
    it(`anon cannot SELECT from ${table}`, async () => {
      const a = anonClient();
      const { data, error } = await a.from(table).select("*").limit(1);
      // Either an error is returned, or the rows are filtered to zero.
      // Both outcomes are acceptable — what we forbid is leaking rows.
      if (!error) {
        expect(data ?? []).toEqual([]);
      } else {
        expect(error.code === "42501" || error.message.toLowerCase().includes("permission") || error.message.toLowerCase().includes("not allowed")).toBe(true);
      }
    });
  }

  it("anon cannot project PII columns from companies", async () => {
    const a = anonClient();
    for (const col of COMPANIES_PII_COLUMNS) {
      const { error } = await a.from("companies").select(col).limit(1);
      expect(error, `column ${col} must be denied to anon`).toBeTruthy();
    }
  });

  it("anon can read companies_vitrine_public (safe columns only)", async () => {
    const a = anonClient();
    const { error } = await a
      .from("companies_vitrine_public")
      .select("id,name,trade_name,logo_url,public_slug")
      .limit(1);
    expect(error).toBeNull();
  });
});

describe("RLS hardening — staff (service role) keeps full read access", () => {
  for (const table of PROTECTED_TABLES) {
    it(`service_role can SELECT from ${table}`, async () => {
      const { error } = await admin.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
  }
});
