import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IntegrationStatusPill } from "./IntegrationStatusPill";
import type { IntegrationItem } from "@/data/integracoes-catalog";
import { ExternalLink, RefreshCw, Settings2, PlugZap, ActivitySquare } from "lucide-react";

export function IntegrationCard({ item }: { item: IntegrationItem }) {
  const Icon = item.icon;
  const isConnected = item.state === "conectado" || item.state === "atencao" || item.state === "erro";
  const detailTo = `/core/integracoes/${item.group}/${item.slug}` as unknown as never;

  return (
    <Card className="flex h-full flex-col p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold text-foreground">{item.name}</h3>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <IntegrationStatusPill state={item.state} />
        {item.lastSync && (
          <span className="text-[11px] text-muted-foreground">Última sincronização: {item.lastSync}</span>
        )}
      </div>

      <div className="mt-auto pt-4 flex flex-wrap gap-2">
        {!isConnected && (
          <Button asChild size="sm" className="gap-1.5">
            <Link to={detailTo} search={{ wizard: 1 } as never}>
              <PlugZap className="h-4 w-4" /> Conectar
            </Link>
          </Button>
        )}
        {isConnected && (
          <>
            <Button asChild size="sm" variant="secondary" className="gap-1.5">
              <Link to={detailTo}>
                <Settings2 className="h-4 w-4" /> Configurar
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to={detailTo} search={{ tab: "diagnostico" } as never}>
                <ActivitySquare className="h-4 w-4" /> Testar
              </Link>
            </Button>
          </>
        )}
        {item.state === "erro" && (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={detailTo} search={{ wizard: 1 } as never}>
              <RefreshCw className="h-4 w-4" /> Reconectar
            </Link>
          </Button>
        )}
        <Button size="sm" variant="ghost" className="gap-1.5" asChild>
          <a href={item.docsUrl ?? "#"} target="_blank" rel="noreferrer noopener">
            <ExternalLink className="h-4 w-4" /> Documentação
          </a>
        </Button>
      </div>
    </Card>
  );
}
