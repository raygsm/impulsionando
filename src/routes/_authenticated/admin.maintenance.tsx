import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  listMaintenanceWindows,
  upsertMaintenanceWindow,
  deleteMaintenanceWindow,
} from "@/lib/maintenance-windows.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Row = {
  id: string;
  title: string;
  description: string | null;
  scope: string;
  url: string | null;
  severity: "info" | "minor" | "major";
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  published: boolean;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string) {
  return new Date(s).toISOString();
}

function AdminMaintenance() {
  const list = useServerFn(listMaintenanceWindows);
  const upsert = useServerFn(upsertMaintenanceWindow);
  const remove = useServerFn(deleteMaintenanceWindow);
  const router = useRouter();
  const q = useQuery({ queryKey: ["admin-maintenance"], queryFn: () => list() });
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const save = useMutation({
    mutationFn: async (payload: Partial<Row>) =>
      upsert({
        data: {
          id: payload.id,
          title: payload.title!,
          description: payload.description ?? null,
          scope: payload.scope || "platform",
          url: payload.url ?? null,
          severity: (payload.severity as any) ?? "info",
          starts_at: payload.starts_at!,
          ends_at: payload.ends_at!,
          status: (payload.status as any) ?? "scheduled",
          published: payload.published ?? true,
        },
      }),
    onSuccess: () => {
      toast.success("Janela salva");
      setEditing(null);
      router.invalidate();
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Removida");
      q.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao remover"),
  });

  const items = (q.data?.items ?? []) as Row[];

  return (
    <main className="container mx-auto max-w-5xl space-y-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manutenções programadas</h1>
          <p className="text-sm text-muted-foreground">
            Janelas exibidas em <a href="/status" className="underline">/status</a> quando publicadas.
          </p>
        </div>
        <Button
          onClick={() => {
            const start = new Date(Date.now() + 60 * 60 * 1000);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            setEditing({
              title: "",
              scope: "platform",
              severity: "info",
              status: "scheduled",
              published: true,
              starts_at: start.toISOString(),
              ends_at: end.toISOString(),
            });
          }}
        >
          Nova janela
        </Button>
      </header>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editing.id ? "Editar janela" : "Nova janela"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Título</Label>
              <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Escopo</Label>
              <Input value={editing.scope ?? ""} onChange={(e) => setEditing({ ...editing, scope: e.target.value })} />
            </div>
            <div>
              <Label>URL (opcional)</Label>
              <Input value={editing.url ?? ""} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
            </div>
            <div>
              <Label>Início</Label>
              <Input
                type="datetime-local"
                value={editing.starts_at ? toLocalInput(editing.starts_at) : ""}
                onChange={(e) => setEditing({ ...editing, starts_at: fromLocalInput(e.target.value) })}
              />
            </div>
            <div>
              <Label>Fim</Label>
              <Input
                type="datetime-local"
                value={editing.ends_at ? toLocalInput(editing.ends_at) : ""}
                onChange={(e) => setEditing({ ...editing, ends_at: fromLocalInput(e.target.value) })}
              />
            </div>
            <div>
              <Label>Severidade</Label>
              <Select value={editing.severity ?? "info"} onValueChange={(v) => setEditing({ ...editing, severity: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="minor">Menor</SelectItem>
                  <SelectItem value="major">Maior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editing.status ?? "scheduled"} onValueChange={(v) => setEditing({ ...editing, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="in_progress">Em curso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editing.published ?? true}
                onCheckedChange={(v) => setEditing({ ...editing, published: v })}
              />
              <Label>Publicada (visível em /status)</Label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button disabled={save.isPending || !editing.title || !editing.starts_at || !editing.ends_at} onClick={() => save.mutate(editing)}>
                {save.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Janelas registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma janela registrada.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((m) => (
                <li key={m.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.scope}{m.url ? ` · ${m.url}` : ""} · {new Date(m.starts_at).toLocaleString("pt-BR")} → {new Date(m.ends_at).toLocaleString("pt-BR")} · {m.status} · {m.severity}{m.published ? "" : " · (oculta)"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Editar</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Remover janela?")) del.mutate(m.id);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export const Route = createFileRoute("/_authenticated/admin/maintenance")({
  component: AdminMaintenance,
});
