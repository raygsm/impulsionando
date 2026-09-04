import { createApiClient, aiApi, opsApi, supportApi, tenantsApi } from "@impulsionando/api-client";
import { appWebEnv } from "@/lib/config/env";

export function nestClient(accessToken?: string | null) {
  const env = appWebEnv();
  const client = createApiClient({
    baseUrl: env.nestApiBase,
    getAccessToken: () => accessToken ?? null,
  });
  return {
    client,
    tenants: tenantsApi(client),
    support: supportApi(client),
    ai: aiApi(client),
    ops: opsApi(client),
  };
}
