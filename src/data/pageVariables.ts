// Variáveis suportadas no Criador de Páginas (Fase 4).
// Cada variável é substituída em prompts/textos por dados reais do projeto.
export type PageVariableKey =
  | "nome_cliente"
  | "nome_projeto"
  | "nicho"
  | "cidade"
  | "whatsapp"
  | "email"
  | "modulos"
  | "cta_principal"
  | "dominio"
  | "cor_principal"
  | "servicos"
  | "beneficios"
  | "diferenciais";

export const PAGE_VARIABLES: { key: PageVariableKey; label: string; sample: string }[] = [
  { key: "nome_cliente", label: "Nome do cliente", sample: "Clínica Vida" },
  { key: "nome_projeto", label: "Nome do projeto", sample: "Portal Clínica Vida" },
  { key: "nicho", label: "Nicho", sample: "saude" },
  { key: "cidade", label: "Cidade", sample: "São Paulo" },
  { key: "whatsapp", label: "WhatsApp", sample: "(11) 99999-9999" },
  { key: "email", label: "E-mail", sample: "contato@cliente.com" },
  { key: "modulos", label: "Módulos instalados", sample: "Agenda, CRM" },
  { key: "cta_principal", label: "CTA principal", sample: "Agende agora" },
  { key: "dominio", label: "Domínio", sample: "cliente.com.br" },
  { key: "cor_principal", label: "Cor principal", sample: "#0ea5e9" },
  { key: "servicos", label: "Serviços", sample: "Consultas, Exames" },
  { key: "beneficios", label: "Benefícios", sample: "Atendimento ágil" },
  { key: "diferenciais", label: "Diferenciais", sample: "Equipe especializada" },
];

export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key] ?? "") : `{{${key}}}`,
  );
}
