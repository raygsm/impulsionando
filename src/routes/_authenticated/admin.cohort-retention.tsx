import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCohortRetention } from "@/lib/cohort-retention.functions";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cohort-retention")({
  head: () => ({ meta: [{ title: "Cohort Retention — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CohortRetentionPage,
});

function cellColor(v: number | null) {
  if (v === null) return "bg-muted/30 text-muted-foreground";
  if (v >= 90) return "bg-emerald-600/80 text-white";
  if (v >= 75) return "bg-emerald-500/60 text-white";
  if (v >= 60) return "bg-amber-500/60 text-white";
  if (v >= 40) return "bg-orange-500/60 text-white";
  return "bg-destructive/70 text-white";
}

function CohortRetentionPage() {
  const fn = useServerFn(getCohortRetention);
  const { data, isLoading } = useQuery({ queryKey: ["cohort-retention"], queryFn: () => fn() });

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (!data) return <div className="p-6">Sem dados.</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><LineChart className="h-6 w-6" /> Cohort Retention</h1>
        <p className="text-sm text-muted-foreground">Retenção mensal por cohort de signup (últimos {data.monthsBack} meses).</p>
      </div>

      <Card className="p-4 overflow-x-auto">
        <table className="text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left p-2">Cohort</th>
              <th className="text-right p-2">Tamanho</th>
              {Array.from({ length: data.monthsBack }).map((_, i) => (
                <th key={i} className="p-2 text-center w-14">M{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.cohort}>
                <td className="p-2 font-medium whitespace-nowrap">{r.cohort}</td>
                <td className="p-2 text-right">{r.size}</td>
                {r.retention.map((v: number | null, i: number) => (
                  <td key={i} className={`p-2 text-center rounded ${cellColor(v)} w-14`}>
                    {v === null ? "—" : `${v}%`}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
