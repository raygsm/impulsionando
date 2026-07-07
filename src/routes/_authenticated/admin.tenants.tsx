/**
 * /admin/tenants — Dashboard consolidado de tenants do Core Impulsionando.
 *
 * KPIs: total, ativos, em teste/onboarding, sem endereço, sem nicho,
 * sem vitrine ativa, exibidos na vitrine, pendentes. Filtros: plano,
 * status, segmento, cidade, vitrine.
 *
 * Reusa `listTenants` (server fn já existente) — não altera schema.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Search, ExternalLink, ShieldAlert, MapPin, Store } from "lucide-react";
import { listTenants } from "@/lib/tenant-editor.functions";

export const Route = createFileRoute("/_authenticated/admin/tenants")({
  head: () => ({
    meta: [
      { title: "Tenants — Admin Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Dashboard consolidado de tenants do Core Impulsionando." },
    ],
  }),
  component: TenantsDashboard,
  errorComponent: ({ error, reset }) => (
    <div className="p-6 max-w-lg mx-auto text-center space-y-3">
      <ShieldAlert className="mx-auto size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  ),
});

function TenantsDashboard() {
  const fn = useServerFn(listTenants);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => fn(),
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [vitrine, setVitrine] = useState<"all" | "on" | "off">("all");

  const tenants = data?.tenants ?? [];
  const cities = useMemo(
    () => Array.from(new Set(tenants.map((t) => t.address_city).filter(Boolean))).sort() as string[],
    [tenants],
  );
  const statuses = useMemo(
    () => Array.from(new Set(tenants.map((t) => t.status).filter(Boolean))).sort() as string[],
    [tenants],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tenants.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (city !== "all" && t.address_city !== city) return false;
      if (vitrine === "on" && !t.vitrine_enabled) return false;
      if (vitrine === "off" && t.vitrine_enabled) return false;
      if (!needle) return true;
      return [t.name, t.trade_name, t.public_slug, t.segment, t.address_city]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(needle));
    });
  }, [tenants, q, status, city, vitrine]);

  const totals = useMemo(() => ({
    all: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    trial: tenants.filter((t) => t.status === "trial" || t.status === "onboarding").length,
    noAddress: tenants.filter((t) => !t.address_city).length,
    noSegment: tenants.filter((t) => !t.segment).length,
    vitrineOn: tenants.filter((t) => t.vitrine_enabled).length,
    vitrineOff: tenants.filter((t) => !t.vitrine_enabled).length,
  }), [tenants]);

  return (
    <div className="space-y-6 max-w-7xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tenants do Core</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consolidado global dos clientes do ecossistema. Filtre por status, plano, nicho, cidade.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/tenants-editor">Abrir editor</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/vitrine-elegibilidade">Elegibilidade vitrine</Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <Kpi label="Total" value={totals.all} />
        <Kpi label="Ativos" value={totals.active} tone="ok" />
        <Kpi label="Teste/Onb." value={totals.trial} />
        <Kpi label="Sem endereço" value={totals.noAddress} tone={totals.noAddress ? "warn" : undefined} />
        <Kpi label="Sem nicho" value={totals.noSegment} tone={totals.noSegment ? "warn" : undefined} />
        <Kpi label="Vitrine ON" value={totals.vitrineOn} tone="ok" />
        <Kpi label="Vitrine OFF" value={totals.vitrineOff} />
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, slug, segmento…" className="pl-8" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="all">Todos os status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="all">Todas as cidades</option>
            {cities.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex gap-1">
            {(["all", "on", "off"] as const).map((k) => (
              <Button key={k} size="sm" variant={vitrine === k ? "default" : "outline"} onClick={() => setVitrine(k)}>
                Vitrine {k === "all" ? "todos" : k === "on" ? "ON" : "OFF"}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando tenants…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum tenant corresponde aos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="tenants-table">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Slug</th>
                  <th className="p-2">Segmento</th>
                  <th className="p-2">Local</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Vitrine</th>
                  <th className="p-2">Contato</th>
                  <th className="p-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {t.logo_url ? (
                          <img src={t.logo_url} alt="" className="size-6 rounded object-cover" loading="lazy" />
                        ) : (
                          <Building2 className="size-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{t.name}</div>
                          {t.trade_name && <div className="text-xs text-muted-foreground">{t.trade_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-muted-foreground">{t.public_slug ?? "—"}</td>
                    <td className="p-2 text-muted-foreground">{t.segment ?? "—"}</td>
                    <td className="p-2 text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{[t.address_city, t.address_state].filter(Boolean).join("/") || "—"}</span>
                    </td>
                    <td className="p-2"><Badge variant="outline">{t.status ?? "—"}</Badge></td>
                    <td className="p-2">
                      {t.vitrine_enabled ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20"><Store className="size-3 mr-1" />ON</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">OFF</Badge>
                      )}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{t.whatsapp ?? t.phone ?? t.email ?? "—"}</td>
                    <td className="p-2 text-right">
                      {t.public_slug && (
                        <a href={`/vitrine/${t.public_slug}`} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline inline-flex items-center gap-1">
                          Vitrine <ExternalLink className="size-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  const color =
    tone === "ok" ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn" ? "text-amber-600 dark:text-amber-400"
      : "text-foreground";
  return (
    <Card className="p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}
