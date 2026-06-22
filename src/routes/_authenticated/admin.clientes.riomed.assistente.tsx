import { createFileRoute } from "@tanstack/react-router";
import { TenantModuleShell } from "@/components/core/TenantModuleShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useMemo } from "react";
import { loadRioMedAssistant, saveRioMedAssistant } from "@/lib/riomed.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/assistente")({
  head: () => ({ meta: [{ title: "RioMed — Assistente Virtual · Impulsionando" }] }),
  component: () => (<TenantModuleShell tenantSlug="riomed" moduleSlug='ai-assistant' title='Assistente IA RioMed'><RioMedAssistantPage /></TenantModuleShell>),
});

type Modality = "venta" | "alquiler";
type CatalogItem = { name: string; modalities: Modality[] };
type Audience = {
  label: string;
  welcome: string;
  catalog: CatalogItem[];
  collect_data: string[];
  out_of_catalog: string;
  price_or_stock: string;
  closing: string;
};
type Assistant = {
  version?: string;
  language?: string;
  source?: string;
  general_rules?: string[];
  greeting?: { text: string; fallback: string };
  audiences?: { paciente?: Audience; clinica?: Audience; hospital?: Audience };
  rental_requirements?: string[];
  sales_handoff_data?: string[];
  satisfaction_survey?: { scale: string; questions: string[] };
  updated_at?: string;
  updated_by?: string;
};

const TABS = ["regras", "saudação", "paciente", "clinica", "hospital", "json"] as const;
type Tab = (typeof TABS)[number];

function RioMedAssistantPage() {
  const load = useServerFn(loadRioMedAssistant);
  const save = useServerFn(saveRioMedAssistant);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "riomed", "assistant"], queryFn: () => load() });

  const [draft, setDraft] = useState<Assistant | null>(null);
  const [tab, setTab] = useState<Tab>("regras");
  const [rawJson, setRawJson] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.assistant) {
      setDraft(data.assistant as Assistant);
      setRawJson(JSON.stringify(data.assistant, null, 2));
    }
  }, [data?.assistant]);

  const dirty = useMemo(() => {
    if (!data?.assistant || !draft) return false;
    return JSON.stringify(data.assistant) !== JSON.stringify(draft);
  }, [data?.assistant, draft]);

  const mut = useMutation({
    mutationFn: async (next: Assistant) => save({ data: { assistant: next } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "riomed", "assistant"] }),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando assistente RioMed…</div>;
  if (!data?.assistant || !draft) {
    return (
      <div className="p-8 space-y-2">
        <h1 className="text-xl font-bold">Assistente Virtual RioMed</h1>
        <p className="text-sm text-muted-foreground">Nenhum prompt registrado em <code>core_tenant_identity.metadata.ai_assistant</code>.</p>
      </div>
    );
  }

  const onSave = () => {
    if (tab === "json") {
      try {
        const parsed = JSON.parse(rawJson);
        setJsonError(null);
        setDraft(parsed);
        mut.mutate(parsed);
      } catch (e: any) {
        setJsonError(e?.message ?? "JSON inválido");
      }
      return;
    }
    mut.mutate(draft);
  };

  const aud = (key: "paciente" | "clinica" | "hospital"): Audience | null => draft.audiences?.[key] ?? null;
  const updateAud = (key: "paciente" | "clinica" | "hospital", patch: Partial<Audience>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            audiences: {
              ...(d.audiences ?? {}),
              [key]: { ...(d.audiences?.[key] as Audience), ...patch },
            },
          }
        : d,
    );
  };

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <header className="border-b pb-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assistente Virtual RioMed</h1>
          <p className="text-xs text-muted-foreground">
            Fonte: <code>core_tenant_identity.metadata.ai_assistant</code> · versão{" "}
            <code>{draft.version ?? "—"}</code> · idioma <code>{draft.language ?? "es-BO"}</code>
          </p>
          <p className="text-xs text-muted-foreground">{draft.source}</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600">alterações não salvas</span>}
          <button
            onClick={onSave}
            disabled={mut.isPending || (!dirty && tab !== "json")}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm disabled:opacity-40"
          >
            {mut.isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 text-sm border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 capitalize border-b-2 ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {mut.isError && (
        <div className="p-3 rounded border border-destructive text-destructive text-sm">
          {(mut.error as Error)?.message}
        </div>
      )}
      {mut.isSuccess && !dirty && <div className="p-3 rounded border border-green-600 text-green-700 text-sm">Salvo.</div>}

      {tab === "regras" && (
        <section className="space-y-3">
          <h2 className="font-semibold">Regras gerais</h2>
          <ListEditor
            items={draft.general_rules ?? []}
            onChange={(items) => setDraft((d) => (d ? { ...d, general_rules: items } : d))}
            placeholder="Nova regra…"
          />
          <h3 className="font-semibold pt-2">Requisitos de alquiler (comum a todos os fluxos)</h3>
          <ListEditor
            items={draft.rental_requirements ?? []}
            onChange={(items) => setDraft((d) => (d ? { ...d, rental_requirements: items } : d))}
            placeholder="Novo requisito…"
          />
          <h3 className="font-semibold pt-2">Pesquisa de satisfação</h3>
          <TextField
            label="Escala"
            value={draft.satisfaction_survey?.scale ?? ""}
            onChange={(v) =>
              setDraft((d) =>
                d ? { ...d, satisfaction_survey: { ...(d.satisfaction_survey ?? { questions: [] }), scale: v } } : d,
              )
            }
          />
          <ListEditor
            items={draft.satisfaction_survey?.questions ?? []}
            onChange={(items) =>
              setDraft((d) =>
                d ? { ...d, satisfaction_survey: { ...(d.satisfaction_survey ?? { scale: "" }), questions: items } } : d,
              )
            }
            placeholder="Nova pergunta…"
          />
        </section>
      )}

      {tab === "saudação" && (
        <section className="space-y-3">
          <h2 className="font-semibold">Saudação inicial e classificação</h2>
          <TextArea
            label="Texto da saudação"
            value={draft.greeting?.text ?? ""}
            onChange={(v) =>
              setDraft((d) => (d ? { ...d, greeting: { ...(d.greeting ?? { fallback: "" }), text: v } } : d))
            }
            rows={4}
          />
          <TextArea
            label="Fallback (input inválido)"
            value={draft.greeting?.fallback ?? ""}
            onChange={(v) =>
              setDraft((d) => (d ? { ...d, greeting: { ...(d.greeting ?? { text: "" }), fallback: v } } : d))
            }
            rows={2}
          />
        </section>
      )}

      {(tab === "paciente" || tab === "clinica" || tab === "hospital") && aud(tab) && (
        <AudienceEditor key={tab} audience={aud(tab)!} onChange={(patch) => updateAud(tab, patch)} />
      )}

      {tab === "json" && (
        <section className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Edição direta do JSON. Use só quando precisar de algo fora dos campos estruturados.
          </p>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            className="w-full h-[60vh] font-mono text-xs border rounded p-3 bg-muted/30"
            spellCheck={false}
          />
          {jsonError && <div className="text-sm text-destructive">JSON inválido: {jsonError}</div>}
        </section>
      )}
    </div>
  );
}

