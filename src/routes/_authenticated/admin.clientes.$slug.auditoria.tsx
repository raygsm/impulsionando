import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, XCircle, Circle, RefreshCw, ClipboardCheck } from "lucide-react";
import { auditTenantFull, type AuditItem, type AuditStatus } from "@/lib/tenant-audit.functions";
import { CoreSection } from "@/components/impulsionando";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria Full — Impulsionando" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Page,
  errorComponent: ({ error, reset }) => { const r = useRouter(); return (<div className="p-6 text-sm"><p className="text-destructive mb-2">{error.message}</p><Button size="sm" onClick={()=>{reset();r.invalidate();}}>Tentar novamente</Button></div>); },
});

function icon(s: AuditStatus) {
  if (s === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (s === "warn") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (s === "error") return <XCircle className="h-4 w-4 text-destructive" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}
function toneRing(s: AuditStatus) {
  if (s === "ok") return "border-l-emerald-600";
  if (s === "warn") return "border-l-amber-500";
  if (s === "error") return "border-l-destructive";
  return "border-l-muted";
}

function Page() {
  const { slug } = Route.useParams();
  const fn = useServerFn(auditTenantFull);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tenant-audit", slug],
    queryFn: () => fn({ data: { slug } }),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-64 mb-4"/><Skeleton className="h-64"/></div>;
  if (!data) return null;

  const grouped = data.items.reduce<Record<string, AuditItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it); return acc;
  }, {});
  const scoreTone: AuditStatus = data.score >= 90 ? "ok" : data.score >= 60 ? "warn" : "error";

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title="Auditoria Full Plan"
        description="Diagnóstico completo do cliente: dados, módulos, pagamentos, comunicação, IA, automações e publicação."
        actions={<Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Rerodar</Button>}
      >
        <Card className={`p-5 border-l-4 ${toneRing(scoreTone)}`}>
          <div className="flex items-center gap-4">
            <ClipboardCheck className="h-8 w-8 text-primary" aria-hidden />
            <div className="flex-1">
              <div className="text-3xl font-semibold">{data.score}<span className="text-base text-muted-foreground">/100</span></div>
              <div className="text-sm text-muted-foreground">
                {data.summary.ok} OK · {data.summary.warn} avisos · {data.summary.error} erros
              </div>
            </div>
            <Badge variant={scoreTone==="ok"?"default":scoreTone==="error"?"destructive":"secondary"} className="uppercase">
              {scoreTone==="ok"?"Full compliant":scoreTone==="warn"?"Ajustes":"Bloqueios"}
            </Badge>
          </div>
        </Card>

        {Object.entries(grouped).map(([cat, items]) => (
          <Card key={cat} className="p-4 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cat}</div>
            <div className="divide-y">
              {items.map((it) => (
                <div key={it.id} className="flex items-start gap-3 py-2">
                  <div className="pt-0.5">{icon(it.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{it.label}</div>
                    <div className="text-xs text-muted-foreground">{it.detail}</div>
                    {it.action && <div className="mt-1 text-xs rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-2 py-1 text-amber-900 dark:text-amber-200"><strong>Ação:</strong> {it.action}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </CoreSection>
    </div>
  );
}
