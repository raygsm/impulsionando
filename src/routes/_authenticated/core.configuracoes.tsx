import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageElements";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { listCoreSettings, upsertCoreSetting } from "@/lib/core-settings.functions";

export const Route = createFileRoute("/_authenticated/core/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações globais — Core" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfiguracoesPage,
});

type Setting = {
  key: string;
  value: any;
  label: string;
  description: string | null;
  category: string;
  updated_at: string;
};

function ConfiguracoesPage() {
  const list = useServerFn(listCoreSettings);
  const save = useServerFn(upsertCoreSetting);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Setting[]>({
    queryKey: ["core-settings"],
    queryFn: () => list() as any,
  });

  const grouped = (data ?? []).reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Configurações globais"
        description="Parâmetros da plataforma editáveis pelo CORE. Afetam todos os tenants."
      />
      <Settings2 className="hidden" />

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold capitalize">{cat}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((s) => (
              <SettingEditor
                key={s.key}
                setting={s}
                onSave={async (value) => {
                  try {
                    await save({ data: { key: s.key, value } });
                    toast.success(`${s.label} atualizado`);
                    qc.invalidateQueries({ queryKey: ["core-settings"] });
                  } catch (e: any) {
                    toast.error(e?.message ?? "Erro ao salvar");
                  }
                }}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SettingEditor({
  setting,
  onSave,
}: {
  setting: Setting;
  onSave: (value: any) => Promise<void>;
}) {
  const [draft, setDraft] = useState<string>(() =>
    JSON.stringify(setting.value, null, 2),
  );
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-md border bg-card p-4 space-y-2">
      <div>
        <Label className="text-sm font-medium">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground font-mono mt-1">{setting.key}</p>
      </div>
      <Textarea
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="font-mono text-xs"
      />
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDraft(JSON.stringify(setting.value, null, 2))}
          disabled={saving}
        >
          Restaurar
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={async () => {
            let parsed: any;
            try {
              parsed = JSON.parse(draft);
            } catch {
              toast.error("JSON inválido");
              return;
            }
            setSaving(true);
            try {
              await onSave(parsed);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

// suppress unused import warning if Input not used later
export const _input = Input;
