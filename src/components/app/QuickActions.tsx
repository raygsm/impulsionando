import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  UserPlus,
  Users,
  User,
  CalendarPlus,
  ShoppingCart,
  Package,
  Receipt,
  Building2,
  FileText,
  Mail,
  Briefcase,
  Ticket,
  Megaphone,
  Send,
  Layers,
  Workflow,
  Sparkles,
  Bike,
  Home,
  Stethoscope,
  Heart,
  Handshake,
  Percent,
  Bell,
  LifeBuoy,
  Gauge,
  Puzzle,
  ClipboardList,
  Crown,
  Store,
  BadgeCheck,
  Trophy,
  HelpCircle,
  Sprout,
  Radio,
  MessagesSquare,
  Truck,
} from "lucide-react";

/**
 * Command Palette "+ Novo" — hub operacional único de criação.
 * Atalho: N (rápido) · Ctrl/⌘ + K (busca).
 *
 * FRONT-END ONLY: cada ação leva à rota de gestão correspondente onde a
 * criação real acontece. Itens sem tela dedicada ainda ficam marcados com
 * "em breve" e não navegam — a integração real fica a cargo do Codex.
 */

type Action = {
  id: string;
  label: string;
  hint?: string;
  to?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

const ACTIONS: Action[] = [
  // ─── CRM & Relacionamento ────────────────────────────────────
  { id: "lead", label: "Novo lead", hint: "CRM", to: "/crm/leads", group: "CRM & Relacionamento", icon: UserPlus },
  { id: "customer", label: "Novo cliente", to: "/customers", group: "CRM & Relacionamento", icon: Users },
  { id: "opportunity", label: "Nova oportunidade", to: "/crm/pipeline", group: "CRM & Relacionamento", icon: Briefcase },
  { id: "ticket", label: "Novo ticket / chamado", to: "/support/tickets", group: "CRM & Relacionamento", icon: LifeBuoy },
  { id: "appointment", label: "Novo agendamento", to: "/agenda/appointments", group: "CRM & Relacionamento", icon: CalendarPlus },

  // ─── Vendas & Financeiro ─────────────────────────────────────
  { id: "sale", label: "Nova venda (PDV)", to: "/sales/new", group: "Vendas & Financeiro", icon: ShoppingCart },
  { id: "order", label: "Novo pedido", to: "/sales/orders", group: "Vendas & Financeiro", icon: Receipt },
  { id: "transaction", label: "Novo lançamento financeiro", to: "/finance/transactions", group: "Vendas & Financeiro", icon: FileText },
  { id: "voucher", label: "Novo voucher / cupom", to: "/marketing/vouchers", group: "Vendas & Financeiro", icon: Ticket, soon: true },

  // ─── Catálogo & Estoque ──────────────────────────────────────
  { id: "product", label: "Novo produto", to: "/inventory/products", group: "Catálogo & Estoque", icon: Package },
  { id: "service", label: "Novo serviço", to: "/catalog/services", group: "Catálogo & Estoque", icon: Sparkles, soon: true },
  { id: "plan", label: "Novo plano", to: "/billing/plans", group: "Catálogo & Estoque", icon: Crown, soon: true },
  { id: "module", label: "Novo módulo", to: "/admin/modules", group: "Catálogo & Estoque", icon: Puzzle, soon: true },

  // ─── Marketing & Automação ───────────────────────────────────
  { id: "campaign", label: "Nova campanha", to: "/marketing/campaigns", group: "Marketing & Automação", icon: Megaphone },
  { id: "message", label: "Nova mensagem / disparo", to: "/marketing/messaging", group: "Marketing & Automação", icon: Send, soon: true },
  { id: "template", label: "Novo template", to: "/marketing/templates", group: "Marketing & Automação", icon: Layers, soon: true },
  { id: "workflow", label: "Nova automação / workflow", to: "/automation/workflows", group: "Marketing & Automação", icon: Workflow, soon: true },
  { id: "marketing-lead", label: "Novo lead de marketing", to: "/marketing/leads", group: "Marketing & Automação", icon: Mail },
  { id: "broadcast", label: "Novo broadcast", to: "/messaging/broadcast", group: "Marketing & Automação", icon: Radio, soon: true },

  // ─── Pessoas & Acesso ────────────────────────────────────────
  { id: "user", label: "Novo usuário", to: "/settings/users", group: "Pessoas & Acesso", icon: User },
  { id: "employee", label: "Novo funcionário", to: "/hr/employees", group: "Pessoas & Acesso", icon: Users, soon: true },
  { id: "role", label: "Novo perfil de acesso", to: "/access-profiles", group: "Pessoas & Acesso", icon: BadgeCheck },
  { id: "partner", label: "Novo parceiro", to: "/partners", group: "Pessoas & Acesso", icon: Handshake, soon: true },
  { id: "affiliate", label: "Novo afiliado", to: "/affiliates", group: "Pessoas & Acesso", icon: Percent, soon: true },

  // ─── Tenants & Estrutura ─────────────────────────────────────
  { id: "company", label: "Nova empresa", to: "/companies", group: "Tenants & Estrutura", icon: Building2 },
  { id: "tenant", label: "Novo tenant", to: "/admin/tenants", group: "Tenants & Estrutura", icon: Store, soon: true },
  { id: "white-label", label: "Novo White Label", to: "/white-label/parceiro", group: "Tenants & Estrutura", icon: Crown },
  { id: "niche", label: "Novo nicho", to: "/admin/nichos", group: "Tenants & Estrutura", icon: Sprout, soon: true },
  { id: "dashboard", label: "Novo dashboard", to: "/dashboards", group: "Tenants & Estrutura", icon: Gauge, soon: true },

  // ─── Verticais especializadas ────────────────────────────────
  { id: "property", label: "Novo imóvel", to: "/real-estate/properties", group: "Verticais", icon: Home, soon: true },
  { id: "doctor", label: "Novo médico", to: "/health/doctors", group: "Verticais", icon: Stethoscope, soon: true },
  { id: "patient", label: "Novo paciente", to: "/health/patients", group: "Verticais", icon: Heart, soon: true },
  { id: "event", label: "Novo evento", to: "/events", group: "Verticais", icon: CalendarPlus, soon: true },
  { id: "raffle", label: "Novo sorteio", to: "/marketing/raffles", group: "Verticais", icon: Trophy, soon: true },
  { id: "quiz", label: "Novo quiz", to: "/marketing/quizzes", group: "Verticais", icon: HelpCircle, soon: true },
  { id: "job", label: "Nova vaga", to: "/hr/jobs", group: "Verticais", icon: ClipboardList, soon: true },
  { id: "delivery", label: "Novo delivery", to: "/delivery", group: "Verticais", icon: Bike, soon: true },
  { id: "courier", label: "Novo motoboy / ciclista", to: "/delivery/couriers", group: "Verticais", icon: Truck, soon: true },
  { id: "project", label: "Novo projeto", to: "/projects", group: "Verticais", icon: Briefcase, soon: true },
  { id: "notification", label: "Nova notificação interna", to: "/notifications", group: "Verticais", icon: Bell, soon: true },
  { id: "chat", label: "Nova conversa", to: "/inbox", group: "Verticais", icon: MessagesSquare, soon: true },
];

const GROUPS_ORDER = [
  "CRM & Relacionamento",
  "Vendas & Financeiro",
  "Catálogo & Estoque",
  "Marketing & Automação",
  "Pessoas & Acesso",
  "Tenants & Estrutura",
  "Verticais",
];

const OPEN_EVENT = "impulsionando:quick-actions:open";

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      // ⌘K / Ctrl+K — sempre abre, mesmo digitando
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (isTyping) return;
      // N — atalho rápido fora de inputs
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  function go(a: Action) {
    if (a.soon || !a.to) return;
    setOpen(false);
    navigate({ to: a.to as never });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar o que você quer criar…  (⌘K · N)" />
      <CommandList className="max-h-[70vh]">
        <CommandEmpty>Nenhuma ação encontrada.</CommandEmpty>
        {GROUPS_ORDER.map((g, idx) => {
          const items = ACTIONS.filter((a) => a.group === g);
          if (!items.length) return null;
          return (
            <div key={g}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={g}>
                {items.map((a) => {
                  const Icon = a.icon;
                  return (
                    <CommandItem
                      key={a.id}
                      value={`${a.label} ${a.group} ${a.hint ?? ""}`}
                      onSelect={() => go(a)}
                      disabled={a.soon}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4 shrink-0 text-primary" />
                      <span className="flex-1 truncate">{a.label}</span>
                      {a.hint && !a.soon && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {a.hint}
                        </span>
                      )}
                      {a.soon && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          em breve
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
      <div className="border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" /> Hub de criação · Ecossistema Impulsionando
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1 py-0.5">⌘K</kbd>
          <kbd className="rounded bg-muted px-1 py-0.5">N</kbd>
          <kbd className="rounded bg-muted px-1 py-0.5">Esc</kbd>
        </span>
      </div>
    </CommandDialog>
  );
}

/**
 * Botão trigger no Topbar. Emite um custom event para abrir a palette
 * (evita acoplar estado global). Visual "vivo" com btn-alive.
 */
export function QuickActionsButton() {
  return (
    <button
      type="button"
      onClick={() => document.dispatchEvent(new CustomEvent(OPEN_EVENT))}
      aria-label="Abrir hub de criação (atalho N ou Ctrl+K)"
      title="Novo — hub de criação (N · ⌘K)"
      className="btn-alive hidden sm:inline-flex items-center gap-1.5 rounded-md bg-gradient-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-base leading-none">+</span>
      <span>Novo</span>
      <kbd className="ml-1 rounded bg-white/20 px-1 py-0.5 text-[10px] font-medium">⌘K</kbd>
    </button>
  );
}
