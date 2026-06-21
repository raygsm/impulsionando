import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { TOP_ITEMS, NAV_GROUPS, type NavItem } from "./nav-config";
import { useFavorites } from "@/hooks/use-favorites";
import { useRecentPages } from "@/hooks/use-recent-pages";
import { Star, Clock } from "lucide-react";

type Entry = NavItem & { group: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const recent = useRecentPages();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const entries = useMemo<(Entry & { to: string })[]>(() => {
    const top = TOP_ITEMS.filter((i) => i.to).map((i) => ({ ...i, to: i.to!, group: "Geral" }));
    const rest = NAV_GROUPS.flatMap((g) =>
      g.items.flatMap((i) => {
        const out: (Entry & { to: string })[] = [];
        if (i.to) out.push({ ...i, to: i.to, group: g.label });
        if (i.children) for (const c of i.children) if (c.to) out.push({ ...c, to: c.to, group: g.label });
        return out;
      })
    );
    return [...top, ...rest];
  }, []);

  const cockpits = entries.filter((e) => e.to.includes("/cockpit") || e.to === "/cockpits");
  const others = entries.filter((e) => !cockpits.includes(e));
  const grouped = others.reduce<Record<string, (Entry & { to: string })[]>>((acc, e) => {
    (acc[e.group] ||= []).push(e);
    return acc;
  }, {});

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, cockpits, módulos…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        {favorites.length > 0 && (
          <>
            <CommandGroup heading="Favoritos">
              {favorites.map((f) => (
                <CommandItem key={`fav-${f.to}`} value={`favorito ${f.label} ${f.to}`} onSelect={() => go(f.to)}>
                  <Star className="mr-2 size-4 fill-amber-400 text-amber-400" />
                  <span>{f.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{f.to}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        {recent.length > 0 && (
          <>
            <CommandGroup heading="Recentes">
              {recent.slice(0, 6).map((r) => (
                <CommandItem key={`rec-${r.to}`} value={`recente ${r.label} ${r.to}`} onSelect={() => go(r.to)}>
                  <Clock className="mr-2 size-4 text-muted-foreground" />
                  <span>{r.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{r.to}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        {cockpits.length > 0 && (
          <>
            <CommandGroup heading="Cockpits & KPIs">
              {cockpits.map((e) => {
                const Icon = e.icon;
                return (
                  <CommandItem key={e.to} value={`${e.label} ${e.to}`} onSelect={() => go(e.to)}>
                    <Icon className="mr-2 size-4" />
                    <span>{e.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{e.to}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        {Object.entries(grouped).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((e) => {
              const Icon = e.icon;
              return (
                <CommandItem key={e.to} value={`${e.label} ${e.to} ${group}`} onSelect={() => go(e.to)}>
                  <Icon className="mr-2 size-4" />
                  <span>{e.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{e.to}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
