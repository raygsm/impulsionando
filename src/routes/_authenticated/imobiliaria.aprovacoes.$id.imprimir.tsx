import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPropertyReviewHistory } from "@/lib/realestate.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/imobiliaria/aprovacoes/$id/imprimir")({
  head: () => ({ meta: [{ title: "Histórico de aprovação — Imprimir" }] }),
  component: PrintPage,
});

const ACTION_LABEL: Record<string, string> = {
  submitted: "Enviado para revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  changes_requested: "Ajustes solicitados",
};

function PrintPage() {
  const { id } = Route.useParams();
  const fetchHistory = useServerFn(listPropertyReviewHistory);

  const { data: history } = useQuery({
    queryKey: ["print-history", id],
    queryFn: () => fetchHistory({ data: { propertyId: id } }),
  });

  const { data: property } = useQuery({
    queryKey: ["print-property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("realestate_properties")
        .select("title, reference_code, approval_status, neighborhood, city, operation, property_type")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (history && property) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [history, property]);

  const reviews = (history?.reviews ?? []) as Array<{
    id: string; action: string; actor_id: string | null; notes: string | null; created_at: string;
  }>;
  const actors = (history?.actors ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-3xl p-8 bg-white text-black print:p-0">
      <style>{`
        @media print {
          @page { margin: 18mm; }
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex justify-between items-start border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Aprovação</h1>
          <p className="text-sm text-gray-600">Imóvel: {property?.title ?? "—"}</p>
          {property?.reference_code && <p className="text-sm text-gray-600">Referência: {property.reference_code}</p>}
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Gerado em</div>
          <div>{new Date().toLocaleString("pt-BR")}</div>
        </div>
      </div>

      <table className="w-full text-sm mb-6">
        <tbody>
          <tr><td className="font-medium pr-3 py-1 w-40">Status atual</td><td className="py-1">{property?.approval_status ?? "—"}</td></tr>
          <tr><td className="font-medium pr-3 py-1">Operação</td><td className="py-1">{property?.operation ?? "—"}</td></tr>
          <tr><td className="font-medium pr-3 py-1">Tipo</td><td className="py-1">{property?.property_type ?? "—"}</td></tr>
          <tr><td className="font-medium pr-3 py-1">Localização</td><td className="py-1">{[property?.neighborhood, property?.city].filter(Boolean).join(", ") || "—"}</td></tr>
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mb-2">Linha do tempo</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum registro de revisão.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-3">Data/Hora</th>
              <th className="text-left py-2 pr-3">Ação</th>
              <th className="text-left py-2 pr-3">Responsável</th>
              <th className="text-left py-2">Observações</th>
            </tr>
          </thead>
          <tbody>
            {reviews.slice().reverse().map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="py-2 pr-3">{ACTION_LABEL[r.action] ?? r.action}</td>
                <td className="py-2 pr-3">{r.actor_id ? (actors[r.actor_id] ?? "—") : "—"}</td>
                <td className="py-2 whitespace-pre-wrap">{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="no-print mt-8 flex gap-2">
        <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded">Imprimir / Salvar PDF</button>
        <button onClick={() => window.close()} className="px-4 py-2 border rounded">Fechar</button>
      </div>
    </div>
  );
}
