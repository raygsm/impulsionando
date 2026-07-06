/**
 * Taxonomia visual do menu "Nichos" — Ecossistema Impulsionando.
 *
 * Escopo: APENAS estrutura visual/UX. Não altera banco, rotas, RLS,
 * regras de negócio ou permissões. Rotas aqui referenciadas são as
 * mesmas já registradas em `nav-config.tsx`; itens sem `to` aparecem
 * como "Em breve" (desabilitados).
 */
import {
  HeartPulse, Utensils, ShoppingBag, Wrench, GraduationCap, Palmtree,
  Sparkles, Ticket, Factory, Cpu, TreePine, Car, Home, Scale, Banknote,
  PawPrint, Shirt, Trophy, BedDouble, MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface NichoSub {
  label: string;
  to?: string;
}

export interface NichoMicro {
  label: string;
  to?: string;
  subs?: NichoSub[];
}

export interface NichoMacro {
  slug: string;
  label: string;
  icon: LucideIcon;
  micros: NichoMicro[];
}

export const NICHOS_MACROS: NichoMacro[] = [
  {
    slug: "saude",
    label: "Saúde",
    icon: HeartPulse,
    micros: [
      {
        label: "Clínicas",
        subs: [
          { label: "Clínica Médica" },
          { label: "Clínica de Gastro" },
          { label: "Clínica de Ortopedia" },
          { label: "Clínica Estética" },
        ],
      },
      { label: "Consultórios" },
      { label: "Médicos", to: "/ehr" },
      { label: "Dentistas" },
      { label: "Psicólogos" },
      { label: "Fisioterapia" },
      { label: "Laboratórios" },
      { label: "Home Care" },
      { label: "Hospitais" },
      { label: "ChrisMed — Admin", to: "/chrismed/admin" },
    ],
  },
  {
    slug: "alimentacao",
    label: "Alimentação",
    icon: Utensils,
    micros: [
      {
        label: "Restaurantes",
        to: "/showroom/restaurante",
        subs: [
          { label: "Japonês" },
          { label: "Italiano" },
          { label: "Churrascaria" },
          { label: "Árabe" },
        ],
      },
      { label: "Bares", to: "/bar/marketplace" },
      { label: "Hamburguerias" },
      { label: "Pizzarias" },
      { label: "Cafeterias" },
      { label: "Padarias" },
      { label: "Delivery" },
      { label: "Adegas" },
      { label: "Microcervejaria", to: "/cervejaria" },
    ],
  },
  {
    slug: "comercio",
    label: "Comércio",
    icon: ShoppingBag,
    micros: [
      { label: "Lojas", to: "/sales" },
      { label: "Autopeças" },
      { label: "Materiais Elétricos" },
      { label: "Materiais de Construção" },
      { label: "Farmácias" },
      { label: "Pet Shops" },
      { label: "Estoque", to: "/inventory" },
    ],
  },
  {
    slug: "servicos",
    label: "Serviços",
    icon: Wrench,
    micros: [
      { label: "Imobiliárias", to: "/imobiliaria/vitrine" },
      { label: "Escritórios" },
      { label: "Contabilidade", to: "/contabilidade/cockpit" },
      { label: "Advocacia" },
      { label: "Marketing" },
      { label: "Consultorias" },
      { label: "Assistência Técnica" },
      { label: "Agenda de Serviços", to: "/agenda/services" },
    ],
  },
  {
    slug: "educacao",
    label: "Educação",
    icon: GraduationCap,
    micros: [
      { label: "Escolas" },
      { label: "Cursos Livres" },
      { label: "Idiomas" },
      { label: "Reforço Escolar" },
      { label: "EAD / Plataformas" },
      { label: "Banco de Talentos", to: "/talents" },
    ],
  },
  {
    slug: "turismo",
    label: "Turismo",
    icon: Palmtree,
    micros: [
      { label: "Agências" },
      { label: "Passeios & Tours" },
      { label: "Receptivo" },
      { label: "Aluguel por Temporada" },
    ],
  },
  {
    slug: "beleza",
    label: "Beleza",
    icon: Sparkles,
    micros: [
      { label: "Salões" },
      { label: "Barbearias" },
      { label: "Estética" },
      { label: "Manicure & Pedicure" },
      { label: "Spa" },
    ],
  },
  {
    slug: "eventos",
    label: "Eventos",
    icon: Ticket,
    micros: [
      { label: "Casas de Show" },
      { label: "Produtoras" },
      { label: "Buffets" },
      { label: "Cerimoniais" },
      { label: "Ticketing" },
    ],
  },
  {
    slug: "industria",
    label: "Indústria",
    icon: Factory,
    micros: [
      { label: "Fornecedores B2B", to: "/core/marketplace/fornecedores" },
      { label: "Distribuidoras" },
      { label: "Fábricas" },
      { label: "Compras (Inventory)", to: "/inventory/suppliers" },
    ],
  },
  {
    slug: "tecnologia",
    label: "Tecnologia",
    icon: Cpu,
    micros: [
      { label: "Software" },
      { label: "SaaS" },
      { label: "IA" },
      { label: "Telecom" },
      { label: "Desenvolvimento" },
    ],
  },
  {
    slug: "agronegocio",
    label: "Agronegócio",
    icon: TreePine,
    micros: [
      { label: "Produtores Rurais" },
      { label: "Cooperativas" },
      { label: "Insumos" },
      { label: "Máquinas Agrícolas" },
    ],
  },
  {
    slug: "automotivo",
    label: "Automotivo",
    icon: Car,
    micros: [
      { label: "Concessionárias" },
      { label: "Oficinas" },
      { label: "Lava-Rápido" },
      { label: "Estética Automotiva" },
      { label: "Locadoras" },
    ],
  },
  {
    slug: "imobiliario",
    label: "Imobiliário",
    icon: Home,
    micros: [
      { label: "Vitrine", to: "/imobiliaria/vitrine" },
      { label: "Cockpit", to: "/realestate/cockpit" },
      { label: "Imóveis", to: "/imobiliaria/imoveis" },
      { label: "Interessados", to: "/imobiliaria/interessados" },
      { label: "Matches", to: "/imobiliaria/matches" },
      { label: "Campanhas", to: "/imobiliaria/campanhas" },
      { label: "Corretores Parceiros", to: "/imobiliaria/parceiros" },
    ],
  },
  {
    slug: "juridico",
    label: "Jurídico",
    icon: Scale,
    micros: [
      { label: "Escritórios de Advocacia" },
      { label: "Cartórios" },
      { label: "Cockpit Contábil", to: "/contabilidade/cockpit" },
    ],
  },
  {
    slug: "financeiro",
    label: "Financeiro",
    icon: Banknote,
    micros: [
      { label: "Corretoras" },
      { label: "Consultoria Financeira" },
      { label: "Cobrança & Recuperação" },
      { label: "Fintechs" },
    ],
  },
  {
    slug: "pet",
    label: "Pet",
    icon: PawPrint,
    micros: [
      { label: "Pet Shops" },
      { label: "Clínicas Veterinárias" },
      { label: "Banho & Tosa" },
      { label: "Hotel para Pets" },
    ],
  },
  {
    slug: "moda",
    label: "Moda",
    icon: Shirt,
    micros: [
      { label: "Boutiques" },
      { label: "Confecções" },
      { label: "Calçados" },
      { label: "Acessórios" },
    ],
  },
  {
    slug: "esportes",
    label: "Esportes",
    icon: Trophy,
    micros: [
      { label: "Academias" },
      { label: "Studios / CrossFit" },
      { label: "Escolinhas Esportivas" },
      { label: "Lojas de Suplementos" },
    ],
  },
  {
    slug: "hotelaria",
    label: "Hotelaria",
    icon: BedDouble,
    micros: [
      { label: "Hotéis" },
      { label: "Pousadas" },
      { label: "Hostels" },
      { label: "Resorts" },
    ],
  },
  {
    slug: "outros",
    label: "Outros",
    icon: MoreHorizontal,
    micros: [
      { label: "Setor não listado" },
    ],
  },
];
