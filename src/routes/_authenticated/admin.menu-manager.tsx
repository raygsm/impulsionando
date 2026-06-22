// Admin Master Menu Manager — CRUD super-only para `core_admin_menu`.
// Permite criar/editar/desabilitar/reordenar itens do menu master sem deploy.
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listAdminMenuAll,
  upsertAdminMenuItem,
  deleteAdminMenuItem,
  toggleAdminMenuItem,
  reorderAdminMenu,
  type AdminMenuItem,
} from "@/lib/admin-menu.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/menu-manager")({
  component: MenuManager,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center gap-2 text-destructive mb-3">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Erro no Menu Manager</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">Página não encontrada.</div>,
});

type Draft = Partial<AdminMenuItem> & { id?: string };

const EMPTY: Draft = {
  vertente: "impulsionando",
  group_key: "",
  group_label: "",
  group_order: 0,
  item_key: "",
  item_label: "",
  item_order: 0,
  route: "/admin/",
  icon: "",
  description: "",
  enabled: true,
};

function MenuManager() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAdminMenuAll);
  const upsertFn = useServerFn(upsertAdminMenuItem);
  const deleteFn = useServerFn(deleteAdminMenuItem);
  const toggleFn = useServerFn(toggleAdminMenuItem);
  const reorderFn = useServerFn(reorderAdminMenu);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-menu-all"],
    queryFn: () => fetchAll({ data: undefined as any }),
  });

  const [tab, setTab] = useState<"impulsionando" | "clientes">("impulsionando");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-menu-all"] });
    qc.invalidateQueries({ queryKey: ["admin-master-hub"] });
  };

  const upsertMut = useMutation({
    mutationFn: (d: Draft) => upsertFn({ data: d as any }),
    onSuccess: () => { toast.success("Item salvo."); invalidate(); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Item removido."); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleFn({ data: { id, enabled } }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });
  const reorderMut = useMutation({
    mutationFn: (items: { id: string; item_order: number }[]) => reorderFn({ data: { items } }),
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message),
  });

  const items = (data?.items ?? []) as AdminMenuItem[];
  const filtered = items.filter((i) => i.vertente === tab);

  // Group by group_key for visual reorder
  const grouped = useMemo(() => {
    const m = new Map<string, AdminMenuItem[]>();
    for (const it of filtered) {
      const arr = m.get(it.group_key) ?? [];
      arr.push(it);
      m.set(it.group_key, arr);
    }
    return Array.from(m.entries()).map(([key, arr]) => ({
      key,
      label: arr[0].group_label,
      order: arr[0].group_order,
      items: arr.sort((a, b) => a.item_order - b.item_order),
    })).sort((a, b) => a.order - b.order);
  }, [filtered]);

  const move = (group: AdminMenuItem[], idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= group.length) return;
    const a = group[idx], b = group[j];
    reorderMut.mutate([
      { id: a.id, item_order: b.item_order },
      { id: b.id, item_order: a.item_order },
    ]);
  };

  const startCreate = () => { setDraft({ ...EMPTY, vertente: tab }); setOpen(true); };
  const startEdit = (it: AdminMenuItem) => { setDraft({ ...it }); setOpen(true); };

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando…</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Manager (Administração Master)</h1>
          <p className="text-sm text-muted-foreground">
            Tabela <code>core_admin_menu</code> — toda nova tela admin entra por aqui, sem hardcode.
          </p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo item
        </Button>
      </header>

      <div className="flex gap-2">
        {(["impulsionando", "clientes"] as const).map((v) => (
          <Button key={v} variant={tab === v ? "default" : "outline"} onClick={() => setTab(v)}>
            {v === "impulsionando" ? "Impulsionando" : "Clientes"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grouped.map((g) => (
          <Card key={g.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{g.label}</span>
                <Badge variant="outline">ordem {g.order}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">grupo: {g.key}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {g.items.map((it, idx) => (
                <div key={it.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <div className="flex flex-col">
                    <Button size="icon" variant="ghost" className="h-5 w-5"
                      onClick={() => move(g.items, idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5"
                      onClick={() => move(g.items, idx, 1)} disabled={idx === g.items.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.item_label}</div>
                    <div className="text-xs text-muted-foreground truncate">{it.route}</div>
                  </div>
                  <Switch
                    checked={it.enabled}
                    onCheckedChange={(v) => toggleMut.mutate({ id: it.id, enabled: v })}
                  />
                  <Button size="icon" variant="ghost" onClick={() => startEdit(it)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost"
                    onClick={() => { if (confirm(`Remover "${it.item_label}"?`)) deleteMut.mutate(it.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar item" : "Novo item de menu"}</DialogTitle>
            <DialogDescription>Tudo persistido em <code>core_admin_menu</code>.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vertente">
                <Select value={draft.vertente} onValueChange={(v) => setDraft({ ...draft, vertente: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impulsionando">Impulsionando</SelectItem>
                    <SelectItem value="clientes">Clientes</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Habilitado">
                <div className="h-9 flex items-center">
                  <Switch checked={!!draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} />
                </div>
              </Field>
              <Field label="Group key"><Input value={draft.group_key ?? ""} onChange={(e) => setDraft({ ...draft, group_key: e.target.value })} /></Field>
              <Field label="Group label"><Input value={draft.group_label ?? ""} onChange={(e) => setDraft({ ...draft, group_label: e.target.value })} /></Field>
              <Field label="Group order"><Input type="number" value={draft.group_order ?? 0} onChange={(e) => setDraft({ ...draft, group_order: Number(e.target.value) })} /></Field>
              <Field label="Item order"><Input type="number" value={draft.item_order ?? 0} onChange={(e) => setDraft({ ...draft, item_order: Number(e.target.value) })} /></Field>
              <Field label="Item key"><Input value={draft.item_key ?? ""} onChange={(e) => setDraft({ ...draft, item_key: e.target.value })} /></Field>
              <Field label="Item label"><Input value={draft.item_label ?? ""} onChange={(e) => setDraft({ ...draft, item_label: e.target.value })} /></Field>
              <Field label="Rota" full><Input value={draft.route ?? ""} onChange={(e) => setDraft({ ...draft, route: e.target.value })} placeholder="/admin/..." /></Field>
              <Field label="Ícone (lucide)"><Input value={draft.icon ?? ""} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} /></Field>
              <Field label="Descrição" full>
                <Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => draft && upsertMut.mutate(draft)} disabled={upsertMut.isPending}>
              {upsertMut.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
