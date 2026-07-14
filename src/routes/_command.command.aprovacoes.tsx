import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  listAutomationRequests,
  resolveAutomationApproval,
  getAutomationApprovalCounts,
} from "@/lib/automation-approvals.functions";
import { CommandPage } from "@/components/command/CommandPage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Check, X, Loader2, Filter, RefreshCw } from "lucide-react";

type Status = "all" | "pending" | "approved" | "rejected" | "registered";

const searchSchema = z.object({
  status: fallback(z.string(), "pending").default("pending"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_command/command/aprovacoes")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Aprovações · Command" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

type Row = {
  id: string;
  tenant_slug: string | null;
  mode: string;
  regua: string | null;
  action: string;
  files: unknown;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  registered: "Registrado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
  registered: "outline",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Page() {
  const { status, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const list = useServerFn(listAutomationRequests);
  const counts = useServerFn(getAutomationApprovalCounts);
  const resolve = useServerFn(resolveAutomationApproval);

  const rowsQ = useQuery({
    queryKey: ["approvals", "list"],
    queryFn: () => list({ data: { limit: 100 } }) as Promise<Row[]>,
  });

  const countsQ = useQuery({
    queryKey: ["approvals", "counts"],
    queryFn: () => counts({ data: {} }),
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const filtered = useMemo(() => {
    const rows = rowsQ.data ?? [];
    const qLower = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!qLower) return true;
      return (
        r.tenant_slug?.toLowerCase().includes(qLower) ||
        r.regua?.toLowerCase().includes(qLower) ||
        r.action.toLowerCase().includes(qLower) ||
        r.id.includes(qLower)
      );
    });
  }, [rowsQ.data, status, q]);

  const current = filtered.find((r) => r.id === openId) ?? null;

  const resolveMut = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject"; note: string }) =>
      resolve({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.action === "approve" ? "Aprovado" : "Rejeitado");
      setOpenId(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = (s: Status) =>
    navigate({ search: (p) => ({ ...p, status: s }), replace: true });
  const setQ = (v: string) =>
    navigate({ search: (p) => ({ ...p, q: v }), replace: true });

  const c = countsQ.data ?? { pending: 0, approved: 0, rejected: 0, registered: 0, total: 0 };

  return (
    <CommandPage
      title="Aprovações"
      description="Fila única de solicitações — aprove ou rejeite com histórico completo."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: ["approvals"] })}
          disabled={rowsQ.isFetching}
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${rowsQ.isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      }
    >
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        {(
          [
            ["pending", "Pendentes", c.pending],
            ["approved", "Aprovadas", c.approved],
            ["rejected", "Rejeitadas", c.rejected],
            ["registered", "Registradas", c.registered],
            ["all", "Total", c.total],
          ] as const
        ).map(([key, label, n]) => (
          <button
            key={key}
            onClick={() => setStatus(key as Status)}
            className={`text-left border rounded-lg p-3 transition hover:bg-accent ${
              status === key ? "border-primary bg-accent/40" : "bg-card"
            }`}
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold mt-0.5">{n}</p>
          </button>
        ))}
      </div>

      <Card className="p-3 flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tenant, régua, ação, id…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm h-9"
        />
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} resultado(s)
        </span>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Tenant</th>
                <th className="text-left px-4 py-2">Ação</th>
                <th className="text-left px-4 py-2">Régua</th>
                <th className="text-left px-4 py-2">Modo</th>
                <th className="text-left px-4 py-2">Idade</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rowsQ.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="size-4 animate-spin inline" />
                  </td>
                </tr>
              )}
              {!rowsQ.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma solicitação neste filtro.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t hover:bg-accent/40 cursor-pointer"
                  onClick={() => {
                    setOpenId(r.id);
                    setNote(r.note ?? "");
                  }}
                >
                  <td className="px-4 py-2">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{r.tenant_slug ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-4 py-2">{r.regua ?? "—"}</td>
                  <td className="px-4 py-2">{r.mode}</td>
                  <td className="px-4 py-2 text-muted-foreground">{timeAgo(r.created_at)}</td>
                  <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700"
                          disabled={resolveMut.isPending}
                          onClick={() =>
                            resolveMut.mutate({ id: r.id, action: "approve", note: "" })
                          }
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => {
                            setOpenId(r.id);
                            setNote("");
                          }}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Ver</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={Boolean(current)} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {current && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Solicitação
                  <Badge variant={STATUS_VARIANT[current.status] ?? "outline"}>
                    {STATUS_LABEL[current.status] ?? current.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {current.id}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                <dl className="grid grid-cols-3 gap-2">
                  <dt className="text-muted-foreground">Tenant</dt>
                  <dd className="col-span-2">{current.tenant_slug ?? "—"}</dd>
                  <dt className="text-muted-foreground">Ação</dt>
                  <dd className="col-span-2 font-mono">{current.action}</dd>
                  <dt className="text-muted-foreground">Régua</dt>
                  <dd className="col-span-2">{current.regua ?? "—"}</dd>
                  <dt className="text-muted-foreground">Modo</dt>
                  <dd className="col-span-2">{current.mode}</dd>
                  <dt className="text-muted-foreground">Criado</dt>
                  <dd className="col-span-2">
                    {new Date(current.created_at).toLocaleString("pt-BR")}
                  </dd>
                  <dt className="text-muted-foreground">Atualizado</dt>
                  <dd className="col-span-2">
                    {new Date(current.updated_at).toLocaleString("pt-BR")}
                  </dd>
                </dl>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Arquivos</p>
                  <pre className="text-xs bg-muted/50 rounded p-2 max-h-40 overflow-auto">
                    {JSON.stringify(current.files, null, 2)}
                  </pre>
                </div>

                {current.status === "pending" ? (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Nota (opcional para aprovar, obrigatória para rejeitar)
                    </label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Motivo, contexto, orientação…"
                    />
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        variant="destructive"
                        disabled={resolveMut.isPending || !note.trim()}
                        onClick={() =>
                          resolveMut.mutate({ id: current.id, action: "reject", note })
                        }
                      >
                        <X className="size-4 mr-1" /> Rejeitar
                      </Button>
                      <Button
                        disabled={resolveMut.isPending}
                        onClick={() =>
                          resolveMut.mutate({ id: current.id, action: "approve", note })
                        }
                      >
                        <Check className="size-4 mr-1" /> Aprovar
                      </Button>
                    </div>
                  </div>
                ) : (
                  current.note && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nota</p>
                      <p className="text-sm bg-muted/50 rounded p-2">{current.note}</p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </CommandPage>
  );
}
