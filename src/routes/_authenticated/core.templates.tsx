import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import {
  listSiteTemplates,
  upsertSiteTemplate,
  deleteSiteTemplate,
} from "@/lib/factory.functions";

export const Route = createFileRoute("/_authenticated/core/templates")({
  head: () => ({ meta: [{ title: "Templates de Site — Fábrica" }] }),
  component: TemplatesPage,
});

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  niche: string | null;
  description: string | null;
  pages: unknown;
  sections: unknown;
  default_colors: unknown;
  status: string;
};

function TemplatesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listSiteTemplates);
  const upsert = useServerFn(upsertSiteTemplate);
  const remove = useServerFn(deleteSiteTemplate);

  const { data, isLoading } = useQuery({
    queryKey: ["site-templates"],
    queryFn: () => list(),
  });

  const [editing, setEditing] = useState<Partial<TemplateRow> | null>(null);

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<TemplateRow>) =>
      upsert({
        data: {
          id: payload.id,
          name: payload.name ?? "",
          slug: payload.slug ?? "",
          niche: payload.niche ?? null,
          description: payload.description ?? null,
          pages: payload.pages ?? [],
          sections: payload.sections ?? [],
          default_colors: payload.default_colors ?? {},
          status: payload.status ?? "active",
        },
      }),
    onSuccess: () => {
      toast.success("Template salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["site-templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["site-templates"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Templates de Site</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de templates reutilizáveis aplicados pela Fábrica de Projetos.
          </p>
        </div>
        <Button onClick={() => setEditing({ status: "active" })}>
          <Plus className="w-4 h-4 mr-1" /> Novo template
        </Button>
      </div>

      {editing && (
        <Card className="p-4 space-y-3">
          <h2 className="font-medium">{editing.id ? "Editar template" : "Novo template"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Nome"
              value={editing.name ?? ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              placeholder="Slug (ex: agenda-estetica)"
              value={editing.slug ?? ""}
              onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
            />
            <Input
              placeholder="Nicho"
              value={editing.niche ?? ""}
              onChange={(e) => setEditing({ ...editing, niche: e.target.value })}
            />
            <Input
              placeholder="Status (active/draft)"
              value={editing.status ?? "active"}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Descrição"
            value={editing.description ?? ""}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
          />
          <Textarea
            placeholder='Páginas (JSON, ex: ["home","sobre","contato"])'
            rows={3}
            value={
              typeof editing.pages === "string"
                ? (editing.pages as string)
                : JSON.stringify(editing.pages ?? [], null, 2)
            }
            onChange={(e) => {
              try {
                setEditing({ ...editing, pages: JSON.parse(e.target.value) });
              } catch {
                setEditing({ ...editing, pages: e.target.value as unknown });
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => saveMut.mutate(editing)}
              disabled={!editing.name || !editing.slug || saveMut.isPending}
            >
              Salvar
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="grid gap-3">
          {(data?.templates ?? []).map((t) => (
            <Card key={t.id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{t.name}</h3>
                  <Badge variant="outline">{t.slug}</Badge>
                  {t.niche && <Badge variant="secondary">{t.niche}</Badge>}
                  <Badge>{t.status}</Badge>
                </div>
                {t.description && (
                  <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(t as TemplateRow)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Remover "${t.name}"?`)) delMut.mutate(t.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
          {(data?.templates ?? []).length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhum template cadastrado ainda.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
