import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getApprovalQueueForExport } from "@/lib/realestate.functions";
import { useActiveCompany } from "@/hooks/use-active-company";

const Search = z.object({
  status: z.array(z.enum(["pending", "changes_requested", "rejected", "approved"])).optional(),
  search: z.string().optional(),
  reviewerId: z.string().optional(),
  submitterId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
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

function fmtPrice(op: string | null, sale: number | null, rent: number | null) {
  const v = op === "locacao" ? rent : sale;
  if (!v) return "—";
  const suf = op === "locacao" ? "/mês" : "";
  return `R$ ${Number(v).toLocaleString("pt-BR")}${suf}`;
}

function Page() {
  const { companyId } = useActiveCompany();
  const search = Route.useSearch();
  const fetchExport = useServerFn(getApprovalQueueForExport);

  const args = {
    companyId: companyId!,
    status: search.status,
    search: search.search ?? null,
    reviewerId: search.reviewerId ?? null,
    submitterId: search.submitterId ?? null,
    dateFrom: search.dateFrom ?? null,
    dateTo: search.dateTo ?? null,
    page: search.page ?? 1,
    pageSize: search.pageSize ?? 500,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["realestate-approvals-print", args],
    enabled: !!companyId,
    queryFn: () => fetchExport({ data: args }),
    retry: false,
  });

  const items = (data?.items ?? []) as Array<any>;
  const actors = (data?.actors ?? {}) as Record<string, string>;
  const totalPages = data ? Math.max(1, Math.ceil((data.total ?? 0) / (data.pageSize ?? 1))) : 1;
  const reviewerName = data?.filters?.reviewerId
    ? (actors[data.filters.reviewerId] ?? data.filters.reviewerId)
    : "Todos";

  useEffect(() => {
    if (!isLoading && data && items.length > 0) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [isLoading, data, items.length]);

  return (
    <div className="p-8 max-w-[1000px] mx-auto bg-white text-black print:p-0">
      <style>{`@media print { @page { size: A4 landscape; margin: 12mm; } body { background: white; } .no-print { display: none !important; } table { font-size: 10px; } }`}</style>

      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold">Fila de aprovação de imóveis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerado em {new Date().toLocaleString("pt-BR")}
        </p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs mt-3">
          <div><dt className="font-semibold inline">Página: </dt><dd className="inline">{args.page} de {totalPages}</dd></div>
          <div><dt className="font-semibold inline">Por página: </dt><dd className="inline">{args.pageSize}</dd></div>
          <div><dt className="font-semibold inline">Nesta página: </dt><dd className="inline">{items.length}</dd></div>
          <div><dt className="font-semibold inline">Total: </dt><dd className="inline">{data?.total ?? 0}</dd></div>
          <div className="col-span-2"><dt className="font-semibold inline">Status: </dt><dd className="inline">{data?.filters?.status?.length ? data.filters.status.map((s: string) => STATUS_LABEL[s] ?? s).join(", ") : "Todos"}</dd></div>
          <div><dt className="font-semibold inline">Revisor: </dt><dd className="inline">{reviewerName}</dd></div>
          <div><dt className="font-semibold inline">Busca: </dt><dd className="inline">{data?.filters?.search || "—"}</dd></div>
          <div><dt className="font-semibold inline">De: </dt><dd className="inline">{data?.filters?.dateFrom ? new Date(data.filters.dateFrom).toLocaleString("pt-BR") : "—"}</dd></div>
          <div><dt className="font-semibold inline">Até: </dt><dd className="inline">{data?.filters?.dateTo ? new Date(data.filters.dateTo).toLocaleString("pt-BR") : "—"}</dd></div>
        </dl>
      </header>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <strong>Não foi possível gerar o PDF.</strong>
          <div className="mt-1">{(error as Error).message}</div>
          <div className="mt-2 text-xs">Verifique se a paginação está dentro dos limites (página ≥ 1, tamanho entre 5 e 1000) e se você tem acesso a esta empresa.</div>
        </div>
      ) : isLoading ? (
        <p className="text-sm">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm">Nenhum imóvel encontrado para os filtros atuais.</p>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="text-left p-2 font-medium">Ref</th>
              <th className="text-left p-2 font-medium">Título</th>
              <th className="text-left p-2 font-medium">Tipo</th>
              <th className="text-left p-2 font-medium">Preço</th>
              <th className="text-left p-2 font-medium">Local</th>
              <th className="text-left p-2 font-medium">Status</th>
              <th className="text-left p-2 font-medium">Enviado</th>
              <th className="text-left p-2 font-medium">Revisado</th>
              <th className="text-left p-2 font-medium">Observações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="p-2">{r.reference_code ?? "—"}</td>
                <td className="p-2">{r.title}</td>
                <td className="p-2">{r.operation} · {r.property_type}</td>
                <td className="p-2">{fmtPrice(r.operation, r.sale_price, r.rent_price)}</td>
                <td className="p-2">{[r.neighborhood, r.city].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-2">{STATUS_LABEL[r.approval_status] ?? r.approval_status}</td>
                <td className="p-2">
                  {r.submitted_for_review_at ? new Date(r.submitted_for_review_at).toLocaleString("pt-BR") : "—"}
                  {r.submitted_by && actors[r.submitted_by] ? <div className="text-[10px] text-gray-600">{actors[r.submitted_by]}</div> : null}
                </td>
                <td className="p-2">
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("pt-BR") : "—"}
                  {r.reviewed_by && actors[r.reviewed_by] ? <div className="text-[10px] text-gray-600">{actors[r.reviewed_by]}</div> : null}
                </td>
                <td className="p-2 max-w-[200px]">{r.review_notes ?? ""}</td>
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
