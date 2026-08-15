import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CircleDot, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";

export const Route = createFileRoute("/_authenticated/core/go-live")({
  head: () => ({ meta: [{ title: "GO-LIVE Gate — Impulsionando Core" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: GoLivePage,
});

type Check = {
  id: string;
  check_key: string;
  category: string;
  title: string;
  severity: "P0" | "P1" | "P2";
  status: "passed" | "failed" | "pending" | "blocked";
  evidence_ref: string | null;
  notes: string | null;
  last_checked_at: string | null;
};

type Capability = {
  capability_key: string;
  name: string;
  domain: string;
  commercial_status: string;
  technical_status: string;
  commercial_copy_allowed: boolean;
  limitations: unknown;
  last_tested_at: string | null;
};

function GoLivePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["core-go-live-gate"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const [checks, capabilities] = await Promise.all([
        supabase.from("core_go_live_checks").select("*").order("severity").order("category"),
        supabase.from("core_capability_registry").select("capability_key,name,domain,commercial_status,technical_status,commercial_copy_allowed,limitations,last_tested_at").order("domain").order("name"),
      ]);
      if (checks.error) throw checks.error;
      if (capabilities.error) throw capabilities.error;
      return { checks: (checks.data ?? []) as Check[], capabilities: (capabilities.data ?? []) as Capability[] };
    },
  });

  if (isLoading) return <Card className="p-6">Validando gates de produção…</Card>;
  if (!data) return null;

  const p0 = data.checks.filter((c) => c.severity === "P0");
  const p0Open = p0.filter((c) => c.status !== "passed");
  const passed = data.checks.filter((c) => c.status === "passed").length;
  const productionAllowed = p0Open.length === 0;

  return (
    <div className="space-y-5">
      <Card className={`p-6 border-2 ${productionAllowed ? "border-emerald-500/50" : "border-amber-500/50"}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Fonte oficial de verdade</div>
            <h1 className="mt-1 text-2xl font-bold">IMPULSIONANDO CORE — GO-LIVE Gate</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Nenhum recurso é promovido a produção comercial apenas porque existe no código. O gate exige evidência, segurança e homologação compatíveis com a promessa.
            </p>
          </div>
          <Badge className={productionAllowed ? "bg-emerald-600" : "bg-amber-600"}>
            {productionAllowed ? "GO-LIVE APROVÁVEL" : `${p0Open.length} P0 ABERTO(S)`}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Checks totais" value={data.checks.length} icon={CircleDot} />
        <Kpi label="Aprovados" value={passed} icon={CheckCircle2} />
        <Kpi label="P0 abertos" value={p0Open.length} icon={AlertTriangle} />
        <Kpi label="Capabilities" value={data.capabilities.length} icon={ShieldCheck} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Gates de produção</h2>
        <div className="mt-4 divide-y">
          {data.checks.map((check) => (
            <div key={check.id} className="grid gap-2 py-4 md:grid-cols-[80px_100px_1fr_auto] md:items-start">
              <Badge variant="outline">{check.severity}</Badge>
              <Status status={check.status} />
              <div>
                <div className="font-medium">{check.title}</div>
                <div className="text-xs text-muted-foreground">{check.category} · {check.check_key}</div>
                {check.notes && <p className="mt-1 text-sm text-muted-foreground">{check.notes}</p>}
                {check.evidence_ref && <div className="mt-1 text-xs font-mono text-muted-foreground">evidência: {check.evidence_ref}</div>}
              </div>
              <div className="text-xs text-muted-foreground md:text-right">
                {check.last_checked_at ? new Date(check.last_checked_at).toLocaleString("pt-BR") : "não verificado"}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Catálogo técnico/comercial</h2>
        <p className="mt-1 text-sm text-muted-foreground">Somente capabilities com evidência adequada devem permitir copy comercial de disponibilidade.</p>
        <div className="mt-4 divide-y">
          {data.capabilities.map((cap) => (
            <div key={cap.capability_key} className="grid gap-2 py-3 md:grid-cols-[1.2fr_130px_180px_110px] md:items-center">
              <div>
                <div className="font-medium">{cap.name}</div>
                <div className="text-xs font-mono text-muted-foreground">{cap.capability_key}</div>
              </div>
              <Badge variant="outline">{cap.commercial_status}</Badge>
              <div className="text-xs text-muted-foreground">{cap.technical_status}</div>
              <Badge variant={cap.commercial_copy_allowed ? "default" : "secondary"}>
                {cap.commercial_copy_allowed ? "pode anunciar" : "não anunciar"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Status({ status }: { status: Check["status"] }) {
  const config = {
    passed: ["Aprovado", CheckCircle2, "text-emerald-600"],
    failed: ["Falhou", XCircle, "text-destructive"],
    pending: ["Pendente", CircleDot, "text-amber-600"],
    blocked: ["Bloqueado", AlertTriangle, "text-orange-600"],
  } as const;
  const [label, Icon, className] = config[status];
  return <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}><Icon className="h-4 w-4" />{label}</span>;
}

function Kpi({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return <Card className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></Card>;
}
