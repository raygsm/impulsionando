import { describe, expect, it } from "vitest";
import { hasDedicatedClientAgent } from "./client-agent-scope";

describe("hasDedicatedClientAgent", () => {
  it("hides Impulsionito on CSI host and local /csi paths", () => {
    expect(hasDedicatedClientAgent("csi.impulsionando.com.br", "/")).toBe(true);
    expect(hasDedicatedClientAgent("localhost", "/csi")).toBe(true);
    expect(hasDedicatedClientAgent("localhost", "/csi/")).toBe(true);
    expect(hasDedicatedClientAgent("localhost", "/csi/portal")).toBe(true);
    expect(hasDedicatedClientAgent("127.0.0.1", "/csi/entrar")).toBe(true);
  });

  it("keeps Impulsionito on the Impulsionando core", () => {
    expect(hasDedicatedClientAgent("localhost", "/")).toBe(false);
    expect(hasDedicatedClientAgent("impulsionando.com.br", "/")).toBe(false);
    expect(hasDedicatedClientAgent("www.impulsionando.com.br", "/planos")).toBe(false);
  });

  it("still treats other client-agent tenants as dedicated", () => {
    expect(hasDedicatedClientAgent("riomed.impulsionando.com.br", "/")).toBe(true);
    expect(hasDedicatedClientAgent("localhost", "/chrismed")).toBe(true);
    expect(hasDedicatedClientAgent("localhost", "/colors/rastreio")).toBe(true);
  });
});
