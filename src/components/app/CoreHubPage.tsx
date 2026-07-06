import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/PageElements";
import { IntegrationBadge, type IntegrationStatus } from "@/components/app/IntegrationBadge";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface HubItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  status: IntegrationStatus;
}

/**
 * Página-hub reutilizável para os macros do Core (Tenants, Estúdio Visual,
 * Nichos, Comercial, Administração etc.). Só front-end: renderiza uma grid
 * de cartões que apontam para as sub-telas + IntegrationBadge de status.
 */
export function CoreHubPage({
  title,
  description,
  items,
  intro,
}: {
  title: string;
  description: string;
  intro?: React.ReactNode;
  items: HubItem[];
}) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />
      {intro && <div className="text-sm text-muted-foreground">{intro}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to as never}
              className="group block"
            >
              <Card className="h-full p-4 transition hover:border-primary/60 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-foreground">{it.label}</h3>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {it.description}
                    </p>
                    <div className="mt-2">
                      <IntegrationBadge status={it.status} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
