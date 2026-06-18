import { useNavigate } from "@tanstack/react-router";
import { Search, LogOut, ArrowRight, User, Building2, UserPlus, Handshake } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentUser } from "@/lib/auth";
import { useActiveCompany } from "@/hooks/use-active-company";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationsBell } from "./NotificationsBell";
import { OnboardingStatusPill } from "./OnboardingStatusPill";
import { AppearanceMenu } from "./AppearanceMenu";
import { QuickActionsButton } from "./QuickActions";
import { AudienceBadge } from "./AudienceBadge";
import { globalEntitySearch, type GlobalEntityHit } from "@/lib/core-consumidores.functions";

type NavItem = { label: string; to: string; group: string; keywords?: string };


const NAV: NavItem[] = [
  { group: "Geral", label: "Dashboard", to: "/dashboard" },
  { group: "Geral", label: "Empresas", to: "/companies" },
  { group: "Geral", label: "Unidades", to: "/units" },
  { group: "Geral", label: "Setores", to: "/sectors" },
  { group: "Geral", label: "Usuários", to: "/users" },
  { group: "Geral", label: "Perfis de acesso", to: "/access-profiles", keywords: "permissoes" },
  { group: "Geral", label: "Permissões", to: "/permissions" },
  { group: "Geral", label: "Módulos", to: "/modules" },
  { group: "Geral", label: "Nichos", to: "/niches" },
  { group: "Geral", label: "Configurações", to: "/settings" },
  { group: "CRM", label: "CRM — Visão geral", to: "/crm" },
  { group: "CRM", label: "Leads", to: "/crm/leads" },
  { group: "CRM", label: "Pipelines", to: "/crm/pipelines" },
  { group: "CRM", label: "Board (Kanban)", to: "/crm/board" },
  { group: "CRM", label: "Atividades", to: "/crm/activities" },
  { group: "CRM", label: "Leads marketing", to: "/marketing/leads" },
  { group: "Clientes", label: "Clientes", to: "/customers" },
  { group: "Agenda", label: "Agenda", to: "/agenda" },
  { group: "Agenda", label: "Agendamentos", to: "/agenda/appointments" },
  { group: "Agenda", label: "Profissionais", to: "/agenda/professionals" },
  { group: "Agenda", label: "Serviços", to: "/agenda/services" },
  { group: "Agenda", label: "Horários", to: "/agenda/schedules" },
  { group: "Agenda", label: "Lista de espera", to: "/agenda/waitlist" },
  { group: "Vendas", label: "Vendas", to: "/sales" },
  { group: "Vendas", label: "Pedidos", to: "/sales/orders" },
  { group: "Vendas", label: "Nova venda (PDV)", to: "/sales/new" },
  { group: "Vendas", label: "Caixa", to: "/sales/cash" },
  { group: "Estoque", label: "Produtos", to: "/inventory/products" },
  { group: "Estoque", label: "Categorias", to: "/inventory/categories" },
  { group: "Estoque", label: "Movimentações", to: "/inventory/movements" },
  { group: "Estoque", label: "Fornecedores", to: "/inventory/suppliers" },
  { group: "Financeiro", label: "Contas", to: "/finance/accounts" },
  { group: "Financeiro", label: "Categorias", to: "/finance/categories" },
  { group: "Financeiro", label: "Lançamentos", to: "/finance/transactions" },
  { group: "Financeiro", label: "Métodos de pagamento", to: "/finance/methods" },
  { group: "Financeiro", label: "Comissões", to: "/finance/commissions" },
  { group: "BI", label: "BI — Visão geral", to: "/bi" },
  { group: "BI", label: "BI Empresa", to: "/bi/company" },
  { group: "BI", label: "BI Master", to: "/bi/master" },
  { group: "BI", label: "BI Nichos", to: "/bi/niches" },
  { group: "Relatórios", label: "Relatórios", to: "/reports" },
  { group: "Relatórios", label: "Vendas", to: "/reports/sales" },
  { group: "Relatórios", label: "CRM", to: "/reports/crm" },
  { group: "Relatórios", label: "Agenda", to: "/reports/agenda" },
  { group: "Relatórios", label: "Financeiro", to: "/reports/finance" },
  { group: "Relatórios", label: "Estoque", to: "/reports/inventory" },
  { group: "Outros", label: "Talentos / RH", to: "/talents" },
  { group: "Outros", label: "Auditoria", to: "/audit" },
  { group: "Outros", label: "Privacidade / LGPD", to: "/privacy" },
];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function Topbar({ currentUser }: { currentUser: CurrentUser }) {
  const navigate = useNavigate();
  const { companyId } = useActiveCompany();
  // Identidade do usuário logado (auth.user), nunca a empresa
  const metaName =
    (currentUser.user.user_metadata as { display_name?: string; full_name?: string } | null)?.display_name ??
    (currentUser.user.user_metadata as { display_name?: string; full_name?: string } | null)?.full_name ??
    null;
  // Membership da empresa ativa (para mostrar o cargo correto naquele contexto)
  const activeMembership =
    currentUser.memberships.find((m) => m.company_id === companyId) ?? currentUser.memberships[0];
  const name = metaName ?? activeMembership?.display_name ?? currentUser.user.email ?? "Usuário";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = activeMembership?.profiles?.name ?? "Usuário";

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const runSearch = useServerFn(globalEntitySearch);

  // Debounce the entity search call to avoid hammering the server on each keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);

  const navResults = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return NAV.filter((n) =>
      normalize(`${n.label} ${n.group} ${n.keywords ?? ""}`).includes(q),
    ).slice(0, 6);
  }, [query]);

  const entityQuery = useQuery({
    queryKey: ["global-entity-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: () => runSearch({ data: { q: debounced } }).catch(() => ({ hits: [] as GlobalEntityHit[] })),
    staleTime: 30_000,
  });

  // Flatten into a single list so arrow-keys work across entities + nav items.
  type Row =
    | { kind: "entity"; hit: GlobalEntityHit }
    | { kind: "nav"; item: NavItem };
  const rows: Row[] = useMemo(() => {
    const entities = (entityQuery.data?.hits ?? []).map<Row>((hit) => ({ kind: "entity", hit }));
    const nav = navResults.map<Row>((item) => ({ kind: "nav", item }));
    return [...entities, ...nav];
  }, [entityQuery.data, navResults]);

  useEffect(() => setActiveIdx(0), [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  function go(to: string) {
    setOpen(false);
    setQuery("");
    navigate({ to });
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const ENTITY_ICON: Record<GlobalEntityHit["type"], typeof User> = {
    consumidor: User,
    empresa: Building2,
    lead: UserPlus,
    afiliado: Handshake,
    usuario: User,
  };
  const ENTITY_LABEL: Record<GlobalEntityHit["type"], string> = {
    consumidor: "Consumidor",
    empresa: "Empresa",
    lead: "Lead",
    afiliado: "Afiliado",
    usuario: "Usuário",
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10 flex items-center px-4 lg:px-6 gap-3 lg:gap-4">
      <MobileSidebar currentUser={currentUser} />
      <div ref={containerRef} className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || rows.length === 0) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, rows.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter") {
              e.preventDefault();
              const r = rows[activeIdx];
              if (r.kind === "entity") go(r.hit.to);
              else go(r.item.to);
            }
            else if (e.key === "Escape") { setOpen(false); }
          }}
          placeholder="Buscar pessoa, empresa, lead ou tela…"
          className="pl-9 bg-background"
        />
        {open && query && (
          <div className="absolute left-0 right-0 mt-2 rounded-md border border-border bg-popover shadow-lg overflow-hidden z-50">
            {rows.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                {entityQuery.isFetching ? "Buscando…" : `Nenhum resultado para "${query}"`}
              </div>
            ) : (
              <ul className="max-h-96 overflow-auto py-1">
                {rows.map((r, i) => {
                  const active = i === activeIdx;
                  if (r.kind === "entity") {
                    const Icon = ENTITY_ICON[r.hit.type];
                    return (
                      <li key={`e-${r.hit.type}-${r.hit.id}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => go(r.hit.to)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                        >
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium truncate">{r.hit.label}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {ENTITY_LABEL[r.hit.type]}{r.hit.sublabel ? ` · ${r.hit.sublabel}` : ""}
                            </span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={`n-${r.item.to}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => go(r.item.to)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">{r.item.label}</span>
                          <span className="text-xs text-muted-foreground">{r.item.group} · {r.item.to}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <AudienceBadge />
        <QuickActionsButton />
        <OnboardingStatusPill companyId={currentUser.memberships?.[0]?.company_id} />
        <AppearanceMenu />
        <NotificationsBell userId={currentUser.user.id} />
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium leading-tight">{name}</div>
          <div className="text-xs text-muted-foreground leading-tight">{roleLabel}</div>
        </div>
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={logout} title="Sair" aria-label="Sair da conta">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
