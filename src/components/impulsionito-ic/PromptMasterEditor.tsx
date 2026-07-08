import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useICItems, usePromptVersions } from "@/lib/impulsionito-ic/store";
import type { ICSectionKey } from "@/lib/impulsionito-ic/types";
import { CheckCircle2, Copy, Save } from "lucide-react";

const COMPOSITION: { key: ICSectionKey | "contexto"; label: string; hint: string }[] = [
  { key: "prompt-mestre", label: "Prompt Mestre (núcleo)", hint: "Item ativo em Prompt Mestre" },
  { key: "servicos", label: "Serviços", hint: "Itens ativos" },
  { key: "planos", label: "Planos", hint: "Itens ativos" },
  { key: "modulos", label: "Módulos", hint: "Itens ativos" },
  { key: "faq", label: "FAQ", hint: "Itens ativos" },
  { key: "nichos", label: "Nichos", hint: "Itens ativos" },
  { key: "aprendizados", label: "Aprendizados aprovados", hint: "Convertidos em conhecimento" },
  { key: "contexto", label: "Contexto dinâmico", hint: "Página atual + tenant + perfil + histórico recente" },
];

function useActiveItems(section: ICSectionKey) {
  return useICItems(section).items.filter((i) => i.status === "ativo");
}

export function PromptMasterEditor() {
  const nucleus = useActiveItems("prompt-mestre");
  const services = useActiveItems("servicos");
  const plans = useActiveItems("planos");
  const modules = useActiveItems("modulos");
  const faqs = useActiveItems("faq");
  const niches = useActiveItems("nichos");
  const { items: promptVersions, publish, activate } = usePromptVersions();

  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "prompt-mestre": true,
    servicos: true,
    planos: true,
    modulos: true,
    faq: true,
    nichos: true,
    aprendizados: false,
    contexto: true,
  });
  const [note, setNote] = useState("");

  const composed = useMemo(() => {
    const parts: string[] = [];
    if (enabled["prompt-mestre"]) parts.push(...nucleus.map((n) => `# NÚCLEO\n${n.body}`));
    if (enabled.servicos) parts.push("## SERVIÇOS\n" + services.map((s) => `- ${s.title}: ${s.body}`).join("\n"));
    if (enabled.planos) parts.push("## PLANOS\n" + plans.map((p) => `- ${p.title}: ${p.body}`).join("\n"));
    if (enabled.modulos) parts.push("## MÓDULOS\n" + modules.map((m) => `- ${m.title}: ${m.body}`).join("\n"));
    if (enabled.nichos) parts.push("## NICHOS\n" + niches.map((n) => `- ${n.title}: ${n.body}`).join("\n"));
    if (enabled.faq) parts.push("## FAQ\n" + faqs.map((f) => `Q: ${f.title}\nA: ${f.body}`).join("\n\n"));
    if (enabled.aprendizados)
      parts.push("## APRENDIZADOS APROVADOS\n(Nenhum aprendizado aprovado ainda. Os itens aparecem aqui após aprovação na aba Aprendizados.)");
    if (enabled.contexto)
      parts.push(
        "## CONTEXTO DINÂMICO\n- Página atual: {{pathname}}\n- Tenant: {{tenant}}\n- Perfil: {{profile}}\n- Histórico recente: {{recent_messages}}",
      );
    return parts.join("\n\n");
  }, [enabled, nucleus, services, plans, modules, niches, faqs]);

  const active = promptVersions.find((v) => v.activated);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Composição dinâmica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {COMPOSITION.map((c) => (
              <label
                key={c.key}
                className="flex items-start gap-2 rounded-md border p-2 hover:bg-muted/40 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!enabled[c.key]}
                  onChange={(e) => setEnabled((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                />
                <div className="min-w-0">
                  <div className="font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.hint}</div>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Versões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {active ? (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
                <div className="flex items-center gap-2">
                  <Badge>Ativa</Badge>
                  <span className="font-medium">v{active.version}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{active.note}</div>
              </div>
            ) : (
              <div className="text-muted-foreground">Nenhuma versão ativa.</div>
            )}
            <Separator />
            <ul className="space-y-1 max-h-56 overflow-y-auto">
              {promptVersions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 text-xs">
                  <span>
                    v{v.version} · {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  {!v.activated ? (
                    <Button size="sm" variant="ghost" onClick={() => activate(v.id)}>
                      Ativar
                    </Button>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Prévia do Prompt Mestre montado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              readOnly
              value={composed}
              rows={22}
              className="font-mono text-xs bg-muted/40"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(composed);
                }}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
              <input
                className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
                placeholder="Nota da nova versão (ex.: incluído módulo suporte)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                disabled={!note.trim()}
                onClick={() => {
                  const comp = Object.entries(enabled)
                    .filter(([, v]) => v)
                    .map(([k]) => COMPOSITION.find((c) => c.key === k)?.label ?? k);
                  publish(note.trim(), comp);
                  setNote("");
                }}
              >
                <Save className="h-4 w-4 mr-1" />
                Publicar versão
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O Prompt Mestre nunca fica fixo no código. É montado dinamicamente a cada
              chamada, combinando os blocos ativos + contexto (página, tenant, perfil,
              histórico).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