function AudienceEditor({ audience, onChange }: { audience: Audience; onChange: (p: Partial<Audience>) => void }) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">{audience.label}</h2>
      <TextArea label="Mensagem de boas-vindas" value={audience.welcome} onChange={(v) => onChange({ welcome: v })} rows={3} />

      <div>
        <h3 className="font-semibold text-sm mb-1">Catálogo permitido</h3>
        <CatalogEditor items={audience.catalog ?? []} onChange={(catalog) => onChange({ catalog })} />
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-1">Dados a coletar</h3>
        <ListEditor
          items={audience.collect_data ?? []}
          onChange={(collect_data) => onChange({ collect_data })}
          placeholder="Novo campo…"
        />
      </div>

      <TextArea
        label="Mensagem — item fora do catálogo"
        value={audience.out_of_catalog}
        onChange={(v) => onChange({ out_of_catalog: v })}
        rows={2}
      />
      <TextArea
        label="Mensagem — pergunta de preço/stock"
        value={audience.price_or_stock}
        onChange={(v) => onChange({ price_or_stock: v })}
        rows={2}
      />
      <TextArea
        label="Mensagem de fechamento"
        value={audience.closing}
        onChange={(v) => onChange({ closing: v })}
        rows={2}
      />
    </section>
  );
}

function CatalogEditor({ items, onChange }: { items: CatalogItem[]; onChange: (items: CatalogItem[]) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 border rounded p-2">
          <input
            value={it.name}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={it.modalities?.includes("venta")}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          modalities: e.target.checked
                            ? Array.from(new Set([...(x.modalities ?? []), "venta"])) as Modality[]
                            : (x.modalities ?? []).filter((m) => m !== "venta"),
                        }
                      : x,
                  ),
                )
              }
            />
            venta
          </label>
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={it.modalities?.includes("alquiler")}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          modalities: e.target.checked
                            ? Array.from(new Set([...(x.modalities ?? []), "alquiler"])) as Modality[]
                            : (x.modalities ?? []).filter((m) => m !== "alquiler"),
                        }
                      : x,
                  ),
                )
              }
            />
            alquiler
          </label>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-xs text-destructive px-2"
            aria-label="Remover"
          >
            ✕
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Novo produto/equipo…"
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            onChange([...items, { name: name.trim(), modalities: ["alquiler"] }]);
            setName("");
          }}
          className="px-3 py-1 rounded border text-sm"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <div className="space-y-1">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-destructive px-2">✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (!v.trim()) return;
            onChange([...items, v.trim()]);
            setV("");
          }}
          className="px-3 py-1 rounded border text-sm"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-2 py-1" />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full border rounded px-2 py-1 font-mono text-xs" />
    </label>
  );
}
