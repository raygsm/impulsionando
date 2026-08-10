export const CHRISMED_HOST = "chrismed.impulsionando.com.br";

const PUBLIC_ROUTE_ROOTS = new Set([
  "agendar",
  "app",
  "checkout",
  "clinica",
  "consultorio",
  "contato",
  "domiciliar",
  "dra-cristiane",
  "especialidades",
  "eventos",
  "exames",
  "faq",
  "internacional",
  "medicos",
  "minha-conta",
  "ocupacional",
  "ofertas",
  "privacidade",
  "teleconsulta",
  "termos",
]);

export function isOfficialChrismedHost(hostname: string): boolean {
  return hostname.toLowerCase().split(":")[0] === CHRISMED_HOST;
}

export function toChrismedInternalPathname(hostname: string, pathname: string): string {
  if (!isOfficialChrismedHost(hostname)) return pathname;
  if (pathname === "/" || pathname === "") return "/chrismed";
  if (pathname === "/chrismed" || pathname.startsWith("/chrismed/")) return pathname;

  const routeRoot = pathname.split("/")[1];
  return routeRoot && PUBLIC_ROUTE_ROOTS.has(routeRoot) ? `/chrismed${pathname}` : pathname;
}

export function toChrismedPublicPathname(hostname: string, pathname: string): string {
  if (!isOfficialChrismedHost(hostname)) return pathname;
  if (pathname === "/chrismed" || pathname === "/chrismed/") return "/";
  return pathname.startsWith("/chrismed/") ? pathname.slice("/chrismed".length) : pathname;
}
