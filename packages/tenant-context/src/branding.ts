import { z } from "zod";

/** Public tenant branding context from `resolve_tenant_by_host` RPC. */
export const TenantContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  subdomain: z.string().nullable(),
  domain: z.string().nullable(),
  primary_color: z.string().nullable(),
  secondary_color: z.string().nullable(),
  logo_url: z.string().nullable(),
  is_active: z.boolean(),
});
export type TenantContext = z.infer<typeof TenantContextSchema>;

export const TenantResolveQuerySchema = z
  .object({
    host: z.string().trim().min(1).max(253),
  })
  .strict();
export type TenantResolveQuery = z.infer<typeof TenantResolveQuerySchema>;
