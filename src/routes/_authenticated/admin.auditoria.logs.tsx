import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAuditLog } from "@/lib/security/audit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";

type Category = "admin" | "auth" | "security" | "billing" | "data" | "system";
type Severity = "info" | "notice" | "warning" | "critical";

export const Route = createFileRoute("/_authenticated/admin/auditoria/logs")({
  component: LogsPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="space-y-3 p-6">
        <p className="text-destructive">Erro: {error.message}</p>
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

function LogsPage() {
  const call = useServerFn(listAuditLog);
  const [category, setCategory] = useState<Category | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [actor, setActor] = useState("");

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["audit-logs", category, severity, actor],
    queryFn: () =>
      call({
        data: {
          category: category === "all" ? undefined : category,
          severity: severity === "all" ? undefined : severity,
          actorEmail: actor || undefined,
          limit: 200,
        },
      }),
  });

  const rows = data?.rows ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trilha de Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Ações administrativas, mudanças de senha e eventos de segurança com data/hora e IP.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Select value={category} onValueChange={(v) => setCategory(v as Category | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="security">Segurança</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="data">Dados</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(v) => setSeverity(v as Severity | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas severidades</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="notice">Notice</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="w-64"
            placeholder="E-mail do ator (contém)"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Eventos ({rows.length}){isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Quando</th>
                <th className="px-3 py-2">Ator</th>
                <th className="px-3 py-2">Ação</th>
                <th className="px-3 py-2">Entidade</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Severidade</th>
                <th className="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2">{r.user_email ?? "-"}</td>
                  <td className="px-3 py-2 font-medium">{r.action}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.entity}
                    {r.entity_id ? `:${r.entity_id.slice(0, 12)}` : ""}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary">{r.category}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <SeverityBadge s={r.severity} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {r.ip_address ?? "-"}
                  </td>
                </tr>
              ))}
              {!isFetching && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Nenhum evento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SeverityBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    info: "bg-slate-500",
    notice: "bg-blue-500",
    warning: "bg-amber-500",
    critical: "bg-red-600",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs text-white ${map[s] ?? "bg-slate-500"}`}>
      {s}
    </span>
  );
}
