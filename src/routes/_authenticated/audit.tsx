import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileSpreadsheet, FileText, Filter, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listAuditLogs, auditFilterOptions } from "@/lib/audit.functions";
import { downloadCsv, downloadTablePdf } from "@/lib/exports";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Auditoria — Impulsionando" }] }),
  component: AuditPage,
});

type Filters = {
  company_id?: string;
  user_email?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
};

function AuditPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [selected, setSelected] = useState<any | null>(null);

  const listFn = useServerFn(listAuditLogs);
  const optsFn = useServerFn(auditFilterOptions);

  const opts = useQuery({ queryKey: ["audit-opts"], queryFn: () => optsFn(), staleTime: 5 * 60_000 });
  const list = useQuery({
    queryKey: ["audit", filters],
    queryFn: () => listFn({ data: { ...filters, limit: 1000 } }),
  });

  const rows = list.data ?? [];

  const exportRows = useMemo(
    () =>
      rows.map((r: any) => ({
        data: new Date(r.created_at).toLocaleString("pt-BR"),
        empresa: r.companies?.name ?? "",
        usuario: r.user_email ?? "",
        acao: r.action,
        entidade: r.entity,
        entidade_id: r.entity_id ?? "",
      })),
    [rows],
  );

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Histórico de ações críticas com filtros, antes/depois e exportação."
      />

      {/* Filtros */}
      <Card className="p-4 mb-4 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">Empresa</Label>
            <Select
              value={filters.company_id ?? "all"}
              onValueChange={(v) => setFilters({ ...filters, company_id: v === "all" ? undefined : v })}
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(opts.data?.companies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Ação</Label>
            <Select
              value={filters.action ?? "all"}
              onValueChange={(v) => setFilters({ ...filters, action: v === "all" ? undefined : v })}
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(opts.data?.actions ?? []).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Entidade</Label>
            <Select
              value={filters.entity ?? "all"}
              onValueChange={(v) => setFilters({ ...filters, entity: v === "all" ? undefined : v })}
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(opts.data?.entities ?? []).map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Usuário (e-mail)</Label>
            <Input
              placeholder="contém…"
              value={filters.user_email ?? ""}
              onChange={(e) => setFilters({ ...filters, user_email: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label className="text-xs">De</Label>
            <Input
              type="date"
              value={filters.from?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input
              type="date"
              value={filters.to?.slice(0, 10) ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, to: e.target.value ? new Date(e.target.value + "T23:59:59").toISOString() : undefined })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setFilters({})}>
            <Filter className="w-4 h-4 mr-1" /> Limpar filtros
          </Button>
          <span className="text-xs text-muted-foreground">
            {rows.length} evento(s)
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `auditoria-${new Date().toISOString().slice(0, 10)}.csv`,
                  ["data", "empresa", "usuario", "acao", "entidade", "entidade_id"],
                  exportRows,
                )
              }
            >
              <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button
              size="sm"
              onClick={() =>
                downloadTablePdf({
                  filename: `auditoria-${new Date().toISOString().slice(0, 10)}.pdf`,
                  title: "Auditoria — Impulsionando Tecnologia",
                  subtitle: `${rows.length} registro(s) · gerado em ${new Date().toLocaleString("pt-BR")}`,
                  columns: [
                    { key: "data", label: "Data", width: 110 },
                    { key: "empresa", label: "Empresa" },
                    { key: "usuario", label: "Usuário" },
                    { key: "acao", label: "Ação", width: 110 },
                    { key: "entidade", label: "Entidade", width: 110 },
                  ],
                  rows: exportRows,
                  footer: "Auditoria respeitando isolamento por empresa e perfil.",
                })
              }
            >
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead className="w-24 text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando…</TableCell></TableRow>
              )}
              {!list.isLoading && rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem eventos para o filtro.</TableCell></TableRow>
              )}
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">{r.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{r.entity}</span>
                    {r.entity_id && <span className="text-xs text-muted-foreground ml-1">{String(r.entity_id).slice(0, 8)}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{r.companies?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.user_email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Sheet open={selected?.id === r.id} onOpenChange={(o) => setSelected(o ? r : null)}>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="ghost">Ver</Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl overflow-auto">
                        <SheetHeader><SheetTitle>{r.action} · {r.entity}</SheetTitle></SheetHeader>
                        <div className="space-y-4 mt-4 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-muted-foreground">Data:</span> {new Date(r.created_at).toLocaleString("pt-BR")}</div>
                            <div><span className="text-muted-foreground">Usuário:</span> {r.user_email ?? "—"}</div>
                            <div><span className="text-muted-foreground">Empresa:</span> {r.companies?.name ?? "—"}</div>
                            <div><span className="text-muted-foreground">Entidade:</span> {r.entity} {r.entity_id}</div>
                          </div>
                          <div>
                            <div className="font-medium mb-1">Antes</div>
                            <pre className="bg-muted/40 p-3 rounded text-xs overflow-auto max-h-72">{JSON.stringify(r.before ?? {}, null, 2)}</pre>
                          </div>
                          <div>
                            <div className="font-medium mb-1">Depois</div>
                            <pre className="bg-muted/40 p-3 rounded text-xs overflow-auto max-h-72">{JSON.stringify(r.after ?? {}, null, 2)}</pre>
                          </div>
                          {r.metadata && (
                            <div>
                              <div className="font-medium mb-1">Metadados</div>
                              <pre className="bg-muted/40 p-3 rounded text-xs overflow-auto max-h-48">{JSON.stringify(r.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
        <Download className="w-3 h-3" /> Exportações respeitam o isolamento por empresa e perfil — apenas registros visíveis no filtro são exportados.
      </p>
    </div>
  );
}
