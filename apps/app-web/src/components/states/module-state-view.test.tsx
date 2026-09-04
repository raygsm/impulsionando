import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ModuleStateView } from "@/components/states/module-state-view";

describe("ModuleStateView", () => {
  it("renders UNKNOWN instead of a fake zero", () => {
    render(<ModuleStateView state="ACTIVE" title="Custo de campanha" dataAvailability="UNKNOWN" />);
    expect(screen.getByText(/UNKNOWN/)).toBeTruthy();
    expect(screen.queryByText(/^0$/)).toBeNull();
  });

  it("renders forbidden without leaking other-tenant copy", () => {
    render(<ModuleStateView state="FORBIDDEN" title="Financeiro" />);
    expect(screen.getByText(/Sem permissão/)).toBeTruthy();
    expect(screen.queryByText(/Cantina/)).toBeNull();
    expect(screen.queryByText(/Clínica/)).toBeNull();
  });

  it("renders not entitled", () => {
    render(<ModuleStateView state="NOT_ENTITLED" title="Estoque" />);
    expect(screen.getByText(/Não contratado/)).toBeTruthy();
  });

  it("renders degraded communications", () => {
    render(<ModuleStateView state="DEGRADED" title="WhatsApp" />);
    expect(screen.getByText(/Degradado/)).toBeTruthy();
  });

  it("renders configuring", () => {
    render(<ModuleStateView state="CONFIGURING" title="CRM" />);
    expect(screen.getByText(/Em configuração/)).toBeTruthy();
  });
});
