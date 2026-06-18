import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Users, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/white-label/capacidade")({
  component: CapacidadeWL,
});

type WlPlan = { slug: string; nome: string; mensalidade_sm: number; pontos_capacidade: number; ordem: number };
type CompanyPlan = { slug: string; nome: string; pontos_consumo: number };
type Link = { id: string; company_id: string; plan_slug: string; pontos_consumidos: number; status: string };

function CapacidadeWL() {
  const [plans, setPlans] = useState<WlPlan[]>([]);
  const [cplans, setCplans] = useState<CompanyPlan[]>([]);
  const [sub, setSub] = useState<{ plan_slug: string; capacidade_pontos: number; auto_upgrade: boolean; auto_downgrade: boolean } | null>(null);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [{ data: p }, { data: cp }, { data: s }, { data: l }] = await Promise.all([
        sb.from("wl_plans").select("*").order("ordem"),
        sb.from("core_company_plans").select("slug, nome, pontos_consumo").order("ordem"),
        sb.from("wl_subscriptions").select("plan_slug, capacidade_pontos, auto_upgrade, auto_downgrade").eq("owner_id", u.user.id).maybeSingle(),
        sb.from("wl_company_links").select("*").eq("wl_owner_id", u.user.id),
      ]);
      setPlans(p ?? []); setCplans(cp ?? []); setSub(s); setLinks(l ?? []);
    })();
  }, []);

  const utilizado = links.reduce((acc, l) => acc + (l.pontos_consumidos ?? 0), 0);
  const capacidade = sub?.capacidade_pontos ?? 0;
  const disponivel = Math.max(0, capacidade - utilizado);
  const ocupacao = capacidade > 0 ? Math.round((utilizado / capacidade) * 100) : 0;

  const current = plans.find((p) => p.slug === sub?.plan_slug);
  const proximo = plans.find((p) => p.ordem > (current?.ordem ?? 0));
  const menorSuficiente = plans.find((p) => p.pontos_capacidade >= utilizado);

  async function contratar(plan: WlPlan) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { error } = await sb.from("wl_subscriptions").upsert({
      owner_id: u.user.id, plan_slug: plan.slug,
      capacidade_pontos: plan.pontos_capacidade, status: "ativo",
    }, { onConflict: "owner_id" });
    if (error) { toast.error(error.message); return; }
    setSub({ plan_slug: plan.slug, capacidade_pontos: plan.pontos_capacidade, auto_upgrade: true, auto_downgrade: false });
    toast.success(`Plano ${plan.nome} ativado`);
  }

  return (
    <main className="min-h-dvh bg-background py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Capacidade White Label</h1>
          <p className="text-sm text-muted-foreground">
            White Label não compra clientes — compra capacidade operacional medida em pontos.
          </p>
        </header>

        <Card>
          <CardHeader><CardTitle>Sua capacidade</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!sub ? (
              <p className="text-sm text-muted-foreground">Nenhum plano ativo. Escolha um abaixo.</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Metric label="Plano" value={current?.nome ?? sub.plan_slug.toUpperCase()} />
                  <Metric label="Capacidade" value={`${capacidade} pts`} />
                  <Metric label="Utilizada" value={`${utilizado} pts`} />
                  <Metric label="Disponível" value={`${disponivel} pts`} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Ocupação operacional</span><span>{ocupacao}%</span>
                  </div>
                  <Progress value={ocupacao} aria-label={`Ocupação ${ocupacao}%`} />
                </div>
                {proximo && disponivel < 3 && (
                  <div className="rounded-md border border-warning bg-warning/10 p-3 text-sm">
                    <TrendingUp className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    Capacidade próxima do limite. Faça upgrade para <strong>{proximo.nome}</strong> ({proximo.pontos_capacidade} pts).
                    <Button size="sm" className="ml-3" onClick={() => contratar(proximo)}>Fazer upgrade</Button>
                  </div>
                )}
                {sub.auto_downgrade && menorSuficiente && current && menorSuficiente.ordem < current.ordem && (
                  <div className="rounded-md border border-info bg-info/10 p-3 text-sm">
                    <TrendingDown className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    Sua operação atual pode ser atendida pelo <strong>{menorSuficiente.nome}</strong>. Reduza sua mensalidade.
                    <Button size="sm" variant="outline" className="ml-3" onClick={() => contratar(menorSuficiente)}>Reduzir plano</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <section aria-labelledby="planos-wl">
          <h2 id="planos-wl" className="mb-3 text-xl font-semibold">Planos White Label</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {plans.map((p) => (
              <Card key={p.slug} className={p.slug === sub?.plan_slug ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {p.nome}
                    {p.slug === sub?.plan_slug && <Badge>Atual</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-2xl font-bold">{p.pontos_capacidade}<span className="text-sm font-normal text-muted-foreground"> pts</span></p>
                  <p className="text-muted-foreground">{p.mensalidade_sm} salário(s) mínimo(s) / mês</p>
                  <Button size="sm" className="w-full" variant={p.slug === sub?.plan_slug ? "outline" : "default"} onClick={() => contratar(p)}>
                    {p.slug === sub?.plan_slug ? "Manter" : "Contratar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="consumo">
          <h2 id="consumo" className="mb-3 text-xl font-semibold">Consumo por plano de cliente</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {cplans.map((c) => (
              <Card key={c.slug}>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{c.nome}</p>
                  <p className="text-2xl font-bold">{c.pontos_consumo} pt{c.pontos_consumo > 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="clientes">
          <h2 id="clientes" className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Layers className="h-5 w-5" aria-hidden="true" /> Clientes ativos
          </h2>
          {links.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Nenhum cliente vinculado ainda.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {links.map((l) => (
                <li key={l.id} className="flex items-center justify-between p-3 text-sm">
                  <span>Empresa {l.company_id.slice(0, 8)}…</span>
                  <span className="flex items-center gap-3">
                    <Badge variant="secondary">{l.plan_slug}</Badge>
                    <span className="text-muted-foreground"><Users className="mr-1 inline h-3 w-3" aria-hidden="true" />{l.pontos_consumidos} pts</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
