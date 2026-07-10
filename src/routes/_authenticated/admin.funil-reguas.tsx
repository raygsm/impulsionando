import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Save } from "lucide-react";
import { toast } from "sonner";
import { listFunnelRules, updateFunnelRule, dryRunFunnelRule } from "@/lib/funnel-rules-admin.functions";
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBanner,
} from "@/components/impulsionando";
import { formatInt } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/funil-reguas")({
  head: () => ({
    meta: [
      { title: "Réguas de Funil — Impulsionando" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FunilReguasPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <ErrorState
          title="Não foi possível carregar as réguas de funil"
          description="Tente novamente em instantes."
          detail={error.message}
          action={
            <Button
              size="sm"
              onClick={() => {
                reset();
                router.invalidate();
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

function FunilReguasPage() {
  const listFn = useServerFn(listFunnelRules);
  const updateFn = useServerFn(updateFunnelRule);
  const dryFn = useServerFn(dryRunFunnelRule);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["funnel-rules-admin"],
    queryFn: () => listFn(),
  });
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dryResult, setDryResult] = useState<any>(null);

  const rules = (data as any)?.rules ?? [];
  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter((r: any) =>
      [r.stage, r.event_name, r.workflow_name, r.niche_slug ?? "global", r.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rules, filter]);

  async function toggle(r: any) {
    try {
      await updateFn({ data: { id: r.id, active: !r.active } });
      toast.success(`Régua ${!r.active ? "ativada" : "desativada"}`);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function dryRun(id: string) {
    try {
      const res = await dryFn({ data: { id } });
      setDryResult(res);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        eyebrow="Automação"
        title="Réguas de Funil (N8N)"
        description="Catálogo de automações por estágio do funil Impulsionando, segmentado por nicho. Ative com cautela — disparos vão direto ao N8N de produção."
      />

      <StatusBanner
        tone="warning"
        title="Ambiente de produção"
        description="Ativar uma régua dispara automações reais. Use o dry-run antes de publicar mudanças."
      />

      <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por estágio, nicho, evento ou workflow…"
          className="max-w-md"
          aria-label="Filtrar réguas"
        />
        <Badge variant="outline">
          {formatInt(filtered.length)} / {formatInt(rules.length)}
        </Badge>
      </Card>

      {isLoading ? (
        <LoadingState label="Carregando réguas…" />
      ) : error ? (
        <ErrorState
          title="Falha ao listar réguas"
          description="Tente novamente em instantes."
          detail={(error as Error).message}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma régua encontrada"
          description="Ajuste o filtro ou cadastre novas réguas no catálogo."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((r: any) => (
            <RuleRow
              key={r.id}
              rule={r}
              expanded={expanded === r.id}
              onExpand={() => setExpanded(expanded === r.id ? null : r.id)}
              onToggle={() => toggle(r)}
              onDryRun={() => dryRun(r.id)}
              onSave={async (patch: any) => {
                await updateFn({ data: { id: r.id, ...patch } });
                toast.success("Salvo");
                refetch();
              }}
            />
          ))}
        </div>
      )}

      {dryResult && (
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Dry-run — preview do disparo</h3>
            <Button size="sm" variant="ghost" onClick={() => setDryResult(null)}>
              fechar
            </Button>
          </div>
          <pre className="text-xs bg-card border rounded p-3 overflow-x-auto">
            {JSON.stringify(dryResult, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

function RuleRow({ rule, expanded, onExpand, onToggle, onDryRun, onSave }: any) {
  const [workflow, setWorkflow] = useState(rule.workflow_name);
  const [delay, setDelay] = useState<number>(rule.delay_minutes ?? 0);
  const [desc, setDesc] = useState<string>(rule.description ?? "");
  const [payload, setPayload] = useState<string>(
    JSON.stringify(rule.payload_template ?? {}, null, 2),
  );
  const dirty =
    workflow !== rule.workflow_name ||
    delay !== rule.delay_minutes ||
    desc !== (rule.description ?? "") ||
    payload !== JSON.stringify(rule.payload_template ?? {}, null, 2);

  return (
    <Card className="p-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          className="flex items-center gap-2 min-w-0 text-left flex-1 flex-wrap"
          onClick={onExpand}
          aria-expanded={expanded}
        >
          <Badge variant={rule.active ? "default" : "outline"}>{rule.stage}</Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            {rule.niche_slug ?? "global"}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground truncate">
            {rule.event_name}
          </span>
          <span className="text-sm truncate">→ {rule.workflow_name}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={onDryRun}>
            <Play className="h-3 w-3 mr-1" aria-hidden="true" /> Dry-run
          </Button>
          <Switch
            checked={rule.active}
            onCheckedChange={onToggle}
            aria-label={rule.active ? "Desativar régua" : "Ativar régua"}
          />
        </div>
      </div>
      {expanded && (
        <div className="mt-3 grid gap-3 md:grid-cols-2 border-t pt-3">
          <label className="text-xs space-y-1">
            Workflow N8N
            <Input
              value={workflow}
              onChange={(e) => setWorkflow(e.target.value)}
              className="font-mono"
            />
          </label>
          <label className="text-xs space-y-1">
            Delay (minutos)
            <Input
              type="number"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />
          </label>
          <label className="text-xs space-y-1 md:col-span-2">
            Descrição
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </label>
          <label className="text-xs space-y-1 md:col-span-2">
            Payload Template (JSON)
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="font-mono text-xs h-40"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button
              size="sm"
              disabled={!dirty}
              onClick={async () => {
                try {
                  const parsed = JSON.parse(payload);
                  await onSave({
                    workflow_name: workflow,
                    delay_minutes: delay,
                    description: desc,
                    payload_template: parsed,
                  });
                } catch (e: any) {
                  toast.error(`JSON inválido: ${e.message}`);
                }
              }}
            >
              <Save className="h-3 w-3 mr-1" aria-hidden="true" /> Salvar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
