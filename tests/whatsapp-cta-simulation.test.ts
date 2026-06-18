/**
 * Tests for the new per-channel dispatch decisions and the historical
 * rule simulation (replay over last N days with cooldown + dedup).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  planChannelDispatch,
  simulateAlertRules,
  buildDailySummaryRange,
  ruleScope,
  type AlertRule,
  type BufferedEvent,
  type AlertEval,
} from "../src/lib/whatsapp-cta";

// jsdom not configured for these tests — mock localStorage minimally.
const store = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  },
};

beforeEach(() => store.clear());

const baseRule: AlertRule = {
  id: "r1",
  label: "Orçamento",
  route: "/orcamento",
  variant: "",
  minCtr: 5,
  minSendRate: 30,
  windowHours: 24,
  minSamples: 10,
  enabled: true,
};

const evBelow: AlertEval = {
  ctr: 1, sendRate: 5, impressions: 100, clicks: 50, sends: 2,
  ctrBelow: true, sendBelow: true, triggered: true,
};

describe("planChannelDispatch", () => {
  it("returns willFire=true for both channels by default when triggered", () => {
    const decisions = planChannelDispatch(evBelow, baseRule);
    expect(decisions).toHaveLength(2);
    expect(decisions.every((d) => d.willFire)).toBe(true);
  });

  it("respects per-channel disabled flag", () => {
    const rule: AlertRule = { ...baseRule, channels: { slack: { enabled: false } } };
    const decisions = planChannelDispatch(evBelow, rule);
    const slack = decisions.find((d) => d.channel === "slack")!;
    const email = decisions.find((d) => d.channel === "email")!;
    expect(slack.willFire).toBe(false);
    expect(slack.reason).toBe("disabled");
    expect(email.willFire).toBe(true);
  });

  it("respects per-channel override thresholds (Slack stricter, e-mail looser)", () => {
    const ev: AlertEval = {
      ctr: 4, sendRate: 50, impressions: 100, clicks: 50, sends: 25,
      ctrBelow: false, sendBelow: false, triggered: false,
    };
    // recompute ctrBelow at rule level (min 5): 4 < 5 → below
    ev.ctrBelow = ev.ctr < baseRule.minCtr;
    ev.triggered = ev.ctrBelow;
    const rule: AlertRule = {
      ...baseRule,
      channels: {
        slack: { enabled: true, minCtr: 10 },  // stricter — 4 < 10 → fire
        email: { enabled: true, minCtr: 2 },   // looser — 4 > 2 → no fire
      },
    };
    const [slack, email] = planChannelDispatch(ev, rule);
    expect(slack.willFire).toBe(true);
    expect(email.willFire).toBe(false);
    expect(email.reason).toBe("thresholds_ok");
  });

  it("uses per-channel cooldown override (5min vs default 60)", () => {
    const now = 1_700_000_000_000;
    const rule: AlertRule = {
      ...baseRule,
      channels: {
        slack: { enabled: true, cooldownMinutes: 5 },
        email: { enabled: true, cooldownMinutes: 120 },
      },
    };
    const lastBy = new Map<string, number>();
    // Last dispatch 10 min ago for both channels
    const tenMinAgo = now - 10 * 60_000;
    lastBy.set(`${ruleScope(rule)}|slack`, tenMinAgo);
    lastBy.set(`${ruleScope(rule)}|email`, tenMinAgo);
    const lookup = (s: string, c: any) => lastBy.get(`${s}|${c}`) ?? 0;
    const [slack, email] = planChannelDispatch(evBelow, rule, { now, cooldownLookup: lookup });
    expect(slack.willFire).toBe(true);  // 5min cooldown elapsed
    expect(email.willFire).toBe(false); // 120min cooldown active
    expect(email.reason).toBe("cooldown");
  });
});

describe("simulateAlertRules", () => {
  function mkEvent(ts: number, event: BufferedEvent["event"], path = "/orcamento"): BufferedEvent {
    return { ts, event, origin: "hero", path, variant: undefined, campaign: undefined };
  }

  it("returns no dispatch when there are no events", () => {
    const out = simulateAlertRules([], [baseRule], 7);
    expect(out).toHaveLength(0);
  });

  it("fires once per channel then respects cooldown across simulation steps", () => {
    const now = 1_700_000_000_000;
    const events: BufferedEvent[] = [];
    // Generate 100 impressions, 50 clicks, 2 sends over 5 days — CTR 50%, sendRate 4%
    for (let i = 0; i < 100; i++) events.push(mkEvent(now - 5 * 86_400_000 + i * 10_000, "whatsapp_cta_impression"));
    for (let i = 0; i < 50; i++) events.push(mkEvent(now - 4 * 86_400_000 + i * 10_000, "whatsapp_cta_click"));
    for (let i = 0; i < 2; i++) events.push(mkEvent(now - 3 * 86_400_000 + i * 10_000, "whatsapp_cta_sent"));

    const rule: AlertRule = {
      ...baseRule, minCtr: 0, minSendRate: 30, minSamples: 10,
      channels: {
        slack: { enabled: true, cooldownMinutes: 60 },
        email: { enabled: true, cooldownMinutes: 60 },
      },
    };
    const out = simulateAlertRules(events, [rule], 7, { stepMinutes: 60, now });
    const fired = out.filter((o) => o.status === "fired");
    expect(fired.length).toBeGreaterThan(0);
    // Each channel firing should respect ~60min spacing
    const slackTs = fired.filter((o) => o.channel === "slack").map((o) => o.ts).sort();
    for (let i = 1; i < slackTs.length; i++) {
      expect(slackTs[i] - slackTs[i - 1]).toBeGreaterThanOrEqual(60 * 60_000);
    }
  });

  it("does not include suppressed entries unless includeNonFiring=true", () => {
    const now = 1_700_000_000_000;
    const events: BufferedEvent[] = [];
    for (let i = 0; i < 50; i++) events.push(mkEvent(now - 86_400_000 + i * 10_000, "whatsapp_cta_impression"));
    for (let i = 0; i < 30; i++) events.push(mkEvent(now - 86_400_000 + i * 10_000, "whatsapp_cta_click"));
    const rule: AlertRule = { ...baseRule, minCtr: 0, minSendRate: 50, minSamples: 10 };
    const without = simulateAlertRules(events, [rule], 2, { stepMinutes: 60, now });
    const withSuppressed = simulateAlertRules(events, [rule], 2, { stepMinutes: 60, now, includeNonFiring: true });
    expect(withSuppressed.length).toBeGreaterThan(without.length);
    expect(withSuppressed.some((o) => o.status === "suppressed_cooldown")).toBe(true);
  });

  it("skips rules that are disabled", () => {
    const now = Date.now();
    const events: BufferedEvent[] = Array.from({ length: 50 }, (_, i) =>
      ({ ts: now - i * 60_000, event: "whatsapp_cta_impression" as const, origin: "x", path: "/orcamento" }),
    );
    const out = simulateAlertRules(events, [{ ...baseRule, enabled: false }], 2);
    expect(out).toHaveLength(0);
  });
});

describe("buildDailySummaryRange", () => {
  it("produces one row per day per ctaHash with alertsFired count", () => {
    const now = Date.now();
    const today = new Date(now);
    const yesterday = new Date(now - 86_400_000);
    const events: BufferedEvent[] = [
      { ts: now, event: "whatsapp_cta_impression", origin: "x", path: "/o", ctaHash: "abc" },
      { ts: now, event: "whatsapp_cta_click", origin: "x", path: "/o", ctaHash: "abc" },
      { ts: now, event: "whatsapp_cta_sent", origin: "x", path: "/o", ctaHash: "abc" },
    ];
    const rows = buildDailySummaryRange(events, [], yesterday, today);
    // 2 days — yesterday has no rows (placeholder "—"), today has 1 cta hash
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const todayRows = rows.filter((r) => r.ctaHash === "abc");
    expect(todayRows).toHaveLength(1);
    expect(todayRows[0].clicks).toBe(1);
    expect(todayRows[0].sends).toBe(1);
  });
});
