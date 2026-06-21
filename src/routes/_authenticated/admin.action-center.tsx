import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getActionCenter } from "@/lib/action-center.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListChecks, AlertTriangle, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/action-center")({
  head: () => ({ meta: [{ title: "Action Center — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ActionCenterPage,
});

function ActionCenterPage() {
  const fn = useServerFn(getActionCenter);
  const { data, isLoading } = useQuery({ queryKey: ["action-center"], queryFn: () => fn(), refetchInterval: 60_000 });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (!data) return <div className="p-6">Sem dados.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ListChecks className="h-6 w-6" /> Action Center</h1>
        <p className="text-sm text-muted-foreground">Fila única priorizada — o que a equipe deve resolver agora.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Inbox className="h-4 w-4" /> Pendências</div><div className="text-2xl font-bold mt-1">{data.summary.total}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4 text-destructive" /> Críticas (≥80)</div><div className="text-2xl font-bold mt-1 text-destructive">{data.summary.critical}</div></Card>
        {Object.entries(data.summary.byCategory).slice(0, 2).map(([k, v]) => (
          <Card key={k} className="p-4"><div className="text-sm text-muted-foreground">{k}</div><div className="text-2xl font-bold mt-1">{v as number}</div></Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Fila priorizada</h2>
        <div className="space-y-2">
          {data.actions.length === 0 && <p className="text-sm text-muted-foreground">Nada urgente. 🎉</p>}
          {data.actions.map((a: any) => (
            <Link key={a.id} to={a.link} className="block">
              <div className="flex items-center gap-3 p-3 rounded-md border hover:border-primary/40 hover:bg-primary/5 transition">
                <div className={`w-12 text-center font-bold ${a.priority >= 80 ? "text-destructive" : a.priority >= 60 ? "text-amber-600" : "text-muted-foreground"}`}>{a.priority}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.subtitle}</div>
                </div>
                <Badge variant="outline">{a.category}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
