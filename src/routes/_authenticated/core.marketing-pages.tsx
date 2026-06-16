import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Rocket, History, ExternalLink } from "lucide-react";
import {
  fetchMarketingPagesAdmin,
  saveMarketingPageDraft,
  publishMarketingPage,
  fetchMarketingPageVersions,
} from "@/lib/marketing-site.functions";

export const Route = createFileRoute("/_authenticated/core/marketing-pages")({
  head: () => ({ meta: [{ title: "CMS /marketing — Core Impulsionando" }] }),
  component: MarketingPagesCMS,
});

function MarketingPagesCMS() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["mkt-cms-pages"],
    queryFn: () => fetchMarketingPagesAdmin({}),
  });
  const pages = data?.pages ?? [];

  const [selected, setSelected] = useState<string>("");
  useEffect(() => {
    if (!selected && pages.length) setSelected(pages[0].id);
  }, [pages, selected]);

  const current = useMemo(() => pages.find((p) => p.id === selected) ?? null, [pages, selected]);

  const [draftJson, setDraftJson] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [parseErr, setParseErr] = useState<string | null>(null);

  useEffect(() => {
    if (current) {
      setDraftJson(JSON.stringify(current.content, null, 2));
      setNote("");
      setParseErr(null);
    }
  }, [current?.id]);

  function parsedContent(): unknown | null {
    try {
      const parsed = JSON.parse(draftJson);
      setParseErr(null);
      return parsed;
    } catch (e) {
      setParseErr(String((e as Error).message));
      return null;
    }
  }

  const saveDraft = useMutation({
    mutationFn: async () => {
      const c = parsedContent();
      if (!c) throw new Error("JSON inválido");
      return saveMarketingPageDraft({ data: { pageId: selected, content: c, note: note || undefined } });
    },
    onSuccess: () => {
      toast.success("Rascunho salvo");
      qc.invalidateQueries({ queryKey: ["mkt-cms-versions", selected] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const c = parsedContent();
      if (!c) throw new Error("JSON inválido");
      return publishMarketingPage({ data: { pageId: selected, content: c, note: note || undefined } });
    },
    onSuccess: () => {
      toast.success("Página publicada — /marketing já reflete a nova versão");
      qc.invalidateQueries({ queryKey: ["mkt-cms-pages"] });
      qc.invalidateQueries({ queryKey: ["mkt-cms-versions", selected] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const versions = useQuery({
    queryKey: ["mkt-cms-versions", selected],
    queryFn: () => fetchMarketingPageVersions({ data: { pageId: selected } }),
    enabled: !!selected,
  });

  return (
    <div>
      <PageHeader
        title="CMS — Páginas /marketing"
        description="Edite o conteúdo JSON das páginas da Impulsionando Brasil, salve rascunho e publique sem redeploy."
        action={
          <a href="/marketing" target="_blank" rel="noopener" className="text-sm text-primary inline-flex items-center gap-1">
            Abrir /marketing <ExternalLink className="w-3.5 h-3.5" />
          </a>
        }
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <Card className="p-3 h-fit">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Páginas</div>
          {isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          <div className="space-y-1">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left p-2 rounded-md text-sm flex items-center justify-between gap-2 ${selected === p.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                <span className="truncate">{p.name}</span>
                <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
              </button>
            ))}
            {!isLoading && pages.length === 0 && (
              <div className="text-xs text-muted-foreground">Nenhuma página encontrada.</div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          {!current ? (
            <div className="text-sm text-muted-foreground">Selecione uma página à esquerda.</div>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">/{current.slug}</div>
                  <h2 className="text-xl font-semibold">{current.name}</h2>
                </div>
                <Badge>{current.status}</Badge>
              </div>

              <Tabs defaultValue="editor">
                <TabsList>
                  <TabsTrigger value="editor">Editor JSON</TabsTrigger>
                  <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
                  <TabsTrigger value="versions"><History className="w-3.5 h-3.5 mr-1" />Versões</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-4">
                  <Textarea
                    className="font-mono text-xs min-h-[480px]"
                    value={draftJson}
                    onChange={(e) => setDraftJson(e.target.value)}
                    spellCheck={false}
                  />
                  {parseErr && <div className="text-xs text-destructive mt-2">JSON inválido: {parseErr}</div>}
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <input
                      placeholder="Nota da versão (opcional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="flex-1 min-w-[200px] border rounded-md px-3 py-2 text-sm"
                    />
                    <Button onClick={() => saveDraft.mutate()} variant="outline" disabled={saveDraft.isPending}>
                      <Save className="w-4 h-4 mr-2" /> Salvar rascunho
                    </Button>
                    <Button onClick={() => publish.mutate()} className="bg-gradient-primary" disabled={publish.isPending}>
                      <Rocket className="w-4 h-4 mr-2" /> Publicar
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <PreviewPane raw={draftJson} />
                </TabsContent>

                <TabsContent value="versions" className="mt-4">
                  <div className="space-y-2">
                    {(versions.data?.versions ?? []).map((v) => (
                      <div key={v.id} className="border rounded-md p-3 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium">{v.status === "published" ? "Publicada" : "Rascunho"}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(v.created_at).toLocaleString("pt-BR")} {v.note ? `· ${v.note}` : ""}
                          </div>
                        </div>
                        <Badge variant={v.status === "published" ? "default" : "outline"}>{v.status}</Badge>
                      </div>
                    ))}
                    {(versions.data?.versions ?? []).length === 0 && (
                      <div className="text-sm text-muted-foreground">Sem versões ainda. Salve um rascunho ou publique.</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function PreviewPane({ raw }: { raw: string }) {
  let parsed: any = null;
  let err: string | null = null;
  try { parsed = JSON.parse(raw); } catch (e) { err = String((e as Error).message); }
  if (err) return <div className="text-sm text-destructive">JSON inválido: {err}</div>;
  const hero = parsed?.hero ?? {};
  const features = Array.isArray(parsed?.features) ? parsed.features : [];
  const benefits = Array.isArray(parsed?.benefits) ? parsed.benefits : [];

  return (
    <div className="border rounded-lg p-6 bg-muted/30">
      <div className="max-w-3xl">
        {hero.eyebrow && <div className="text-xs uppercase tracking-wider text-primary">{hero.eyebrow}</div>}
        {hero.title && <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{hero.title}</h1>}
        {hero.subtitle && <p className="mt-2 text-muted-foreground">{hero.subtitle}</p>}
      </div>
      {features.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {features.map((f: any, i: number) => (
            <div key={i} className="border rounded-md p-3 bg-background">
              <div className="font-semibold text-sm">{f.title ?? f.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.description ?? f.body ?? ""}</div>
            </div>
          ))}
        </div>
      )}
      {benefits.length > 0 && (
        <ul className="mt-6 list-disc list-inside text-sm space-y-1">
          {benefits.map((b: any, i: number) => <li key={i}>{typeof b === "string" ? b : (b.title ?? JSON.stringify(b))}</li>)}
        </ul>
      )}
      <div className="mt-6 text-xs text-muted-foreground">
        Pré-visualização do JSON em estrutura padrão. Publicar atualiza imediatamente o site público <code>/marketing</code>.
      </div>
    </div>
  );
}
