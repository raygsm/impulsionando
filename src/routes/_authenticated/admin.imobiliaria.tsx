import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  LayoutDashboard, Kanban, Flame, Shuffle, Home, FileSignature, FileText,
  CheckSquare, CalendarDays, UserCog, Trophy, Users, Lock,
  User, Landmark, Building2, Inbox, Megaphone,
  BookOpen, Banknote, DollarSign, TrendingUp, Handshake,
  MessageSquare, Smartphone, Radio, Mail, Send,
  Zap, GitBranch, BarChart3, Calculator, Sparkles,
  Building, Key, ScrollText, ShieldCheck, FlaskConical, Plug, Settings,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/imobiliaria")({
  head: () => ({
    meta: [{ title: "Admin Imobiliária — Impulsionando" }],
  }),
  component: AdminImobiliariaHub,
});

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  status: "ok" | "partial" | "missing";
  note?: string;
};

type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Visão Geral",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/realestate/cockpit", status: "ok" },
      { label: "CRM Kanban", icon: Kanban, to: "/crm/board", status: "partial", note: "Kanban genérico — falta visão imobiliária" },
    ],
  },
  {
    title: "Comercial",
    items: [
      { label: "Leads", icon: Flame, to: "/crm/leads", status: "ok" },
      { label: "Distribuição", icon: Shuffle, to: "/imobiliaria/distribuicao", status: "ok", note: "Regras de atribuição (round-robin, equipe, bairro)" },
      { label: "Visitas", icon: Home, to: "/agenda/appointments", status: "partial", note: "Usa agenda genérica" },
      { label: "Propostas", icon: FileSignature, to: "/imobiliaria/aprovacoes", status: "ok" },
      { label: "Contratos", icon: FileText, to: "/imobiliaria/aprovacoes/imprimir-fila", status: "partial", note: "Fila de impressão; falta gestão de contrato" },
      { label: "Tarefas & Follow-ups", icon: CheckSquare, to: "/crm/activities", status: "partial", note: "Atividades genéricas do CRM" },
      { label: "Agenda", icon: CalendarDays, to: "/agenda", status: "ok" },
    ],
  },
  {
    title: "Equipe",
    items: [
      { label: "Corretores", icon: UserCog, to: "/agenda/professionals", status: "partial", note: "Cadastro como profissional" },
      { label: "Equipes", icon: Trophy, status: "missing", note: "Agrupamento de corretores + metas" },
      { label: "Usuários", icon: Users, to: "/access-profiles", status: "ok" },
      { label: "Permissões", icon: Lock, to: "/access-profiles/matrix", status: "ok" },
    ],
  },
  {
    title: "Pessoas",
    items: [
      { label: "Clientes", icon: User, to: "/imobiliaria/interessados", status: "ok" },
      { label: "Proprietários", icon: Landmark, to: "/imobiliaria/proprietarios", status: "ok" },
    ],
  },
  {
    title: "Acervo",
    items: [
      { label: "Imóveis", icon: Building2, to: "/imobiliaria/imoveis", status: "ok" },
      { label: "Captação", icon: Inbox, to: "/imobiliaria/intencoes", status: "ok" },
      { label: "Anúncios & Campanhas", icon: Megaphone, to: "/imobiliaria/campanhas", status: "ok" },
    ],
  },
  {
    title: "Documental",
    items: [
      { label: "Documentação", icon: BookOpen, status: "missing", note: "Biblioteca de documentos do imóvel/cliente" },
      { label: "Financiamento", icon: Banknote, status: "missing", note: "Simulador + pipeline bancário" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Comissões", icon: DollarSign, to: "/finance/commissions", status: "ok" },
      { label: "Financeiro", icon: TrendingUp, to: "/finance/cockpit", status: "ok" },
    ],
  },
  {
    title: "Captação",
    items: [
      { label: "Afiliados Imobiliários", icon: Handshake, to: "/affiliates", status: "ok" },
    ],
  },
  {
    title: "Comunicação",
    items: [
      { label: "Mensagens & Interações", icon: MessageSquare, to: "/imobiliaria/mensagens", status: "ok" },
      { label: "WhatsApp Corretores", icon: Smartphone, status: "missing", note: "Console WhatsApp por corretor" },
      { label: "Logs WhatsApp", icon: Radio, to: "/admin/whatsapp-metrics", status: "partial", note: "Métricas globais (não por corretor)" },
      { label: "Templates", icon: Mail, to: "/core/templates", status: "ok" },
      { label: "E-mails (fila & métricas)", icon: Send, status: "missing", note: "Dashboard email_send_log" },
    ],
  },
  {
    title: "Operação",
    items: [
      { label: "Automações", icon: Zap, to: "/automacoes", status: "ok" },
      { label: "Funis & Etapas", icon: GitBranch, to: "/crm/pipelines", status: "ok" },
    ],
  },
  {
    title: "Inteligência",
    items: [
      { label: "Relatórios", icon: BarChart3, to: "/bi", status: "ok" },
      { label: "Relatório Contador", icon: Calculator, status: "missing", note: "Exportação fiscal para contador" },
      { label: "BI Executivo", icon: Sparkles, to: "/bi/company", status: "ok" },
    ],
  },
  {
    title: "Portais",
    items: [
      { label: "Portal Proprietário", icon: Building, to: "/imobiliaria/proprietarios", status: "ok", note: "Acesso por link único — copiar no cadastro do proprietário" },
      { label: "Portal Cliente", icon: Key, status: "missing", note: "Portal externo do cliente" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Logs & Auditoria", icon: ScrollText, to: "/audit", status: "ok" },
      { label: "Auditoria de Integrações", icon: ShieldCheck, to: "/core/integracoes/diagnostico", status: "ok" },
      { label: "Validação de Fluxo", icon: FlaskConical, status: "missing", note: "Smoke-test guiado do funil completo" },
      { label: "Integrações", icon: Plug, to: "/core/integracoes/n8n", status: "ok" },
      { label: "Configurações", icon: Settings, to: "/core/configuracoes", status: "ok" },
    ],
  },
];

function statusChip(s: Item["status"]) {
  if (s === "ok") return <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">Ativo</span>;
  if (s === "partial") return <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">Parcial</span>;
  return <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 bg-rose-100 rounded px-1.5 py-0.5">Em construção</span>;
}

function AdminImobiliariaHub() {
  const stats = useMemo(() => {
    const all = GROUPS.flatMap(g => g.items);
    return {
      total: all.length,
      ok: all.filter(i => i.status === "ok").length,
      partial: all.filter(i => i.status === "partial").length,
      missing: all.filter(i => i.status === "missing").length,
    };
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Admin Imobiliária</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hub unificado de gestão. Cada card abre a tela real ou marca o módulo pendente.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-md bg-muted px-3 py-1">Total: <b>{stats.total}</b></span>
          <span className="rounded-md bg-emerald-100 text-emerald-800 px-3 py-1">Ativos: <b>{stats.ok}</b></span>
          <span className="rounded-md bg-amber-100 text-amber-800 px-3 py-1">Parciais: <b>{stats.partial}</b></span>
          <span className="rounded-md bg-rose-100 text-rose-800 px-3 py-1">Pendentes: <b>{stats.missing}</b></span>
        </div>
      </header>

      <div className="space-y-8">
        {GROUPS.map(group => (
          <section key={group.title}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{group.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map(item => {
                const Icon = item.icon;
                const body = (
                  <div className="h-full rounded-lg border bg-card hover:bg-accent/40 transition p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {statusChip(item.status)}
                    </div>
                    {item.note && (
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    )}
                  </div>
                );
                if (item.to && item.status !== "missing") {
                  return (
                    <Link key={item.label} to={item.to} className="block">
                      {body}
                    </Link>
                  );
                }
                return (
                  <div key={item.label} className="opacity-80 cursor-not-allowed" aria-disabled>
                    {body}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-10 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <b className="text-foreground">Política Impulsionando:</b> tenant Garrido herda auth, RBAC, RLS,
          billing e branding do core. Itens marcados como <i>Pendente</i> exigem migrations + RLS antes de
          serem entregues — nada é ligado vazio.
        </p>
      </footer>
    </div>
  );
}
