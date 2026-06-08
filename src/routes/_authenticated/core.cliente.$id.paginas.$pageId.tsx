import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Copy, Wand2, Code2 } from "lucide-react";
import {
  getGeneratedPage,
  upsertGeneratedPage,
  getProjectVariables,
  listPrompts,
  incrementPromptUsage,
} from "@/lib/factory.functions";
import { PAGE_VARIABLES, renderTemplate } from "@/data/pageVariables";
import { PAGE_SECTIONS, defaultSectionsForNiche, type PageSectionInstance } from "@/data/pageSections";

export const Route = createFileRoute("/_authenticated/core/cliente/$id/paginas/$pageId")({
  head: () => ({ meta: [{ title: "Editar Página — Fábrica" }] }),
  component: EditorPaginaPage,
});

interface PageContent {
  sections?: PageSectionInstance[];
  prompt?: string;
  objective?: string;
  niche?: string;
}

function EditorPaginaPage() {
  const { id, pageId } = Route.useParams();
  const qc = useQueryClient();

  const getPage = useServerFn(getGeneratedPage);
  const upsert = useServerFn(upsertGeneratedPage);
  const getVars = useServerFn(getProjectVariables);
  const listPrm = useServerFn(listPrompts);
  const incPrm = useServerFn(incrementPromptUsage);

  const { data: pageData } = useQuery({
    queryKey: ["generated-page", pageId],
    queryFn: () => getPage({ data: { id: pageId } }),
  });
  const { data: varsData } = useQuery({
    queryKey: ["project-vars", id],
    queryFn: () => getVars({ data: { companyId: id } }),
  });
  const { data: prmData } = useQuery({ queryKey: ["prompt-library"], queryFn: () => listPrm() });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [sections, setSections] = useState<PageSectionInstance[]>([]);
  const [prompt, setPrompt] = useState("");
  const [objective, setObjective] = useState("");
  const [niche, setNiche] = useState("");

  useEffect(() => {
    if (!pageData?.page) return;
    const p = pageData.page as { name: string; slug: string; status: string; content: PageContent; prompt_used: string | null };
    setName(p.name);
    setSlug(p.slug);
    setStatus(p.status);
    const ct = (p.content ?? {}) as PageContent;
    setSections(ct.sections?.length ? ct.sections : defaultSectionsForNiche(ct.niche));
    setPrompt(p.prompt_used ?? ct.prompt ?? "");
    setObjective(ct.objective ?? "");
    setNiche(ct.niche ?? "");
  }, [pageData]);

  const vars = varsData?.variables ?? ({} as Record<string, string>);

  const saveMut = useMutation({
    mutationFn: async () =>
      upsert({
        data: {
          id: pageId,
          companyId: id,
          name,
          slug,
          status,
          promptUsed: prompt || null,
          content: { sections, prompt, objective, niche } as never,
        },
      }),
    onSuccess: () => {
      toast.success("Página salva");
      qc.invalidateQueries({ queryKey: ["generated-page", pageId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copyPromptForLovable() {
    const rendered = renderTemplate(prompt || "", vars);
    navigator.clipboard.writeText(rendered);
    toast.success("Prompt copiado com variáveis substituídas — cole no Lovable");
  }

  function reusePrompt(promptId: string) {
    const p = (prmData?.prompts ?? []).find((x) => (x as { id: string }).id === promptId) as
      | { id: string; prompt: string; name: string }
      | undefined;
    if (!p) return;
    setPrompt(p.prompt);
    incPrm({ data: { id: p.id } });
    toast.success(`Prompt "${p.name}" carregado`);
  }

  function toggleSection(key: string, enabled: boolean) {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, enabled } : s)));
  }
  function patchSection(key: string, field: keyof PageSectionInstance, value: string) {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/core/cliente/$id/paginas" params={{ id }}>
          <Button size="sm" variant="ghost"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
        </Link>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvar
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid md:grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Nicho</Label>
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="ex: clinica" />
          </div>
          <div>
            <Label className="text-xs">Objetivo</Label>
            <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="ex: capturar leads" />
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm font-medium flex items-center gap-2"><Code2 className="w-4 h-4" /> Prompt da página</div>
          <div className="flex gap-2 items-center">
            <Select onValueChange={reusePrompt}>
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Reusar prompt salvo…" /></SelectTrigger>
              <SelectContent>
                {(prmData?.prompts ?? []).map((p) => {
                  const pr = p as { id: string; name: string; category: string | null };
                  return <SelectItem key={pr.id} value={pr.id}>{pr.name} {pr.category ? `· ${pr.category}` : ""}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={copyPromptForLovable}>
              <Copy className="w-4 h-4 mr-1" /> Copiar para Lovable
            </Button>
          </div>
        </div>
        <Textarea
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Use {{nome_cliente}}, {{nicho}}, {{whatsapp}}, etc."
        />
        <div className="text-[11px] text-muted-foreground">
          Variáveis disponíveis: {PAGE_VARIABLES.map((v) => `{{${v.key}}}`).join(", ")}
        </div>
        <div className="text-[11px] bg-muted/40 p-2 rounded">
          <strong>Pré-visualização do prompt renderizado:</strong>
          <pre className="whitespace-pre-wrap mt-1">{renderTemplate(prompt || "—", vars)}</pre>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Use templates e prompts salvos para criar páginas sem depender de créditos. Recorra ao Lovable apenas quando precisar de uma estrutura nova ainda inexistente.
        </p>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="text-sm font-medium flex items-center gap-2"><Wand2 className="w-4 h-4" /> Seções da página</div>
        <p className="text-[11px] text-muted-foreground">Ative/desative seções e edite os textos. Variáveis são substituídas no preview.</p>
        <div className="grid gap-2">
          {sections.sort((a, b) => a.order - b.order).map((s) => {
            const def = PAGE_SECTIONS.find((d) => d.key === s.key);
            return (
              <div key={s.key} className={`border rounded p-3 ${!s.enabled ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-sm">{def?.label ?? s.key}</div>
                    <div className="text-[11px] text-muted-foreground">{def?.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">#{s.order + 1}</Badge>
                    <Switch checked={s.enabled} onCheckedChange={(c) => toggleSection(s.key, c)} />
                  </div>
                </div>
                {s.enabled && (
                  <div className="grid md:grid-cols-2 gap-2">
                    <Input placeholder="Título" value={s.title ?? ""} onChange={(e) => patchSection(s.key, "title", e.target.value)} />
                    <Input placeholder="Subtítulo" value={s.subtitle ?? ""} onChange={(e) => patchSection(s.key, "subtitle", e.target.value)} />
                    <Textarea placeholder="Texto" rows={2} value={s.body ?? ""} onChange={(e) => patchSection(s.key, "body", e.target.value)} className="md:col-span-2" />
                    <Input placeholder="CTA" value={s.cta ?? ""} onChange={(e) => patchSection(s.key, "cta", e.target.value)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
