import type {
  SupportTicketCreateBody,
  SupportTicketCreateData,
  SupportTicketListQuery,
  SupportTicketSummary,
  SupportTicketUpdateStatusBody,
  SupportTicketUpdateStatusData,
  TenantConfigV1,
  TenantEntitlementsV1,
  AiCapabilitiesEnvelope,
  AiPolicyEnvelope,
  AiToolsEnvelope,
  AiTenantAgentConfig,
  AiChatRequestBody,
  QueueMetricsEnvelope,
  IntegrationRegistryEnvelope,
} from "@impulsionando/contracts";
import type { ActiveTenantContext } from "@impulsionando/tenant-context";
import type { ImpulsionandoApiClient } from "./client";

export function tenantsApi(client: ImpulsionandoApiClient) {
  return {
    resolve: (host: string) =>
      client.get<unknown>("/api/v1/tenants/resolve", { host }),
    context: (host: string, accessToken?: string | null) =>
      client.get<ActiveTenantContext>("/api/v1/tenants/context", { host }, accessToken),
    config: (tenantId: string, accessToken?: string | null) =>
      client.get<TenantConfigV1>(`/api/v1/tenants/${tenantId}/config`, undefined, accessToken),
    entitlements: (tenantId: string, accessToken?: string | null) =>
      client.get<TenantEntitlementsV1>(
        `/api/v1/tenants/${tenantId}/entitlements`,
        undefined,
        accessToken,
      ),
    flag: (tenantId: string, flagKey: string, accessToken?: string | null) =>
      client.get<{ key: string; value: boolean; known: boolean }>(
        `/api/v1/tenants/${tenantId}/flags/${encodeURIComponent(flagKey)}`,
        undefined,
        accessToken,
      ),
  };
}

export function supportApi(client: ImpulsionandoApiClient) {
  return {
    list: (query?: SupportTicketListQuery, accessToken?: string | null) =>
      client.get<SupportTicketSummary[]>(
        "/api/v1/support/tickets",
        query as Record<string, string | undefined> | undefined,
        accessToken,
      ),
    create: (body: SupportTicketCreateBody, extra?: { idempotencyKey?: string; accessToken?: string | null }) =>
      client.post<SupportTicketCreateData>("/api/v1/support/tickets", body, extra),
    updateStatus: (
      ticketId: string,
      body: SupportTicketUpdateStatusBody,
      extra?: { idempotencyKey?: string; accessToken?: string | null },
    ) =>
      client.patch<SupportTicketUpdateStatusData>(
        `/api/v1/support/tickets/${ticketId}/status`,
        body,
        extra,
      ),
  };
}

export function aiApi(client: ImpulsionandoApiClient) {
  return {
    capabilities: (accessToken?: string | null) =>
      client.get<AiCapabilitiesEnvelope>("/api/v1/ai/capabilities", undefined, accessToken),
    policy: (accessToken?: string | null) =>
      client.get<AiPolicyEnvelope>("/api/v1/ai/policy", undefined, accessToken),
    tools: (accessToken?: string | null) =>
      client.get<AiToolsEnvelope>("/api/v1/ai/tools", undefined, accessToken),
    agent: (tenantId: string, accessToken?: string | null) =>
      client.get<AiTenantAgentConfig>(`/api/v1/ai/agents/${tenantId}`, undefined, accessToken),
    chat: (body: AiChatRequestBody, extra?: { accessToken?: string | null }) =>
      client.post<unknown>("/api/v1/ai/chat", body, extra),
  };
}

export function opsApi(client: ImpulsionandoApiClient) {
  return {
    queueMetrics: (accessToken?: string | null) =>
      client.get<QueueMetricsEnvelope>("/api/v1/ops/queue-metrics", undefined, accessToken),
    integrations: (accessToken?: string | null) =>
      client.get<IntegrationRegistryEnvelope>("/api/v1/ops/integrations", undefined, accessToken),
  };
}
