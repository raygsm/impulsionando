import { COLORS_CANONICAL_HOST, WMP_CANONICAL_HOST } from "./subdomain";

/**
 * Tenants that ship their own concierge. Impulsionito must not mount beside them.
 */
export const CLIENT_AGENT_HOSTS = new Set([
  "anamadu.impulsionando.com.br",
  "chrismed.impulsionando.com.br",
  COLORS_CANONICAL_HOST,
  WMP_CANONICAL_HOST,
  "riomed.impulsionando.com.br",
  "marocas.impulsionando.com.br",
  "csi.impulsionando.com.br",
]);

const CLIENT_AGENT_PATH_PREFIXES = [
  "/anamadu",
  "/chrismed",
  "/colors",
  "/wmp",
  "/marocas",
  "/riomed",
  "/csi",
] as const;

export function hasDedicatedClientAgent(host: string, pathname: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  if (CLIENT_AGENT_HOSTS.has(h)) return true;
  return CLIENT_AGENT_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
