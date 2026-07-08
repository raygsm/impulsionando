// @vitest-environment happy-dom
/**
 * Testes do CoreCopyGuard — validam que:
 *  - o guard bloqueia menu de contexto / copy / cut fora de campos editáveis;
 *  - dispara o CustomEvent `imp:copy-attempt` na mesma aba;
 *  - publica no BroadcastChannel `imp-security` para outras abas;
 *  - persiste o log em localStorage (`imp_copy_attempts`);
 *  - respeita `data-allow-copy` e campos INPUT/TEXTAREA.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CoreCopyGuard, readCopyAttempts, clearCopyAttempts } from "./CoreCopyGuard";

// Simula host de produção (por padrão jsdom usa localhost, que é desprotegido).
function setHost(host: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, hostname: host, pathname: "/", host },
  });
}

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  static messages: Array<{ channel: string; data: unknown }> = [];
  onmessage: ((ev: MessageEvent) => void) | null = null;
  constructor(public name: string) {
    MockBroadcastChannel.instances.push(this);
  }
  postMessage(data: unknown) {
    MockBroadcastChannel.messages.push({ channel: this.name, data });
    // notifica outras instâncias do mesmo canal (simula abas)
    for (const inst of MockBroadcastChannel.instances) {
      if (inst !== this && inst.name === this.name && inst.onmessage) {
        inst.onmessage(new MessageEvent("message", { data }));
      }
    }
  }
  close() { /* noop */ }
}

beforeEach(() => {
  clearCopyAttempts();
  setHost("impulsionando.com.br");
  MockBroadcastChannel.instances = [];
  MockBroadcastChannel.messages = [];
  (globalThis as unknown as { BroadcastChannel: typeof MockBroadcastChannel }).BroadcastChannel = MockBroadcastChannel;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CoreCopyGuard", () => {
  it("bloqueia menu de contexto e dispara CustomEvent + BroadcastChannel", () => {
    const received: Array<Record<string, unknown>> = [];
    window.addEventListener("imp:copy-attempt", (e) => {
      received.push((e as CustomEvent).detail);
    });

    render(<CoreCopyGuard />);

    const div = document.createElement("div");
    document.body.appendChild(div);
    const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    div.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(received).toHaveLength(1);
    expect(received[0].kind).toBe("contextmenu");
    expect(received[0].host).toBe("impulsionando.com.br");

    // BroadcastChannel foi usado para publicar o evento
    const secMsgs = MockBroadcastChannel.messages.filter((m) => m.channel === "imp-security");
    expect(secMsgs).toHaveLength(1);
    expect((secMsgs[0].data as { type: string }).type).toBe("copy_attempt");

    // Persistência
    const persisted = readCopyAttempts();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].kind).toBe("contextmenu");
  });

  it("bloqueia copy/cut fora de campos editáveis", () => {
    render(<CoreCopyGuard />);
    const p = document.createElement("p");
    document.body.appendChild(p);
    const copy = new Event("copy", { bubbles: true, cancelable: true });
    p.dispatchEvent(copy);
    const cut = new Event("cut", { bubbles: true, cancelable: true });
    p.dispatchEvent(cut);
    expect(copy.defaultPrevented).toBe(true);
    expect(cut.defaultPrevented).toBe(true);
    const attempts = readCopyAttempts();
    expect(attempts.map((a) => a.kind)).toEqual(["copy", "cut"]);
  });

  it("respeita <input> e [data-allow-copy]", () => {
    render(<CoreCopyGuard />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    const inputCopy = new Event("copy", { bubbles: true, cancelable: true });
    input.dispatchEvent(inputCopy);
    expect(inputCopy.defaultPrevented).toBe(false);

    const allowed = document.createElement("span");
    allowed.setAttribute("data-allow-copy", "true");
    document.body.appendChild(allowed);
    const allowedCopy = new Event("copy", { bubbles: true, cancelable: true });
    allowed.dispatchEvent(allowedCopy);
    expect(allowedCopy.defaultPrevented).toBe(false);

    expect(readCopyAttempts()).toHaveLength(0);
  });

  it("não age em hosts desprotegidos (localhost, preview)", () => {
    setHost("localhost");
    render(<CoreCopyGuard />);
    const div = document.createElement("div");
    document.body.appendChild(div);
    const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    div.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(readCopyAttempts()).toHaveLength(0);
  });

  it("BroadcastChannel: uma aba (guard) publica → outra aba (listener) recebe", () => {
    render(<CoreCopyGuard />);

    // Simula "outra aba" com listener no mesmo canal
    const otherTab = new MockBroadcastChannel("imp-security");
    const received: unknown[] = [];
    otherTab.onmessage = (m) => received.push(m.data);

    const div = document.createElement("div");
    document.body.appendChild(div);
    div.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));

    expect(received).toHaveLength(1);
    expect((received[0] as { type: string; entry: { kind: string } }).type).toBe("copy_attempt");
    expect((received[0] as { entry: { kind: string } }).entry.kind).toBe("contextmenu");
  });
});
