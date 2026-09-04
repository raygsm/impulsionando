"use client";

import type { AgentSummary } from "@impulsionando/contracts";
import { InternalAgentDock } from "@/components/agents/internal-agent-dock";

export function AgentChatBridge({ tenantId, agent }: { tenantId: string; agent: AgentSummary }) {
  async function onSend(message: string) {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, tenantId }),
    });
    const json = (await res.json()) as {
      data?: { message?: string; answer?: string | null; refused?: boolean; code?: string; riskClass?: string };
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(json.error?.message || `HTTP ${res.status}`);
    }
    const data = json.data;
    return {
      text: data?.answer || data?.message || (data?.refused ? data.code || "Recusado" : "Sem texto"),
      riskClass: data?.riskClass,
      refused: data?.refused,
    };
  }

  return <InternalAgentDock agent={agent} onSend={agent.available ? onSend : undefined} />;
}
