import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import listPublicNichesTool from "./tools/list-public-niches";

export default defineMcp({
  name: "impulsionando-mcp",
  title: "Impulsionando",
  version: "0.1.0",
  instructions:
    "Ferramentas do ecossistema Impulsionando. Use `echo` para validar a conexão e `list_public_niches` para listar as páginas públicas de nichos do site.",
  tools: [echoTool, listPublicNichesTool],
});
