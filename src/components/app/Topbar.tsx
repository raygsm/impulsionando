import { useNavigate } from "@tanstack/react-router";
import { Search, LogOut, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import type { CurrentUser } from "@/lib/auth";
import { useActiveCompany } from "@/hooks/use-active-company";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationsBell } from "./NotificationsBell";

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
  const name = currentUser.memberships[0]?.display_name ?? currentUser.user.email ?? "Usuário";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel = currentUser.memberships[0]?.profiles?.name ?? "Usuário";

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return NAV.filter((n) =>
      normalize(`${n.label} ${n.group} ${n.keywords ?? ""}`).includes(q),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => setActiveIdx(0), [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        containerRef.current?.querySelector("input")?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
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
            if (!open || results.length === 0) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); go(results[activeIdx].to); }
            else if (e.key === "Escape") { setOpen(false); }
          }}
          placeholder="Buscar módulos, telas... (Ctrl/⌘K)"
          className="pl-9 bg-background"
        />
        {open && query && (
          <div className="absolute left-0 right-0 mt-2 rounded-md border border-border bg-popover shadow-lg overflow-hidden z-50">
            {results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">Nenhum resultado para "{query}"</div>
            ) : (
              <ul className="max-h-80 overflow-auto py-1">
                {results.map((r, i) => (
                  <li key={r.to}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => go(r.to)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm ${i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground">{r.group} · {r.to}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
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
