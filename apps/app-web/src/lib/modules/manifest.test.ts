import { describe, expect, it } from "vitest";
import { composeDashboardManifest, INVARIANT_NAV } from "./manifest";
import { FIXTURES } from "./fixtures";

function manifest(id: keyof typeof FIXTURES) {
  const row = FIXTURES[id];
  return composeDashboardManifest({
    config: row.config,
    entitlements: row.entitlements,
    role: row.role,
    agent: null,
  });
}

describe("dashboard manifest (transitional)", () => {
  it("keeps invariant nav order and hrefs", () => {
    expect(INVARIANT_NAV.map((i) => i.id)).toEqual([
      "home",
      "growth",
      "customers",
      "operations",
      "management",
      "help",
      "settings",
    ]);
    expect(INVARIANT_NAV.map((i) => i.href)).toEqual([
      "/dashboard",
      "/growth",
      "/customers",
      "/operations",
      "/management",
      "/help",
      "/settings",
    ]);
  });

  it("does not mix restaurant and clinic tenant ids", () => {
    const a = manifest("restaurant");
    const b = manifest("clinic");
    expect(FIXTURES.restaurant.config.id).not.toBe(FIXTURES.clinic.config.id);
    expect(a.tenant.name).toBe("Cantina Oliveira");
    expect(b.tenant.name).toBe("Clínica Horizonte");
    expect(a.tenant.name).not.toBe(b.tenant.name);
  });

  it("marks campaign cost as UNKNOWN rather than a numeric zero", () => {
    const m = manifest("restaurant");
    const cost = m.widgets.find((w) => w.id === "campaign-cost");
    expect(cost?.dataAvailability).toBe("UNKNOWN");
    expect(JSON.stringify(cost)).not.toMatch(/"value":\s*0/);
  });

  it("hides finance for finance_limited even if the module is entitled", () => {
    const m = manifest("clinic");
    const finance = m.modules.find((mod) => mod.id === "finance");
    expect(finance?.state).toBe("NOT_ENTITLED");
    const widget = m.widgets.find((w) => w.id === "finance-ap");
    expect(widget?.state).toBe("NOT_ENTITLED");
  });

  it("shows configuring marketing for real estate", () => {
    const m = manifest("realestate");
    const growth = m.widgets.find((w) => w.id === "acquisition");
    expect(growth?.state).toBe("CONFIGURING");
    const inventory = m.modules.find((mod) => mod.id === "inventory");
    expect(inventory?.state).toBe("NOT_ENTITLED");
  });

  it("empty tenant has no entitled product modules", () => {
    const m = manifest("empty");
    expect(m.modules.filter((mod) => mod.state === "ACTIVE" && mod.id !== "ai").every((mod) => mod.id)).toBeTruthy();
    expect(m.modules.find((mod) => mod.id === "crm")?.state).toBe("NOT_ENTITLED");
  });

  it("always marks the adapter as transitional", () => {
    expect(manifest("restaurant").transitional).toBe(true);
  });
});
