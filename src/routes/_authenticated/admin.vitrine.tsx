/**
 * /admin/vitrine (W19) — Painel de governança da Vitrine Impulsionando.
 *
 * Lê `eco_marketplace_listings` aplicando a flag `vitrine_opt_in` introduzida
 * na onda 19. Apenas admins do core devem acessar — protegido pelo layout
 * `_authenticated` + checagem `has_role('admin')` via RLS nas leituras.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Percent, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vitrine")({
  component: AdminVitrinePage,
});

type Listing = {
  id: string;
  company_id: string;
  title: string;
  niche: string | null;
  status: string;
  vitrine_opt_in: boolean;
  discount_pct: number | null;
  vitrine_approved_at: string | null;
  updated_at: string;
};

function AdminVitrinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "vitrine", "listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eco_marketplace_listings")
        .select("id, company_id, title, niche, status, vitrine_opt_in, discount_pct, vitrine_approved_at, updated_at")
        .eq("vitrine_opt_in", true)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });

  const listings = data ?? [];
  const total = listings.length;
  const approved = listings.filter((l) => !!l.vitrine_approved_at).length;
  const pending = total - approved;
  const avgDiscount = total > 0
    ? (listings.reduce((acc, l) => acc + Number(l.discount_pct ?? 0), 0) / total).toFixed(1)
    : "0";

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Sparkles className="h-4 w-4 text-primary" /> Vitrine Impulsionando
        </div>
        <h1 className="text-3xl font-bold">Governança da Vitrine</h1>
        <p className="text-muted-foreground mt-1.5">
          Listagens que os tenants escolheram exibir publicamente — sempre com desconto ≥ 1% para os Impulsionitos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <KpiCard icon={ShoppingBag} label="Listagens opt-in" value={total} hint="empresas que ativaram a vitrine" />
        <KpiCard icon={ShieldCheck} label="Aprovadas" value={approved} hint="liberadas para o Clube" tone="success" />
        <KpiCard icon={Clock} label="Aguardando aprovação" value={pending} hint="entram após revisão do core" tone="warning" />
        <KpiCard icon={Percent} label="Desconto médio" value={`${avgDiscount}%`} hint="benefício médio aos Impulsionitos" tone="primary" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/30">
          <h2 className="font-semibold">Listagens opt-in</h2>
          <p className="text-xs text-muted-foreground">Mostrando as 200 mais recentes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Título</th>
                <th className="text-left px-4 py-2.5">Nicho</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Desconto</th>
                <th className="text-left px-4 py-2.5">Aprovação</th>
                <th className="text-left px-4 py-2.5">Atualizada</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>
              )}
              {!isLoading && listings.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhuma listagem opt-in até o momento.</td></tr>
              )}
              {listings.map((l) => (
                <tr key={l.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium">{l.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.niche ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge variant="outline">{l.status}</Badge></td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-primary">
                    {Number(l.discount_pct ?? 0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5">
                    {l.vitrine_approved_at
                      ? <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">Aprovada</Badge>
                      : <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0">Pendente</Badge>}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {new Date(l.updated_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, hint, tone = "default",
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const toneCls = {
    default: "text-foreground bg-muted",
    primary: "text-primary bg-primary/10",
    success: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
    warning: "text-amber-700 dark:text-amber-300 bg-amber-500/10",
  }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-md ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </Card>
  );
}
