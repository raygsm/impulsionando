import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShieldAlert, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listImpersonationAudit } from "@/lib/impersonation-audit.functions";

export const Route = createFileRoute("/_authenticated/admin/impersonation-audit")({
  component: ImpersonationAuditPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button size="sm" onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Página não encontrada.</div>,
});

function ImpersonationAuditPage() {
  const fn = useServerFn(listImpersonationAudit);
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["impersonation-audit"],
    queryFn: () => fn({ data: { limit: 300 } } as any),
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const list = (query.data?.rows ?? []) as any[];
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((r) =>
      `${r.actor_email ?? ""} ${r.target_company_name ?? ""} ${r.reason ?? ""}`.toLowerCase().includes(needle),
    );
  }, [query.data, q]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Auditoria de Impersonação</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()} className="gap-2">
          <RefreshCcw className="size-4" /> Atualizar
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Registro de cada início/encerramento de impersonação pela equipe Impulsionando.
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <CardTitle className="text-base">Eventos recentes</CardTitle>
          <div className="ml-auto w-64">
            <Input placeholder="Filtrar por e-mail, tenant ou motivo…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem registros.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.action === "start" ? "default" : "secondary"}>
                        {r.action === "start" ? "Iniciou" : "Encerrou"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.actor_email ?? r.actor_user_id}</TableCell>
                    <TableCell className="text-sm">{r.target_company_name ?? r.target_company_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.reason ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
