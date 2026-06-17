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
  CalendarPlus,
  ShoppingCart,
  Package,
  Receipt,
  Building2,
  FileText,
  Mail,
} from "lucide-react";

type Action = {
  id: string;
  label: string;
  hint?: string;
  to: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ACTIONS: Action[] = [
  { id: "lead", label: "Novo lead", hint: "CRM", to: "/crm/leads", group: "CRM", icon: UserPlus },
  { id: "customer", label: "Novo cliente", to: "/customers", group: "CRM", icon: Users },
  { id: "appointment", label: "Novo agendamento", to: "/agenda/appointments", group: "Agenda", icon: CalendarPlus },
  { id: "sale", label: "Nova venda (PDV)", to: "/sales/new", group: "Vendas", icon: ShoppingCart },
  { id: "order", label: "Novo pedido", to: "/sales/orders", group: "Vendas", icon: Receipt },
  { id: "product", label: "Novo produto", to: "/inventory/products", group: "Estoque", icon: Package },
  { id: "company", label: "Nova empresa", to: "/companies", group: "Cadastros", icon: Building2 },
  { id: "transaction", label: "Novo lançamento financeiro", to: "/finance/transactions", group: "Financeiro", icon: FileText },
  { id: "marketing-lead", label: "Novo lead de marketing", to: "/marketing/leads", group: "Marketing", icon: Mail },
];

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
      if (isTyping) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const groups = Array.from(new Set(ACTIONS.map((a) => a.group)));

  function go(to: string) {
    setOpen(false);
    navigate({ to: to as never });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar ação rápida... (atalho: N)" />
      <CommandList>
        <CommandEmpty>Nenhuma ação encontrada.</CommandEmpty>
        {groups.map((g, idx) => (
          <div key={g}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={g}>
              {ACTIONS.filter((a) => a.group === g).map((a) => {
                const Icon = a.icon;
                return (
                  <CommandItem key={a.id} onSelect={() => go(a.to)}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{a.label}</span>
                    {a.hint && <span className="ml-auto text-xs text-muted-foreground">{a.hint}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function QuickActionsButton() {
  // Opens the same dialog by simulating the N key
  return (
    <button
      type="button"
      onClick={() => {
        const ev = new KeyboardEvent("keydown", { key: "n" });
        document.dispatchEvent(ev);
      }}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
      title="Ações rápidas (N)"
    >
      <span className="text-primary">+</span> Novo
      <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">N</kbd>
    </button>
  );
}
