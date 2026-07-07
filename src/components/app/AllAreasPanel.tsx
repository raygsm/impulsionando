import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { NAVIGATION_AREAS, type Area } from "./navigation-areas";

/**
 * Painel "Todas as Áreas" — a resposta única à pergunta
 * "onde eu vejo todos os recursos do Core?".
 *
 * Camada 100% visual: apenas monta cards com Links do TanStack Router
 * para rotas já existentes. Nenhuma regra de negócio, permissão ou
 * dado sensível é tratada aqui — os gates existentes (RLS, has_role,
 * BillingGate, PlanGate) continuam sendo a fonte de verdade quando o
 * usuário navegar até a rota.
 */
export function AllAreasPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className="space-y-4" aria-labelledby="todas-as-areas-titulo">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2
            id="todas-as-areas-titulo"
            className="text-xl font-semibold tracking-tight"
          >
            Todas as áreas
          </h2>
          <p className="text-sm text-muted-foreground">
            Todos os recursos do Core Impulsionando organizados em 11 áreas
            empresariais. Um clique leva você ao recurso.
          </p>
        </div>
      </header>

      <div
        className={
          compact
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {NAVIGATION_AREAS.map((area) => (
          <AreaCard key={area.key} area={area} />
        ))}
      </div>
    </section>
  );
}

function AreaCard({ area }: { area: Area }) {
  const Icon = area.icon;
  return (
    <Card className="p-4 flex flex-col gap-3 border-border/60 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold leading-tight">{area.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {area.description}
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-1">
        {area.links.map((link) => (
          <li key={`${area.key}:${link.label}:${link.to}`}>
            <Link
              to={link.to}
              className="block text-sm rounded-md px-2 py-1 -mx-2 text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
