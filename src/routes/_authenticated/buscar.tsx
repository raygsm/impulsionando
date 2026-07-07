import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Building2, Handshake, Search, User, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/app/PageElements";
import { Input } from "@/components/ui/input";
import { globalEntitySearch, type GlobalEntityHit } from "@/lib/core-consumidores.functions";
import { NAVIGATION_AREAS } from "@/components/app/navigation-areas";

/**
 * /buscar — página dedicada de busca global do Core Impulsionando.
 *
 * Camada puramente presentacional: reaproveita o server function
 * `globalEntitySearch` já usado pelo Topbar (mesma RLS / mesmo escopo)
 * e o mapa de áreas visuais em `navigation-areas.ts` para filtrar telas
 * do sistema por nome. Não altera rotas físicas, dados ou permissões.
 */

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_authenticated/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar — Impulsionando" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content:
          "Busca global do Core Impulsionando: pessoas, empresas, leads, afiliados e telas do sistema em um só lugar.",
      },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: BuscarPage,
});

interface FlatNav {
  label: string;
  to: string;
  area: string;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const FLAT_NAV: FlatNav[] = NAVIGATION_AREAS.flatMap((a) =>
  a.links.map((l) => ({ label: l.label, to: l.to, area: a.label })),
);

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

function BuscarPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/buscar" });
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(q);
  const [debounced, setDebounced] = useState(q);
  const runSearch = useServerFn(globalEntitySearch);

  // Foco automático + sincroniza query da URL com o campo.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setValue(q);
  }, [q]);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(value.trim());
      navigate({ search: (prev) => ({ ...prev, q: value.trim() }), replace: true });
    }, 220);
    return () => clearTimeout(t);
  }, [value, navigate]);

  const navResults = useMemo(() => {
    const term = normalize(debounced);
    if (!term) return [];
    return FLAT_NAV.filter((n) =>
      normalize(`${n.label} ${n.area}`).includes(term),
    ).slice(0, 20);
  }, [debounced]);

  const entityQuery = useQuery({
    queryKey: ["buscar-page", debounced],
    enabled: debounced.length >= 2,
    queryFn: () =>
      runSearch({ data: { q: debounced } }).catch(
        () => ({ hits: [] as GlobalEntityHit[] }),
      ),
    staleTime: 30_000,
  });

  const entities = entityQuery.data?.hits ?? [];
  const hasQuery = debounced.length > 0;
  const isEmpty =
    hasQuery && !entityQuery.isFetching && entities.length === 0 && navResults.length === 0;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <PageHeader
        title="Buscar"
        description="Encontre pessoas, empresas, leads, afiliados e telas do sistema em um único lugar."
      />

      <div className="relative" data-testid="buscar-input-wrapper">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar pessoa, empresa, lead, afiliado ou tela…"
          className="pl-9"
          data-testid="buscar-input"
          aria-label="Campo de busca global"
        />
      </div>

      {!hasQuery && (
        <p className="text-sm text-muted-foreground">
          Digite pelo menos 2 caracteres para buscar entidades. Nomes de telas do
          sistema aparecem a partir de 1 caractere.
        </p>
      )}

      {isEmpty && (
        <p className="text-sm text-muted-foreground" data-testid="buscar-empty">
          Nenhum resultado para <b>&quot;{debounced}&quot;</b>.
        </p>
      )}

      {entities.length > 0 && (
        <section aria-labelledby="buscar-entidades">
          <h2 id="buscar-entidades" className="text-sm font-semibold mb-2">
            Entidades
          </h2>
          <ul className="rounded-md border divide-y" data-testid="buscar-entities">
            {entities.map((hit) => {
              const Icon = ENTITY_ICON[hit.type];
              return (
                <li key={`${hit.type}-${hit.id}`}>
                  <Link
                    to={hit.to}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent/60"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{hit.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {ENTITY_LABEL[hit.type]}
                        {hit.sublabel ? ` · ${hit.sublabel}` : ""}
                      </span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {navResults.length > 0 && (
        <section aria-labelledby="buscar-telas">
          <h2 id="buscar-telas" className="text-sm font-semibold mb-2">
            Telas do sistema
          </h2>
          <ul className="rounded-md border divide-y" data-testid="buscar-nav">
            {navResults.map((n) => (
              <li key={`${n.area}-${n.to}`}>
                <Link
                  to={n.to}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-accent/60"
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{n.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {n.area} · {n.to}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
