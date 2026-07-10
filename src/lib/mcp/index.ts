import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listPublicNichesTool from "./tools/list-public-niches";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud proxy).
// VITE_SUPABASE_PROJECT_ID is inlined at build time by Vite.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "impulsionando-mcp",
  title: "Impulsionando",
  version: "0.1.0",
  instructions:
    "Ferramentas do ecossistema Impulsionando. Use `echo` para validar a conexão e `list_public_niches` para listar as páginas públicas de nichos do site.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, listPublicNichesTool],
});
