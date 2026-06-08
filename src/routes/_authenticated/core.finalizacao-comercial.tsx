import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listModulesPendingCommercialization } from "@/lib/billing.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/app/PageElements";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/finalizacao-comercial")({
  head: () => ({ meta: [{ title: "Finalização Comercial — Módulos" }, { name: "robots", content: "noindex" }] }),
  component: FinalizacaoComercialPage,
});

type Row = {
  id: string;
  slug: string;
  name: string;
  status_tecnico?: string;
  status_comercial?: string;
  done: number;
  total: number;
  ready: boolean;
  checks: { key: string; label: string; ok: boolean }[];
};

function FinalizacaoComercialPage() {
  const fetchRows = useServerFn(listModulesPendingCommercialization);
  const { data, isLoading } = useQuery({
    queryKey: ["core-finalizacao-comercial"],
    queryFn: () => fetchRows(),
  });

  if (isLoading) return <Card className="p-6">Carregando…</Card>;
  const pending = (data?.pending ?? []) as Row[];
  const ready = (data?.ready ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Módulos para Finalização Comercial"
        description="Lista priorizada de módulos que ainda não estão prontos para serem vendidos. Cada item mostra exatamente o que falta."
      />
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Total catalogado</div>
          <div className="text-2xl font-bold mt-1">{data?.total ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Pendentes</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{pending.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Prontos para venda</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{ready.length}</div>
        </Card>
      </div>

      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">Pendentes ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tudo certo — nenhum módulo pendente. 🎉</p>
        ) : (
          <div className="space-y-3">
            {pending.map((m) => (
              <ModuleChecklist key={m.id} m={m} />
            ))}
          </div>
        )}
      </Card>

      {ready.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Prontos para venda ({ready.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ready.map((m) => (
              <Link
                key={m.id}
                to="/core/modulos/$slug"
                params={{ slug: m.slug }}
                className="border rounded-lg p-2 hover:bg-muted/40 transition flex items-center justify-between text-sm"
              >
                <span className="truncate">{m.name}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function ModuleChecklist({ m }: { m: Row }) {
  const pct = Math.round((m.done / m.total) * 100);
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{m.name}</div>
          <div className="text-xs text-muted-foreground">slug: {m.slug}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{m.done}/{m.total}</Badge>
          <Link
            to="/core/modulos/$slug"
            params={{ slug: m.slug }}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Editar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <Progress value={pct} className="h-2 mb-2" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
        {m.checks.map((c) => (
          <div key={c.key} className="flex items-center gap-1.5">
            {c.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className={c.ok ? "text-muted-foreground" : ""}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
