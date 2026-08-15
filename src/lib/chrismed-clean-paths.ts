export const CHRISMED_HOST = "chrismed.impulsionando.com.br";

const PUBLIC_ROUTE_ROOTS = new Set([
  "agendar",
  "admin",
  "app",
  "atendimentos",
  "checkout",
  "clinica",
  "consultorio",
  "contato",
  "cupons",
  "domiciliar",
  "dra-cristiane",
  "especialidades",
  "evento-convite",
  "evento-credencial",
  "eventos",
  "exames",
  "faq",
  "integracoes",
  "internacional",
  "medicos",
  "minha-conta",
  "ocupacional",
  "ofertas",
  "privacidade",
  "profissional",
  "protocolos",
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
