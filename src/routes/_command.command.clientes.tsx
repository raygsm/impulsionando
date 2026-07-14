import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CommandPage } from "@/components/command/CommandPage";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listCommandClientes, type ClienteListItem } from "@/lib/command-clientes.functions";
import { Building2, Users, Activity } from "lucide-react";

type Search = { q?: string; status?: string; env?: string };

export const Route = createFileRoute("/_command/command/clientes")({
  head: () => ({ meta: [{ title: "Clientes · Command" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
    env: typeof s.env === "string" ? s.env : undefined,
  }),
  component: Page,
});

function statusTone(s: string) {
  if (s === "active") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (s === "suspended") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
}

function healthTone(n: number) {
  if (n >= 80) return "text-emerald-600";
  if (n >= 50) return "text-amber-600";
  return "text-destructive";
}

function Page() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [localQ, setLocalQ] = useState(search.q ?? "");
  const fetchList = useServerFn(listCommandClientes);
  const { data, isLoading, error } = useQuery({
    queryKey: ["command-clientes", search.q, search.status, search.env],
    queryFn: () => fetchList({ data: { search: search.q, status: search.status, environment: search.env } }),
    staleTime: 30_000,
  });

  const rows: ClienteListItem[] = data ?? [];

  function updateSearch(next: Partial<Search>) {
    navigate({ search: (prev: Search) => ({ ...prev, ...next }), replace: true });
  }

  return (
    <CommandPage
      title="Clientes"
      description="Gestão unificada de todos os tenants Impulsionando. Clique em um cliente para abrir o workspace completo."
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSearch({ q: localQ || undefined });
          }}
          className="flex-1 min-w-[240px]"
        >
          <Input
            placeholder="Buscar por nome…"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            className="max-w-md"
          />
        </form>
        <select
          value={search.status ?? "all"}
          onChange={(e) => updateSearch({ status: e.target.value === "all" ? undefined : e.target.value })}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Todos status</option>
          <option value="active">Ativo</option>
          <option value="suspended">Suspenso</option>
          <option value="pending">Pendente</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          value={search.env ?? "all"}
          onChange={(e) => updateSearch({ env: e.target.value === "all" ? undefined : e.target.value })}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">Todos ambientes</option>
          <option value="real">Real</option>
          <option value="demo">Demo</option>
          <option value="staging">Staging</option>
        </select>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniKpi icon={Building2} label="Total" value={rows.length} />
        <MiniKpi icon={Activity} label="Ativos" value={rows.filter((r) => r.is_active && r.status === "active").length} tone="positive" />
        <MiniKpi icon={Activity} label="Suspensos" value={rows.filter((r) => r.status === "suspended").length} tone="danger" />
        <MiniKpi icon={Users} label="Usuários" value={rows.reduce((a, r) => a + r.users_count, 0)} />
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Falha ao carregar: {(error as Error).message}
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b bg-muted/30">
          <div>Cliente</div>
          <div>Status</div>
          <div>Ambiente</div>
          <div className="text-right">Usuários</div>
          <div className="text-right">Health</div>
        </div>
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  to="/command/clientes/$companyId"
                  params={{ companyId: c.id }}
                  className="grid grid-cols-[1fr_100px_100px_80px_80px] gap-4 px-4 py-3 items-center hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="w-8 h-8 rounded object-cover border" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.trade_name || c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.segment || "—"}</div>
                    </div>
                  </div>
                  <div>
                    <Badge variant="outline" className={statusTone(c.status)}>
                      {c.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{c.environment}</div>
                  <div className="text-right text-sm tabular-nums">{c.users_count}</div>
                  <div className={`text-right text-sm font-semibold tabular-nums ${healthTone(c.health_score)}`}>
                    {c.health_score}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CommandPage>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number | string;
  tone?: "positive" | "danger";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-600" : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
