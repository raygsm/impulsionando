import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, UserCheck, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empresa/talentos/dashboard")({
  component: TalentosDashboard,
});

type Stat = { label: string; value: number | string; hint?: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> };
type MatchRow = { stage: string; created_at: string; candidato_id: string };
type CandRow = { cidade: string | null; cargo_desejado: string; faixa_etaria: string | null };

function TalentosDashboard() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [cands, setCands] = useState<CandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = await (supabase as any).from("talentos_matches")
        .select("stage,created_at,candidato_id").eq("company_id", u.user.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = await (supabase as any).from("talentos_candidatos")
        .select("cidade,cargo_desejado,faixa_etaria").eq("ativo", true).eq("visivel_rede", true).limit(500);
      setMatches((m.data ?? []) as MatchRow[]);
      setCands((c.data ?? []) as CandRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const stats: Stat[] = useMemo(() => {
    const byStage = (s: string) => matches.filter((m) => m.stage === s).length;
    return [
      { label: "Candidatos na rede", value: cands.length, icon: Users, hint: "Disponíveis para a sua empresa" },
      { label: "Favoritos", value: byStage("favorito"), icon: Heart },
      { label: "Em entrevista", value: byStage("entrevista"), icon: Briefcase },
      { label: "Contratados", value: byStage("contratado"), icon: UserCheck, hint: "Acumulado" },
    ];
  }, [matches, cands]);

  const porCidade = useMemo(() => topCount(cands.map((c) => c.cidade ?? "—")), [cands]);
  const porCargo = useMemo(() => topCount(cands.map((c) => c.cargo_desejado)), [cands]);
  const porFaixa = useMemo(() => topCount(cands.map((c) => c.faixa_etaria ?? "—")), [cands]);

  return (
    <main className="min-h-dvh bg-background py-8">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard de Talentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão executiva da sua rede de candidatos e funil de contratação.
          </p>
        </header>

        <section aria-label="Indicadores" className="grid gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
                  <s.icon aria-hidden className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-3xl font-bold">{loading ? "—" : s.value}</p>
                {s.hint ? <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p> : null}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <BreakdownCard title="Por cidade" items={porCidade} />
          <BreakdownCard title="Por cargo" items={porCargo} />
          <BreakdownCard title="Por faixa etária" items={porFaixa} />
        </section>
      </div>
    </main>
  );
}

function topCount(values: string[], limit = 6): Array<{ key: string; count: number }> {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count).slice(0, limit);
}

function BreakdownCard({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.key} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="truncate">{i.key}</span>
                  <Badge variant="secondary">{i.count}</Badge>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={i.count}
                  aria-label={`${i.key}: ${i.count}`}
                  className="mt-1 h-1.5 w-full rounded bg-muted"
                >
                  <div className="h-full rounded bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
