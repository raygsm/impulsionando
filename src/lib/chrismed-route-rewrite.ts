const CHRISMED_HOST = "chrismed.impulsionando.com.br";

const CHRISMED_PUBLIC_ROUTE_ROOTS = new Set([
  "agendar", "app", "checkout", "clinica", "consultorio", "contato",
  "domiciliar", "dra-cristiane", "especialidades", "eventos", "exames",
  "faq", "internacional", "medicos", "minha-conta", "ocupacional",
  "ofertas", "privacidade", "teleconsulta",
]);

function isChrismedHost(url: URL) {
  return url.hostname.toLowerCase() === CHRISMED_HOST;
}

export function chrismedRouteInput({ url }: { url: URL }): URL | undefined {
  if (!isChrismedHost(url)) return undefined;
  const rewritten = new URL(url);
  if (rewritten.pathname === "/") {
    rewritten.pathname = "/chrismed";
    return rewritten;
  }
  if (rewritten.pathname === "/chrismed" || rewritten.pathname.startsWith("/chrismed/")) {
    return undefined;
  }
  const routeRoot = rewritten.pathname.split("/")[1];
  if (!CHRISMED_PUBLIC_ROUTE_ROOTS.has(routeRoot)) return undefined;
  rewritten.pathname = `/chrismed${rewritten.pathname}`;
  return rewritten;
}

export function chrismedRouteOutput({ url }: { url: URL }): URL | undefined {
  if (!isChrismedHost(url)) return undefined;
  if (url.pathname !== "/chrismed" && !url.pathname.startsWith("/chrismed/")) return undefined;
  const rewritten = new URL(url);
  rewritten.pathname = rewritten.pathname.replace(/^\/chrismed(?=\/|$)/, "") || "/";
  return rewritten;
}

export const chrismedRouteRewrite = {
  input: chrismedRouteInput,
  output: chrismedRouteOutput,
};
