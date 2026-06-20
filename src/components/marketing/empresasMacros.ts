/**
 * Arquitetura nova do menu "Empresas".
 *
 * Macrocategorias primeiro, subnichos depois. Cada macro tem uma mensagem
 * curta, uma lista canônica de subnichos exibidos como chips e ações
 * ("Ver demonstração" + "Conhecer solução"). Os subnichos linkam para a
 * página do nicho correspondente quando existe; quando não existe, caem
 * em /escolher-nicho para iniciar a jornada.
 *
 * Esta lista é a fonte da verdade para o header público; nichos não devem
 * aparecer soltos em outros menus.
 */
import {
  Stethoscope,
  Briefcase,
  Store,
  GraduationCap,
  Ticket,
  Factory,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type EmpresasItem = {
  label: string;
  /** Slug em /nichos/$slug, quando existe. */
  nichoSlug?: string;
  /** Rota alternativa quando não há nicho dedicado (ex.: /chrismed/ocupacional). */
  to?: string;
};

export type EmpresasMacro = {
  slug: string;
  label: string;
  icon: LucideIcon;
  message: string;
  benefits: string[];
  examples: string;
  modules: string[];
  items: EmpresasItem[];
  /** Destino principal do CTA "Conhecer solução". */
  solutionTo: string;
  /** Destino do CTA "Ver demonstração". */
  demoTo: string;
  /** Indica destaque visual (White Label). */
  highlight?: boolean;
};

export const EMPRESAS_MACROS: EmpresasMacro[] = [
  {
    slug: "saude",
    label: "Saúde",
    icon: Stethoscope,
    message:
      "Soluções para profissionais e empresas da área da saúde: atendimento, prontuário, agenda, CRM, teleconsulta e relacionamento.",
    benefits: [
      "Prontuário eletrônico e agenda integrada",
      "Teleconsulta, domiciliar e presencial",
      "CRM clínico e jornada do paciente",
    ],
    examples: "CrisMed, clínicas multiprofissionais, academias e estúdios.",
    modules: ["Agenda", "Prontuário", "Teleconsulta", "CRM", "Financeiro"],
    items: [
      { label: "Clínicas Médicas", nichoSlug: "clinicas" },
      { label: "Médicos", nichoSlug: "clinicas" },
      { label: "Psicólogos", nichoSlug: "psicologia" },
      { label: "Psicologia", nichoSlug: "psicologia" },
      { label: "Terapeutas", nichoSlug: "psicologia" },
      { label: "Fisioterapeutas", nichoSlug: "saude" },
      { label: "Nutricionistas", nichoSlug: "saude" },
      { label: "Fonoaudiólogos", nichoSlug: "saude" },
      { label: "Dentistas", nichoSlug: "saude" },
      { label: "Profissionais da Saúde", nichoSlug: "saude" },
      { label: "Medicina Ocupacional", to: "/chrismed/ocupacional" },
      { label: "Fitness", nichoSlug: "fitness" },
      { label: "Academias", nichoSlug: "fitness" },
      { label: "Estúdios", nichoSlug: "fitness" },
      { label: "Personal Trainer", nichoSlug: "fitness" },
    ],
    solutionTo: "/nichos/saude",
    demoTo: "/demo",
  },
  {
    slug: "servicos",
    label: "Serviços",
    icon: Briefcase,
    message:
      "Automação, CRM, agenda, financeiro, atendimento e relacionamento para empresas de serviços.",
    benefits: [
      "Agenda, contratos e cobrança recorrente",
      "Portal do cliente e propostas digitais",
      "Marketplace B2B para fornecedores",
    ],
    examples: "Imobiliárias, escritórios jurídicos, contábeis, hotelaria e A&B.",
    modules: ["CRM", "Contratos", "Financeiro", "Agenda", "Portal do Cliente"],
    items: [
      { label: "Imobiliárias", nichoSlug: "imobiliaria" },
      { label: "Corretores", nichoSlug: "imobiliaria" },
      { label: "Escritórios Contábeis", nichoSlug: "contabilidade" },
      { label: "Escritórios Jurídicos", nichoSlug: "juridico" },
      { label: "Advogados", nichoSlug: "juridico" },
      { label: "Consultorias", nichoSlug: "servicos" },
      { label: "Prestadores de Serviço", nichoSlug: "servicos" },
      { label: "Fornecedores", nichoSlug: "fornecedores" },
      { label: "Distribuidores", nichoSlug: "fornecedores" },
      { label: "Microcervejarias", nichoSlug: "microcervejarias" },
      { label: "Bares", nichoSlug: "bares-restaurantes" },
      { label: "Restaurantes", nichoSlug: "bares-restaurantes" },
      { label: "Hotéis", to: "/escolher-nicho" },
      { label: "Pousadas", to: "/escolher-nicho" },
      { label: "Turismo", to: "/escolher-nicho" },
      { label: "Airbnb", to: "/escolher-nicho" },
      { label: "Gestão de Temporada", to: "/escolher-nicho" },
    ],
    solutionTo: "/nichos/servicos",
    demoTo: "/demo",
  },
  {
    slug: "comercio",
    label: "Comércio",
    icon: Store,
    message:
      "PDV, estoque, CRM, vendas, marketplace e gestão comercial para varejo, atacado e e-commerce.",
    benefits: [
      "PDV omnichannel com estoque unificado",
      "CRM de vendas e pós-venda",
      "Catálogo digital e marketplace B2B",
    ],
    examples: "Lojas físicas, e-commerce, autopeças, concessionárias e revendas.",
    modules: ["PDV", "Estoque", "CRM", "E-commerce", "Marketplace"],
    items: [
      { label: "Lojas", nichoSlug: "ecommerce" },
      { label: "Varejo", nichoSlug: "ecommerce" },
      { label: "Atacado", nichoSlug: "fornecedores" },
      { label: "Material de Construção", nichoSlug: "ecommerce" },
      { label: "Farmácias", nichoSlug: "ecommerce" },
      { label: "Autopeças", nichoSlug: "veiculos" },
      { label: "Veículos", nichoSlug: "veiculos" },
      { label: "Concessionárias", nichoSlug: "veiculos" },
      { label: "Revendas", nichoSlug: "veiculos" },
      { label: "Distribuição Comercial", nichoSlug: "fornecedores" },
      { label: "E-commerce", nichoSlug: "ecommerce" },
    ],
    solutionTo: "/nichos/ecommerce",
    demoTo: "/demo",
  },
  {
    slug: "educacao",
    label: "Educação",
    icon: GraduationCap,
    message:
      "Captação, matrículas, retenção, CRM acadêmico e relacionamento para instituições e educadores.",
    benefits: [
      "Captação de leads e matrícula digital",
      "Portal do aluno e gestão de polos",
      "CRM acadêmico e cobrança recorrente",
    ],
    examples: "Escolas, faculdades, cursos livres, mentores e infoprodutores.",
    modules: ["CRM Acadêmico", "Matrículas", "Financeiro", "Portal do Aluno"],
    items: [
      { label: "Escolas", nichoSlug: "educacao" },
      { label: "Cursos", nichoSlug: "educacao" },
      { label: "Treinamentos", nichoSlug: "educacao" },
      { label: "Faculdades", nichoSlug: "educacao" },
      { label: "Polos Educacionais", nichoSlug: "educacao" },
      { label: "Professores", nichoSlug: "educacao" },
      { label: "Mentores", nichoSlug: "educacao" },
      { label: "Infoprodutores", nichoSlug: "educacao" },
    ],
    solutionTo: "/nichos/educacao",
    demoTo: "/demo",
  },
  {
    slug: "entretenimento",
    label: "Entretenimento",
    icon: Ticket,
    message:
      "Venda de ingressos, QR Code, credenciamento, afiliados e gestão de público para eventos e experiências.",
    benefits: [
      "Venda de ingressos com QR Code",
      "Credenciamento e check-in",
      "Programa de afiliados e produtores",
    ],
    examples: "Casas de show, festivais, congressos, feiras e produtores.",
    modules: ["Ingressos", "Check-in", "Afiliados", "CRM"],
    items: [
      { label: "Eventos", nichoSlug: "eventos" },
      { label: "Casas de Show", nichoSlug: "eventos" },
      { label: "Festivais", nichoSlug: "eventos" },
      { label: "Produtores de Eventos", nichoSlug: "eventos" },
      { label: "Congressos", nichoSlug: "eventos" },
      { label: "Feiras", nichoSlug: "eventos" },
      { label: "Casas Noturnas", nichoSlug: "eventos" },
    ],
    solutionTo: "/nichos/eventos",
    demoTo: "/demo",
  },
  {
    slug: "industria",
    label: "Indústria",
    icon: Factory,
    message:
      "Processos, relacionamento, automação e inteligência operacional para indústrias e cadeias logísticas.",
    benefits: [
      "Marketplace B2B para distribuição",
      "Pedidos, propostas e CRM industrial",
      "Integrações com ERPs e logística",
    ],
    examples: "Fábricas, distribuidoras, indústria de bebidas e alimentos.",
    modules: ["Marketplace B2B", "Pedidos", "CRM", "Integrações"],
    items: [
      { label: "Indústrias", nichoSlug: "fornecedores" },
      { label: "Fábricas", nichoSlug: "fornecedores" },
      { label: "Produção", nichoSlug: "fornecedores" },
      { label: "Logística", nichoSlug: "fornecedores" },
      { label: "Distribuição Industrial", nichoSlug: "fornecedores" },
    ],
    solutionTo: "/nichos/fornecedores",
    demoTo: "/demo",
  },
  {
    slug: "white-label",
    label: "White Label",
    icon: Sparkles,
    highlight: true,
    message:
      "Crie sua própria plataforma SaaS, com sua marca, domínio, planos, clientes e faturamento.",
    benefits: [
      "Marca, domínio e identidade próprios",
      "Planos, clientes e faturamento sob seu controle",
      "Infra, atualizações e suporte por nossa conta",
    ],
    examples: "Agências, integradores, consultorias e revendedores.",
    modules: ["Marca", "Domínio", "Planos", "Faturamento", "Multi-tenant"],
    items: [
      { label: "Agências SaaS", to: "/white-label" },
      { label: "Integradores", to: "/white-label" },
      { label: "Revendedores", to: "/white-label" },
      { label: "Consultorias", to: "/white-label" },
    ],
    solutionTo: "/white-label",
    demoTo: "/demo",
  },
];
