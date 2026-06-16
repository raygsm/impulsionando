import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { exportApprovalQueueCsv } from "@/lib/realestate.functions";
import { useActiveCompany } from "@/hooks/use-active-company";

const Search = z.object({
  status: z.array(z.enum(["pending", "changes_requested", "rejected", "approved"])).optional(),
  search: z.string().optional(),
  reviewerId: z.string().optional(),
  submitterId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  pageSize: z.coerce.number().int().min(5).max(1000).optional(),
});

export const Route = createFileRoute("/_authenticated/imobiliaria/aprovacoes/imprimir-fila")({
  validateSearch: (s) => Search.parse(s),
  head: () => ({ meta: [{ title: "Fila de Aprovação — Impressão" }] }),
  component: Page,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando",
  changes_requested: "Ajustes solicitados",
  rejected: "Rejeitado",
  approved: "Aprovado",
};

function Page() {
  const { companyId } = useActiveCompany();
  const search = Route.useSearch();
  const fetchExport = useServerFn(exportApprovalQueueCsv);

  const args = {
    companyId: companyId!,
    status: search.status,
    search: search.search ?? null,
    reviewerId: search.reviewerId ?? null,
    submitterId: search.submitterId ?? null,
    dateFrom: search.dateFrom ?? null,
    dateTo: search.dateTo ?? null,
    page: 1,
    pageSize: search.pageSize ?? 500,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-approvals-print", args],
    enabled: !!companyId,
    queryFn: () => fetchExport({ data: args }),
  });

  // Parse CSV back into rows for rendering
  const rows = parseCsv(data?.csv ?? "");

  useEffect(() => {
    if (!isLoading && data) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [isLoading, data]);

  return (
    <div className="p-8 max-w-[900px] mx-auto bg-white text-black print:p-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } body { background: white; } .no-print { display: none !important; } table { font-size: 11px; } }`}</style>

      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold">Fila de aprovação de imóveis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerado em {new Date().toLocaleString("pt-BR")} · {rows.length} registro(s)
        </p>
        {Object.keys(search).length > 0 && (
          <div className="text-xs mt-2 space-y-0.5">
            {search.status?.length ? <div><strong>Status:</strong> {search.status.map((s) => STATUS_LABEL[s]).join(", ")}</div> : null}
            {search.search ? <div><strong>Busca:</strong> {search.search}</div> : null}
            {search.dateFrom ? <div><strong>De:</strong> {search.dateFrom}</div> : null}
            {search.dateTo ? <div><strong>Até:</strong> {search.dateTo}</div> : null}
          </div>
        )}
      </header>

      {isLoading ? (
        <p className="text-sm">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm">Nenhum imóvel encontrado para os filtros atuais.</p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-gray-100">
              {rows[0].map((h, i) => (
                <th key={i} className="text-left p-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((r, i) => (
              <tr key={i} className="border-b align-top">
                {r.map((c, j) => (
                  <td key={j} className="p-2">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="no-print mt-6 flex gap-2">
        <button onClick={() => window.print()} className="px-3 py-1.5 text-sm border rounded">Imprimir / Salvar PDF</button>
        <button onClick={() => window.close()} className="px-3 py-1.5 text-sm border rounded">Fechar</button>
      </div>
    </div>
  );
}

function parseCsv(csv: string): string[][] {
  if (!csv.trim()) return [];
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}
