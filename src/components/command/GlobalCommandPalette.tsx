import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Building2, Users, Ticket, Workflow, CheckCircle2 } from "lucide-react";
import { globalCommandSearch, type SearchHit } from "@/lib/command-search.functions";

const GROUP_META: Record<SearchHit["group"], { label: string; icon: any }> = {
  clientes: { label: "Clientes", icon: Building2 },
  usuarios: { label: "Usuários", icon: Users },
  tickets: { label: "Tickets", icon: Ticket },
  automacoes: { label: "Automações", icon: Workflow },
  aprovacoes: { label: "Aprovações", icon: CheckCircle2 },
};

export function GlobalCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const runSearch = useServerFn(globalCommandSearch);

  const { data, isFetching } = useQuery({
    queryKey: ["command-search", q],
    queryFn: () => runSearch({ data: { q } }),
    enabled: open && q.trim().length >= 2,
    staleTime: 15_000,
  });

  const hits: SearchHit[] = data ?? [];
  const grouped = hits.reduce<Record<string, SearchHit[]>>((acc, h) => {
    (acc[h.group] ||= []).push(h);
    return acc;
  }, {});

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    navigate({ to: href as any });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar clientes, usuários, tickets, automações…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        {q.trim().length < 2 ? (
          <CommandEmpty>Digite ao menos 2 caracteres.</CommandEmpty>
        ) : isFetching ? (
          <CommandEmpty>Buscando…</CommandEmpty>
        ) : hits.length === 0 ? (
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
        ) : (
          (Object.keys(grouped) as SearchHit["group"][]).map((g) => {
            const meta = GROUP_META[g];
            const Icon = meta.icon;
            return (
              <CommandGroup key={g} heading={meta.label}>
                {grouped[g].map((hit) => (
                  <CommandItem
                    key={`${g}-${hit.id}`}
                    value={`${g}-${hit.id}-${hit.title}`}
                    onSelect={() => go(hit.href)}
                  >
                    <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{hit.title}</span>
                      {hit.subtitle && (
                        <span className="text-xs text-muted-foreground truncate">{hit.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })
        )}
      </CommandList>
    </CommandDialog>
  );
}
