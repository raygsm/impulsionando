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
import { Plus, Trash2, Pencil, Copy } from "lucide-react";
import { listPrompts, upsertPrompt, deletePrompt } from "@/lib/factory.functions";

export const Route = createFileRoute("/_authenticated/core/prompts")({
  head: () => ({ meta: [{ title: "Biblioteca de Prompts — Fábrica" }] }),
  component: PromptsPage,
});

type PromptRow = {
  id: string;
  name: string;
  category: string | null;
  niche: string | null;
  purpose: string | null;
  prompt: string;
  status: string;
  usage_count: number;
};

function PromptsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPrompts);
  const upsert = useServerFn(upsertPrompt);
  const remove = useServerFn(deletePrompt);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-prompts"],
    queryFn: () => list(),
  });

  const [editing, setEditing] = useState<Partial<PromptRow> | null>(null);

  const saveMut = useMutation({
    mutationFn: async (p: Partial<PromptRow>) =>
      upsert({
        data: {
          id: p.id,
          name: p.name ?? "",
          category: p.category ?? null,
          niche: p.niche ?? null,
          purpose: p.purpose ?? null,
          prompt: p.prompt ?? "",
          status: p.status ?? "active",
        },
      }),
    onSuccess: () => {
      toast.success("Prompt salvo");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["ai-prompts"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Biblioteca de Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Prompts reutilizáveis para acelerar novas implantações por IA.
          </p>
        </div>
        <Button onClick={() => setEditing({ status: "active" })}>
          <Plus className="w-4 h-4 mr-1" /> Novo prompt
        </Button>
      </div>

      {editing && (
        <Card className="p-4 space-y-3">
          <h2 className="font-medium">{editing.id ? "Editar prompt" : "Novo prompt"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Nome"
              value={editing.name ?? ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <Input
              placeholder="Categoria"
              value={editing.category ?? ""}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            />
            <Input
              placeholder="Nicho"
              value={editing.niche ?? ""}
              onChange={(e) => setEditing({ ...editing, niche: e.target.value })}
            />
          </div>
          <Input
            placeholder="Finalidade"
            value={editing.purpose ?? ""}
            onChange={(e) => setEditing({ ...editing, purpose: e.target.value })}
          />
          <Textarea
            placeholder="Conteúdo do prompt…"
            rows={8}
            value={editing.prompt ?? ""}
            onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => saveMut.mutate(editing)}
              disabled={!editing.name || !editing.prompt || saveMut.isPending}
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
          {(data?.prompts ?? []).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{p.name}</h3>
                    {p.category && <Badge variant="outline">{p.category}</Badge>}
                    {p.niche && <Badge variant="secondary">{p.niche}</Badge>}
                    <Badge>{p.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      usado {p.usage_count}x
                    </span>
                  </div>
                  {p.purpose && (
                    <p className="text-sm text-muted-foreground mt-1">{p.purpose}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 whitespace-pre-wrap">
                    {p.prompt}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Copiar"
                    onClick={() => {
                      navigator.clipboard.writeText(p.prompt);
                      toast.success("Prompt copiado");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(p as PromptRow)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Remover "${p.name}"?`)) delMut.mutate(p.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {(data?.prompts ?? []).length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhum prompt salvo ainda.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
