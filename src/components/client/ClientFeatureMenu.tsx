// Menu completo de funcionalidades do plano contratado. Cada item é um link
// real e funcional para a página de gestão do recurso. Quando o módulo
// correspondente não está habilitado, o item aparece "bloqueado" indicando
// upgrade necessário — nunca é escondido (transparência de plano).
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight, Layers } from "lucide-react";
import type { FeatureGroup } from "@/lib/tenant-features";

export interface ClientFeatureMenuProps {
  groups: FeatureGroup[];
  enabledModules: Set<string>;
  /** Quando true, esconde itens bloqueados em vez de exibi-los com cadeado. */
  hideLocked?: boolean;
}

export function ClientFeatureMenu({ groups, enabledModules, hideLocked = false }: ClientFeatureMenuProps) {
  if (!groups.length) return null;
  const totalItems = groups.reduce((a, g) => a + g.items.length, 0);
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (!it.module) return true;
        if (enabledModules.has(it.module)) return true;
        return !hideLocked;
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Recursos do seu plano
          </CardTitle>
          <Badge variant="outline" className="text-[11px]">
            {totalItems} ferramentas disponíveis
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {visibleGroups.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum recurso disponível no seu plano atual.{" "}
            <Link to="/planos" className="text-primary underline underline-offset-2">
              Ver planos
            </Link>{" "}
            para liberar novas ferramentas.
          </div>
        )}
        {visibleGroups.map((group) => (
          <section key={group.category}>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              {group.category}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((it) => {
                const locked = !!it.module && !enabledModules.has(it.module);
                const Icon = it.icon;
                const inner = (
                  <div
                    className={
                      "group flex items-start gap-3 rounded-lg border p-3 transition-all " +
                      (locked
                        ? "border-dashed opacity-60 bg-muted/30"
                        : "hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm")
                    }
                  >
                    <div
                      className={
                        "shrink-0 h-9 w-9 rounded-md grid place-items-center " +
                        (locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")
                      }
                    >
                      {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{it.label}</span>
                        {!locked && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      {it.description && (
                        <p className="text-[11px] text-muted-foreground leading-snug truncate">
                          {it.description}
                        </p>
                      )}
                      {locked && (
                        <p className="text-[10px] uppercase tracking-wider text-amber-700 mt-0.5">
                          Upgrade necessário
                        </p>
                      )}
                    </div>
                  </div>
                );
                if (locked) {
                  return (
                    <Link
                      key={it.to}
                      to="/planos"
                      title="Faça upgrade para liberar este recurso"
                      aria-label={`${it.label} — upgrade necessário, abrir planos`}
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <Link key={it.to} to={it.to as any}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
