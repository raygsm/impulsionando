import { describe, expect, it } from "vitest";
import {
  assembleVitrineTeasers,
  filterVitrineTeasers,
  isVitrineExcludedSlug,
  publicSiteForTenant,
  segmentForTenantSlug,
} from "@/lib/vitrine-active-tenants";

const chrismedCompany = {
  id: "comp-chrismed",
  name: "CHRISMED",
  is_active: true,
  is_demo: false,
  status: "active",
  logo_url: "/brand/chrismed/logo.png",
};

describe("vitrine active tenants", () => {
  it("excludes platform and test slugs", () => {
    expect(isVitrineExcludedSlug("app")).toBe(true);
    expect(isVitrineExcludedSlug("www")).toBe(true);
    expect(isVitrineExcludedSlug("universidade")).toBe(true);
    expect(isVitrineExcludedSlug("e2e-foo")).toBe(true);
    expect(isVitrineExcludedSlug("chrismed")).toBe(false);
    expect(isVitrineExcludedSlug("csi")).toBe(false);
  });

  it("lists active registry tenants even without a published showcase", () => {
    const rows = assembleVitrineTeasers({
      tenants: [
        { id: "t1", slug: "chrismed", display_name: "CHRISMED", company_id: "comp-chrismed", active: true },
        { id: "t2", slug: "wmp", display_name: "WMP", company_id: "comp-wmp", active: true },
        { id: "t3", slug: "ghost", display_name: "Ghost", company_id: "comp-ghost", active: false },
      ],
      companies: [
        chrismedCompany,
        { id: "comp-wmp", name: "WMP", is_active: true, is_demo: false, status: "active" },
        { id: "comp-ghost", name: "Ghost", is_active: true, is_demo: false, status: "active" },
      ],
      identities: [
        { company_id: "comp-chrismed", subdomain: "chrismed", dns_status: "active", root_domain: "impulsionando.com.br" },
      ],
      showcases: [],
    });

    expect(rows.map((r) => r.public_slug).sort()).toEqual(["chrismed", "wmp"]);
    expect(rows.find((r) => r.public_slug === "chrismed")?.website).toBe("https://chrismed.impulsionando.com.br");
    expect(rows.find((r) => r.public_slug === "chrismed")?.route).toBe("/chrismed");
  });

  it("hides opted-out, demo, and hostile companies", () => {
    const rows = assembleVitrineTeasers({
      tenants: [
        { id: "t1", slug: "csi", display_name: "CSI", company_id: "c1", active: true },
        { id: "t2", slug: "demo", display_name: "Demo", company_id: "c2", active: true },
        { id: "t3", slug: "old", display_name: "Old", company_id: "c3", active: true },
      ],
      companies: [
        { id: "c1", name: "CSI", is_active: true, is_demo: false, status: "active" },
        { id: "c2", name: "Demo", is_active: true, is_demo: true, status: "active" },
        { id: "c3", name: "Old", is_active: true, is_demo: false, status: "archived" },
      ],
      identities: [],
      showcases: [{ company_id: "c1", opted_out_at: "2026-01-01T00:00:00Z" }],
    });
    expect(rows).toEqual([]);
  });

  it("fills gaps from live core_tenant_identity rows", () => {
    const rows = assembleVitrineTeasers({
      tenants: [],
      companies: [{ id: "c-rio", name: "RioMed", is_active: true, is_demo: false, status: "active" }],
      identities: [
        { company_id: "c-rio", subdomain: "riomed", dns_status: "active" },
        { company_id: "c-rio", subdomain: "app", dns_status: "active" },
      ],
      showcases: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].public_slug).toBe("riomed");
    expect(rows[0].segment).toBe("medico-hospitalar");
  });

  it("filters search and segment", () => {
    const rows = filterVitrineTeasers(
      [
        { id: "1", name: "CHRISMED", trade_name: "CHRISMED", segment: "saude", tagline: "clinica", description: null, public_slug: "chrismed", logo_url: null, address_city: null, address_state: null, primary_color: null, rating_avg: null, rating_count: null, subdomain: "chrismed", domain: null, website: null, route: "/chrismed" },
        { id: "2", name: "WMP", trade_name: "WMP", segment: "eventos", tagline: " palco", description: null, public_slug: "wmp", logo_url: null, address_city: null, address_state: null, primary_color: null, rating_avg: null, rating_count: null, subdomain: "wmp", domain: null, website: null, route: "/wmp" },
      ],
      { segment: "saude", q: "chris", limit: 10 },
    );
    expect(rows.map((r) => r.public_slug)).toEqual(["chrismed"]);
  });

  it("prefers the live identity subdomain as the public slug", () => {
    const rows = assembleVitrineTeasers({
      tenants: [{ id: "t1", slug: "colors-saude", display_name: "Colors Saúde", company_id: "c-colors", active: true }],
      companies: [{ id: "c-colors", name: "Colors Saúde", is_active: true, is_demo: false, status: "active" }],
      identities: [{ company_id: "c-colors", subdomain: "colorssaude", dns_status: "active" }],
      showcases: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].public_slug).toBe("colorssaude");
    expect(rows[0].route).toBe("/colors");
  });

  it("maps known segments and public URLs", () => {
    expect(segmentForTenantSlug("csi")).toBe("financeiro");
    expect(publicSiteForTenant({ subdomain: "wmp", rootDomain: "impulsionando.com.br" })).toBe("https://wmp.impulsionando.com.br");
  });
});
