import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listFunnelRules, updateFunnelRule, dryRunFunnelRule } from "@/lib/funnel-rules-admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/n8n-niches")({
  head: () => ({
    meta: [
      { title: "Réguas N8N por Nicho — Admin" },
      { name: "description", content: "Gestão das automações de funil por nicho do core Impulsionando." },
    ],
  }),
  component: N8nNichesPage,
});

const STAGE_LABEL: Record<string, string> = {
  capture: "Captação",
  convert: "Conversão",
  relate: "Relacionamento",
  retain: "Retenção",
  expand: "Expansão",
};
const STAGE_ORDER = ["capture", "convert", "relate", "retain", "expand"];

type Rule = {
  id: string;
  niche_slug: string | null;
  stage: string;
  event_name: string;
  workflow_name: string;
  description?: string | null;
  active: boolean;
  delay_minutes?: number | null;
};

function N8nNichesPage() {
  const list = useServerFn(listFunnelRules);
  const update = useServerFn(updateFunnelRule);
  const dryRun = useServerFn(dryRunFunnelRule);
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "funnel-rules"],
    queryFn: () => list(),
  });

  const mUpdate = useMutation({
    mutationFn: (input: { id: string; active?: boolean; delay_minutes?: number }) =>
      update({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "funnel-rules"] });
      toast.success("Régua atualizada");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar"),
  });

  const mDryRun = useMutation({
    mutationFn: (id: string) => dryRun({ data: { id } }),
    onSuccess: (res: any) => {
      toast.success("Dry-run executado — veja o console");
      console.log("[dry-run]", res);
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no dry-run"),
  });

  const rules = (data?.rules ?? []) as Rule[];

  const grouped = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const filtered = rules.filter((r) => {
      if (!f) return true;
      return (
        (r.niche_slug ?? "global").toLowerCase().includes(f) ||
        r.event_name.toLowerCase().includes(f) ||
        r.workflow_name.toLowerCase().includes(f) ||
        STAGE_LABEL[r.stage]?.toLowerCase().includes(f)
      );
    });
    const map = new Map<string, Rule[]>();
    for (const r of filtered) {
      const key = r.niche_slug ?? "__global__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) ||
          a.event_name.localeCompare(b.event_name),
      );
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "__global__") return -1;
      if (b === "__global__") return 1;
      return a.localeCompare(b);
    });
  }, [rules, filter]);

  const kpi = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.active).length;
    const niches = new Set(rules.map((r) => r.niche_slug).filter(Boolean)).size;
    return { total, active, niches, inactive: total - active };
  }, [rules]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Réguas N8N por Nicho</h1>
          <p className="text-muted-foreground mt-1">
            Toggle on/off e dry-run das automações de funil. Documentação:{" "}
            <code className="text-xs">docs/n8n/niches/README.md</code>.
          </p>
        </div>
        <Link to="/admin/n8n-console" className="text-sm underline">
          → Console de execuções
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Réguas totais" value={kpi.total} />
        <Kpi label="Ativas" value={kpi.active} tone="success" />
        <Kpi label="Inativas" value={kpi.inactive} tone="muted" />
        <Kpi label="Nichos cobertos" value={kpi.niches} />
      </div>

      <Input
        placeholder="Filtrar por nicho, evento, workflow ou estágio…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-md"
      />

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <div className="space-y-4">
        {grouped.map(([key, items]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                {key === "__global__" ? "Global (todos os tenants)" : key}
                <Badge variant="outline">{items.length} réguas</Badge>
                <Badge variant="secondary">
                  {items.filter((r) => r.active).length} ativas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0 flex-wrap"
                >
                  <Badge variant="outline" className="w-28 justify-center">
                    {STAGE_LABEL[r.stage] ?? r.stage}
                  </Badge>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-mono text-xs text-muted-foreground">
                      {r.event_name}
                    </div>
                    <div className="text-sm font-medium">{r.workflow_name}</div>
                  </div>
                  {typeof r.delay_minutes === "number" && r.delay_minutes > 0 && (
                    <Badge variant="secondary">+{r.delay_minutes}min</Badge>
                  )}
                  <Switch
                    checked={r.active}
                    onCheckedChange={(v) =>
                      mUpdate.mutate({ id: r.id, active: v })
                    }
                    disabled={mUpdate.isPending}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mDryRun.mutate(r.id)}
                    disabled={mDryRun.isPending}
                  >
                    Dry-run
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "muted";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase text-muted-foreground tracking-wide">
          {label}
        </div>
        <div
          className={`text-3xl font-bold mt-1 ${
            tone === "success"
              ? "text-green-600"
              : tone === "muted"
                ? "text-muted-foreground"
                : ""
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
