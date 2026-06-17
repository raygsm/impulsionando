import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";
import { TOP_ITEMS, NAV_GROUPS } from "./nav-config";

interface Crumb {
  label: string;
  to: string;
}

function buildLabelIndex(): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const it of TOP_ITEMS) idx[it.to] = it.label;
  for (const g of NAV_GROUPS) for (const it of g.items) idx[it.to] = it.label;
  return idx;
}

const LABEL_INDEX = buildLabelIndex();

const SEGMENT_LABELS: Record<string, string> = {
  cockpit: "Cockpit",
  cockpits: "Cockpits",
  new: "Novo",
  edit: "Editar",
  matrix: "Matriz",
  board: "Kanban",
  leads: "Leads",
  cash: "Caixa",
  orders: "Pedidos",
  products: "Produtos",
  movements: "Movimentações",
  categories: "Categorias",
  suppliers: "Fornecedores",
  pipelines: "Funis",
  activities: "Atividades",
  appointments: "Agendamentos",
  professionals: "Profissionais",
  services: "Serviços",
  schedules: "Horários",
  waitlist: "Fila de espera",
  accounts: "Contas",
  transactions: "Lançamentos",
  methods: "Métodos",
  commissions: "Comissões",
  reports: "Relatórios",
  master: "Master",
  niches: "Nichos",
  company: "Empresa",
  units: "Unidades",
  sectors: "Setores",
  users: "Usuários",
  corporate: "Corporativo",
  permissions: "Permissões",
  profiles: "Perfis",
  settings: "Configurações",
  privacy: "Privacidade",
  audit: "Auditoria",
  customers: "Clientes",
  affiliates: "Afiliados",
  notifications: "Notificações",
  marketing: "Marketing",
  crm: "CRM",
  sales: "Vendas",
  inventory: "Estoque",
  finance: "Financeiro",
  agenda: "Agenda",
  ehr: "Prontuário",
  support: "Suporte",
  consumer: "Consumidor",
  unified: "Unificado",
  "white-label": "White Label",
  realestate: "Imobiliária",
  imobiliaria: "Imobiliária",
  vitrine: "Vitrine",
  imoveis: "Imóveis",
  interessados: "Interessados",
  mensagens: "Mensagens",
  intencoes: "Buscas salvas",
  matches: "Matches",
  modulos: "Módulos",
  bi: "BI",
  insights: "Insights",
  oportunidades: "Oportunidades",
  respostas: "Respostas",
  admin: "Admin",
  adm: "Central Adm",
  agentes: "Agentes",
  trials: "Trials",
  billing: "Billing",
  "billing-contracts": "Contratos",
  "billing-policy": "Régua",
  clonagem: "Clonagem",
  talents: "Talentos",
  onboarding: "Onboarding",
  "minha-assinatura": "Minha Assinatura",
  dashboard: "Dashboard",
  planos: "Planos",
  "access-profiles": "Perfis de acesso",
  companies: "Empresas",
  "webhook-log": "Webhooks",
};

function humanize(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = useMemo<Crumb[]>(() => {
    if (pathname === "/" || pathname === "/dashboard") return [];
    const parts = pathname.split("/").filter(Boolean);
    const acc: Crumb[] = [];
    let cur = "";
    for (const p of parts) {
      cur += `/${p}`;
      const label = LABEL_INDEX[cur] ?? humanize(p);
      acc.push({ label, to: cur });
    }
    return acc;
  }, [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-6 lg:px-8 pt-3 -mb-2">
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <li>
          <Link to="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home className="size-3.5" />
          </Link>
        </li>
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.to} className="flex items-center gap-1.5">
              <ChevronRight className="size-3 opacity-50" />
              {last ? (
                <span className="text-foreground font-medium">{c.label}</span>
              ) : (
                <Link to={c.to} className="hover:text-foreground transition-colors">{c.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
