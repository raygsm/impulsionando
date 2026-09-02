import { z } from "zod";
import { TenantContextSchema } from "./branding";

export const TenantMembershipRoleSchema = z.string().min(1);
export type TenantMembershipRole = z.infer<typeof TenantMembershipRoleSchema>;

export const TenantMembershipSchema = z.object({
  companyId: z.string().uuid(),
  roles: z.array(TenantMembershipRoleSchema).min(1),
});
export type TenantMembership = z.infer<typeof TenantMembershipSchema>;

export const ActiveTenantContextSchema = z.object({
  tenant: TenantContextSchema,
  membership: TenantMembershipSchema,
  host: z.string().min(1),
});
export type ActiveTenantContext = z.infer<typeof ActiveTenantContextSchema>;

export const TenantMembershipDenyCodeSchema = z.enum([
  "TENANT_NOT_FOUND",
  "NO_MEMBERSHIP",
  "TENANT_MISMATCH",
]);
export type TenantMembershipDenyCode = z.infer<typeof TenantMembershipDenyCodeSchema>;

export type ResolveActiveTenantInput = {
  hostTenantId: string | null;
  memberships: TenantMembership[];
};

export type ResolveActiveTenantResult =
  | { ok: true; activeTenantId: string; membership: TenantMembership }
  | { ok: false; code: TenantMembershipDenyCode };

/**
 * Pure host ∩ membership intersection (CONTRACT-TENANT-IDENTITY §3.2).
 * Deny by default when host does not resolve or user has no matching membership.
 */
export function resolveActiveTenant(
  input: ResolveActiveTenantInput,
): ResolveActiveTenantResult {
  const { hostTenantId, memberships } = input;

  if (!hostTenantId) {
    return { ok: false, code: "TENANT_NOT_FOUND" };
  }

  const match = memberships.find((m) => m.companyId === hostTenantId);
  if (!match) {
    if (memberships.length === 0) {
      return { ok: false, code: "NO_MEMBERSHIP" };
    }
    return { ok: false, code: "TENANT_MISMATCH" };
  }

  return { ok: true, activeTenantId: match.companyId, membership: match };
}
