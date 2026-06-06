import {
  Bot,
  Building2,
  Calendar,
  CreditCard,
  Handshake,
  Scale,
  Store,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";


export type DemoModuleRoute =
  | "/demo"
  | "/demo/cliente-final"
  | "/demo/white-label"
  | "/demo/crm"
  | "/demo/agenda"
  | "/demo/whatsapp"
  | "/demo/eventos"
  | "/demo/afiliados"
  | "/demo/parceiros"
  | "/demo/checkout";

export type DemoModuleKey =
  | "home"
  | "cliente-final"
  | "white-label"
  | "crm"
  | "agenda"
  | "automacao"
  | "eventos"
  | "afiliados"
  | "parceiros"
  | "checkout";

export interface DemoModuleOption {
  key: DemoModuleKey;
  label: string;
  description: string;
  route: DemoModuleRoute;
  icon: LucideIcon;
  badge: string;
}

export const DEMO_MODULE_OPTIONS: DemoModuleOption[] = [
  {
    key: "agenda",
    label: "Agenda & Reservas",
    description: "Grade por profissional, serviços, fila de espera, conflitos e lembretes.",
    route: "/demo/agenda",
    icon: Calendar,
    badge: "Operação",
  },
  {
    key: "crm",
    label: "CRM",
    description: "Leads, pipeline, atividades, templates e automações comerciais.",
    route: "/demo/crm",
    icon: Users,
    badge: "Vendas",
  },
  {
    key: "automacao",
    label: "WhatsApp & Comunicação",
    description: "Inbox, templates, campanhas, chatbot e fluxos automatizados.",
    route: "/demo/whatsapp",
    icon: Bot,
    badge: "Atendimento",
  },
  {
    key: "eventos",
    label: "Eventos & Ingressos",
    description: "Eventos, lotes, ingressos nominais, QR Code e check-in.",
    route: "/demo/eventos",
    icon: Ticket,
    badge: "Eventos",
  },
  {
    key: "afiliados",
    label: "Afiliados & Produtos",
    description: "Produtos, ofertas, cupons, split, ranking e comissões.",
    route: "/demo/afiliados",
    icon: Trophy,
    badge: "Crescimento",
  },
  {
    key: "parceiros",
    label: "WMP / Parceiros",
    description: "Parceiros, eventos, contratos, cancelamentos, multas e repasses.",
    route: "/demo/parceiros",
    icon: Handshake,
    badge: "Serviços",
  },
  {
    key: "checkout",
    label: "Checkout & Pagamentos",
    description: "Checkout, Pix, cartão, status de pagamento e comprovantes.",
    route: "/demo/checkout",
    icon: CreditCard,
    badge: "Pagamento",
  },
  {
    key: "cliente-final",
    label: "Cliente Final",
    description: "Operação completa com agenda, CRM, PDV, estoque, financeiro e BI.",
    route: "/demo/cliente-final",
    icon: Store,
    badge: "Completo",
  },
  {
    key: "white-label",
    label: "White-label",
    description: "Painel master para revenda, clientes, módulos, auditoria e marca.",
    route: "/demo/white-label",
    icon: Building2,
    badge: "Revenda",
  },
];
