/**
 * Catálogo estático de páginas públicas por tenant, usado na tela de
 * homologação para gerar o checklist visual + links diretos.
 *
 * Apenas dados de UI — não altera rotas, dados ou regras. Cada `to` já é
 * uma rota real registrada em `src/routes/`.
 */

export interface TenantPublicPage {
  to: string;
  label: string;
  purpose?: string;
}

export interface TenantHomologacaoManifest {
  slug: string;
  name: string;
  brandColor: string;
  expectedDomain: string;
  pages: TenantPublicPage[];
}

export const TENANT_HOMOLOGACAO: Record<string, TenantHomologacaoManifest> = {
  chrismed: {
    slug: "chrismed",
    name: "ChrisMed",
    brandColor: "hsl(200 90% 45%)",
    expectedDomain: "chrismed.com.br",
    pages: [
      { to: "/chrismed", label: "Landing principal", purpose: "Home institucional" },
      { to: "/chrismed/dra-cristiane", label: "Dra. Cristiane", purpose: "Perfil profissional" },
      { to: "/chrismed/clinica", label: "Clínica", purpose: "Estrutura clínica" },
      { to: "/chrismed/consultorio", label: "Consultório", purpose: "Atendimento presencial" },
      { to: "/chrismed/domiciliar", label: "Atendimento Domiciliar" },
      { to: "/chrismed/ocupacional", label: "Medicina Ocupacional" },
      { to: "/chrismed/teleconsulta", label: "Teleconsulta" },
      { to: "/chrismed/internacional", label: "Atendimento Internacional" },
      { to: "/chrismed/medicos", label: "Corpo Clínico" },
      { to: "/chrismed/ofertas", label: "Ofertas & Convênios" },
      { to: "/chrismed/agendar", label: "Agendamento" },
      { to: "/chrismed/contato", label: "Contato" },
    ],
  },
  riomed: {
    slug: "riomed",
    name: "RioMed",
    brandColor: "hsl(150 60% 40%)",
    expectedDomain: "riomed.com.bo",
    pages: [
      { to: "/riomed", label: "Landing principal" },
      { to: "/riomed/productos", label: "Productos" },
      { to: "/riomed/hospitales", label: "Hospitales", purpose: "Vitrine B2B" },
      { to: "/riomed/pacientes", label: "Pacientes" },
      { to: "/riomed/alquiler", label: "Alquiler de Equipamentos" },
      { to: "/riomed/servicio-tecnico", label: "Servicio Técnico" },
      { to: "/riomed/soporte", label: "Suporte" },
      { to: "/riomed/cotizar", label: "Cotizar" },
      { to: "/riomed/vendedor", label: "Portal do Vendedor" },
      { to: "/riomed/hospital/portal", label: "Portal Hospitalar" },
      { to: "/riomed/fornecedor/cadastro", label: "Cadastro de Fornecedor" },
      { to: "/riomed/tecnico/cadastro", label: "Cadastro de Técnico" },
      { to: "/riomed/vendedores/cadastro", label: "Cadastro de Vendedor" },
      { to: "/riomed/trabalhe-conosco", label: "Trabalhe Conosco" },
    ],
  },
};

export function listHomologacaoTenants(): TenantHomologacaoManifest[] {
  return Object.values(TENANT_HOMOLOGACAO);
}
