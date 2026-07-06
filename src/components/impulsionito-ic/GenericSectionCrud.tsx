import { useMemo, useState } from "react";
import type { ICItem, ICSectionKey } from "@/lib/impulsionito-ic/types";
import { useICItems } from "@/lib/impulsionito-ic/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, History, Pencil, PowerOff, Trash2, Plus, Search } from "lucide-react";

type Props = {
  section: ICSectionKey;
  title: string;
  description?: string;
  bodyLabel?: string;
};

function fmt(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function GenericSectionCrud({ section, title, description, bodyLabel = "Conteúdo" }: Props) {
  const { items, upsert, setStatus, remove } = useICItems(section);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ICItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [historyOf, setHistoryOf] = useState<ICItem | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.body.toLowerCase().includes(q) ||
        (i.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-64"
              placeholder="Buscar…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhum item cadastrado nesta seção.
            </CardContent>
          </Card>
        ) : (
          filtered.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{item.title}</CardTitle>
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <Badge
                      variant={
                        item.status === "ativo"
                          ? "default"
                          : item.status === "rascunho"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {item.status}
                    </Badge>
                    <span>v{item.version}</span>
                    <span>· atualizado {fmt(item.updatedAt)}</span>
                    <span>· por {item.updatedBy}</span>
                    {(item.tags ?? []).map((t) => (
                      <Badge key={t} variant="outline" className="font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setHistoryOf(item)}>
                    <History className="h-4 w-4" />
                  </Button>
                  {item.status === "ativo" ? (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(item.id, "inativo")}>
                      <PowerOff className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(item.id, "ativo")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Remover este item?")) remove(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-4">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ItemDialog
        open={creating || !!editing}
        item={editing}
        bodyLabel={bodyLabel}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={(draft) => {
          upsert({ ...(editing ? { id: editing.id } : {}), ...draft });
          setCreating(false);
          setEditing(null);
        }}
      />

      <HistoryDialog item={historyOf} onClose={() => setHistoryOf(null)} />
    </div>
  );
}

function ItemDialog({
  open,
  item,
  bodyLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  item: ICItem | null;
  bodyLabel: string;
  onClose: () => void;
  onSubmit: (draft: { title: string; body: string; tags: string[]; status: ICItem["status"] }) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [tags, setTags] = useState((item?.tags ?? []).join(", "));
  const [status, setStatusLocal] = useState<ICItem["status"]>(item?.status ?? "rascunho");

  // reset when item changes
  useMemo(() => {
    setTitle(item?.title ?? "");
    setBody(item?.body ?? "");
    setTags((item?.tags ?? []).join(", "));
    setStatusLocal(item?.status ?? "rascunho");
  }, [item]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">{bodyLabel}</label>
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-muted-foreground">Tags (vírgula)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v) => setStatusLocal(v as ICItem["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!title.trim() || !body.trim()}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                body: body.trim(),
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
                status,
              })
            }
          >
            Salvar (nova versão)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ item, onClose }: { item: ICItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico — {item?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {(item?.history ?? [])
            .slice()
            .reverse()
            .map((h) => (
              <div key={h.version} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>v{h.version} · {fmt(h.updatedAt)}</span>
                  <span>{h.updatedBy}</span>
                </div>
                {h.note ? <div className="mt-1 text-muted-foreground">{h.note}</div> : null}
                <pre className="mt-2 text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(h.snapshot, null, 2)}
                </pre>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
