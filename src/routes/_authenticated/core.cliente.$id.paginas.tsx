import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Wand2, ExternalLink } from "lucide-react";
import {
  listSiteTemplates,
  listGeneratedPagesByCompany,
  applyTemplateToProject,
  upsertGeneratedPage,
  deleteGeneratedPage,
} from "@/lib/factory.functions";

export const Route = createFileRoute("/_authenticated/core/cliente/$id/paginas")({
  head: () => ({ meta: [{ title: "Páginas do Projeto — Fábrica" }] }),
  component: PaginasProjetoPage,
});

function PaginasProjetoPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [templateId, setTemplateId] = useState<string | undefined>();

  const listTpl = useServerFn(listSiteTemplates);
  const listPages = useServerFn(listGeneratedPagesByCompany);
  const apply = useServerFn(applyTemplateToProject);
  const create = useServerFn(upsertGeneratedPage);
  const remove = useServerFn(deleteGeneratedPage);

  const { data: tplData } = useQuery({ queryKey: ["site-templates"], queryFn: () => listTpl() });
  const { data: pagesData } = useQuery({
    queryKey: ["generated-pages", id],
    queryFn: () => listPages({ data: { companyId: id } }),
  });

  const applyMut = useMutation({
    mutationFn: async () => {
      if (!templateId) throw new Error("Selecione um template");
      return apply({ data: { companyId: id, templateId } });
    },
    onSuccess: (r) => {
      toast.success(`${r.created.length} páginas criadas a partir do template`);
      qc.invalidateQueries({ queryKey: ["generated-pages", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: async () =>
      create({
        data: {
          companyId: id,
          name: "Nova página",
          slug: `pagina-${Date.now()}`,
          content: { sections: [] },
          status: "draft",
        },
      }),
    onSuccess: () => {
      toast.success("Página criada");
      qc.invalidateQueries({ queryKey: ["generated-pages", id] });
    },
  });

  const delMut = useMutation({
    mutationFn: async (pageId: string) => remove({ data: { id: pageId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["generated-pages", id] }),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> Páginas do Projeto
        </h1>
        <p className="text-sm text-muted-foreground">
          Aplique um template por nicho, edite páginas e use prompts salvos. Recorra ao Lovable apenas para estruturas inéditas.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">Aplicar template ao projeto</div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Selecione um template…" /></SelectTrigger>
            <SelectContent>
              {(tplData?.templates ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {t.niche ? `· ${t.niche}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => applyMut.mutate()} disabled={!templateId || applyMut.isPending}>
            <Wand2 className="w-4 h-4 mr-1" /> Aplicar template
          </Button>
          <Button variant="outline" onClick={() => createMut.mutate()}>
            <Plus className="w-4 h-4 mr-1" /> Página em branco
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Templates e prompts são reaproveitados de <Link to="/core/templates" className="underline">/core/templates</Link> e <Link to="/core/prompts" className="underline">/core/prompts</Link>.
        </p>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Páginas geradas</div>
        <div className="grid gap-2">
          {(pagesData?.pages ?? []).map((p) => {
            const page = p as { id: string; name: string; slug: string; status: string; updated_at: string };
            return (
              <div key={page.id} className="border rounded p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{page.name}</div>
                  <div className="text-xs text-muted-foreground">/{page.slug} · atualizada em {new Date(page.updated_at).toLocaleDateString("pt-BR")}</div>
                </div>
                <div className="flex gap-1 items-center">
                  <Badge variant="outline">{page.status}</Badge>
                  <Link to="/core/cliente/$id/paginas/$pageId" params={{ id, pageId: page.id }}>
                    <Button size="sm" variant="outline"><ExternalLink className="w-4 h-4 mr-1" /> Editar</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover página?")) delMut.mutate(page.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {(pagesData?.pages ?? []).length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma página criada ainda. Aplique um template ou crie uma página em branco.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
