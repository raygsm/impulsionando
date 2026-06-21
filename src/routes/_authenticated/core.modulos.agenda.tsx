import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { getRules, upsertRule, getSettings, setSetting, installAgendaModule } from "@/lib/agenda-core.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/modulos/agenda")({
  component: CoreAgendaConfigPage,
});

const RULE_KINDS = [
  { key: "no_show_customer", label: "No-show do cliente" },
  { key: "no_show_professional", label: "No-show do profissional" },
  { key: "cancellation", label: "Cancelamento" },
  { key: "rescheduling", label: "Remarcação" },
  { key: "substitution", label: "Substituição" },
  { key: "distribution", label: "Distribuição (Pega-Horário)" },
  { key: "reminder", label: "Lembretes" },
  { key: "payment", label: "Pagamento" },
] as const;

function CoreAgendaConfigPage() {
  const { companyId } = useActiveCompany();
  const qc = useQueryClient();
  const getRulesFn = useServerFn(getRules);
  const upsertRuleFn = useServerFn(upsertRule);
  const getSettingsFn = useServerFn(getSettings);
  const setSettingFn = useServerFn(setSetting);
  const installFn = useServerFn(installAgendaModule);

  const { data: rules = [] } = useQuery({
    queryKey: ["agenda-rules", companyId],
    enabled: !!companyId,
    queryFn: () => getRulesFn({ data: { companyId: companyId! } }),
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["agenda-settings", companyId],
    enabled: !!companyId,
    queryFn: () => getSettingsFn({ data: { companyId: companyId! } }),
  });

  const install = useMutation({
    mutationFn: () => installFn({ data: { companyId: companyId! } }),
    onSuccess: () => {
      toast.success("Módulo Agenda Inteligente instalado/atualizado nesta empresa.");
      qc.invalidateQueries({ queryKey: ["agenda-rules", companyId] });
      qc.invalidateQueries({ queryKey: ["agenda-settings", companyId] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? "Falha ao instalar"),
  });

  if (!companyId) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Selecione uma empresa para configurar o módulo.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-7 w-7 text-primary" /> Agenda Inteligente — Configuração CORE
          </h1>
          <p className="text-muted-foreground">
            Parametrização universal por empresa. Toda regra fica versionada e auditada.
          </p>
        </div>
        <Button onClick={() => install.mutate()} disabled={install.isPending}>
          <Sparkles className="mr-2 h-4 w-4" />
          {install.isPending ? "Aplicando…" : "Aplicar padrões"}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Regras ativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {RULE_KINDS.map((rk) => {
            const current = rules.find((r) => r.kind === rk.key);
            return (
              <RuleEditor
                key={rk.key}
                kind={rk.key}
                label={rk.label}
                current={current ? { id: current.id, rule: current.rule as Record<string, unknown> } : null}
                onSave={async (rule) => {
                  await upsertRuleFn({
                    data: {
                      id: current?.id,
                      companyId: companyId,
                      kind: rk.key,
                      rule,
                    },
                  });
                  toast.success(`Regra "${rk.label}" salva`);
                  qc.invalidateQueries({ queryKey: ["agenda-rules", companyId] });
                }}
              />
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum parâmetro configurado. Clique em "Aplicar padrões" para semear o módulo.
            </p>
          )}
          {settings.map((s) => (
            <div key={s.key} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="font-mono text-xs">{s.key}</Label>
                <Badge variant="outline">jsonb</Badge>
              </div>
              <Textarea
                defaultValue={JSON.stringify(s.value, null, 2)}
                rows={3}
                className="font-mono text-xs"
                onBlur={async (e) => {
                  try {
                    const v = JSON.parse(e.target.value);
                    await setSettingFn({ data: { companyId, key: s.key, value: v } });
                    toast.success(`${s.key} atualizado`);
                  } catch {
                    toast.error("JSON inválido");
                  }
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RuleEditor({
  kind,
  label,
  current,
  onSave,
}: {
  kind: string;
  label: string;
  current: { id: string; rule: Record<string, unknown> } | null;
  onSave: (rule: Record<string, unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(() => JSON.stringify(current?.rule ?? {}, null, 2));
  const [saving, setSaving] = useState(false);
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground font-mono">{kind}</p>
        </div>
        <Badge variant={current ? "default" : "outline"}>{current ? "configurada" : "não configurada"}</Badge>
      </div>
      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="font-mono text-xs" />
      <Button
        size="sm"
        disabled={saving}
        onClick={async () => {
          try {
            const parsed = JSON.parse(draft);
            setSaving(true);
            await onSave(parsed);
          } catch {
            toast.error("JSON inválido");
          } finally {
            setSaving(false);
          }
        }}
      >
        Salvar
      </Button>
    </div>
  );
}
