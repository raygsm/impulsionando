import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/affiliates/offers")({
  component: OffersPage,
});

type Row = { id: string; name: string; price: number; billing: string; trial_days: number; commission_pct: number | null; status: string; product_id: string };

function OffersPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_offers"
      title="Ofertas"
      description="Cada produto pode ter várias ofertas: principal, promocional, recorrente, combo, etc. A oferta define o preço final, cobrança e comissão específica."
      columns={[
        { key: "name", label: "Oferta" },
        { key: "price", label: "Preço", render: (r) => Number(r.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
        { key: "billing", label: "Cobrança" },
        { key: "trial_days", label: "Trial (dias)" },
        { key: "commission_pct", label: "Comissão %", render: (r) => (r.commission_pct ? `${r.commission_pct}%` : "padrão do produto") },
        { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge> },
      ]}
      fields={[
        { name: "product_id", label: "Produto", type: "select", required: true,
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "name", label: "Nome da oferta", required: true },
        { name: "price", label: "Preço (R$)", type: "number", defaultValue: 0, required: true },
        { name: "billing", label: "Tipo de cobrança", type: "select", defaultValue: "a_vista", options: [
          { value: "a_vista", label: "À vista" }, { value: "parcelado", label: "Parcelado" }, { value: "recorrente", label: "Recorrente" }, { value: "assinatura", label: "Assinatura" },
        ]},
        { name: "installments", label: "Parcelas", type: "number", defaultValue: 1 },
        { name: "trial_days", label: "Dias de trial", type: "number", defaultValue: 0 },
        { name: "commission_pct", label: "Comissão específica (%)", type: "number" },
        { name: "landing_url", label: "Página de destino" },
        { name: "checkout_url", label: "Checkout" },
        { name: "status", label: "Status", type: "select", defaultValue: "active", options: [
          { value: "draft", label: "Rascunho" }, { value: "active", label: "Ativa" }, { value: "paused", label: "Pausada" }, { value: "closed", label: "Encerrada" },
        ]},
      ]}
    />
  );
}
