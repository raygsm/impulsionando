export const GRUPO_EVR_HOST = "grupoevr.impulsionando.com.br";

const PUBLIC_ROUTE_ROOTS = new Set([
  "agendar",
  "ativese-pharma",
  "autoridades",
  "contato",
  "dr-responde",
  "gestao",
  "instituto",
  "privacidade",
  "termos",
]);

export function isOfficialGrupoEvrHost(hostname: string): boolean {
  return hostname.toLowerCase().split(":")[0] === GRUPO_EVR_HOST;
}

export function toGrupoEvrInternalPathname(hostname: string, pathname: string): string {
  if (!isOfficialGrupoEvrHost(hostname)) return pathname;
  if (pathname === "/" || pathname === "") return "/grupo-evr";
  if (pathname === "/grupo-evr" || pathname.startsWith("/grupo-evr/")) return pathname;

  const routeRoot = pathname.split("/")[1];
  return routeRoot && PUBLIC_ROUTE_ROOTS.has(routeRoot) ? `/grupo-evr${pathname}` : pathname;
}

export function toGrupoEvrPublicPathname(hostname: string, pathname: string): string {
  if (!isOfficialGrupoEvrHost(hostname)) return pathname;
  if (pathname === "/grupo-evr" || pathname === "/grupo-evr/") return "/";
  return pathname.startsWith("/grupo-evr/") ? pathname.slice("/grupo-evr".length) : pathname;
}
