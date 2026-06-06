import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/upsells")({
  component: UpsellsPage,
});

type Row = { id: string; name: string; price_cents: number; trigger: string; is_active: boolean };

function UpsellsPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_upsells", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_upsells"
      title="Upsell"
      description="Oferta exibida após a compra (ou após Pix pendente) para elevar o ticket. Comissão configurável por upsell."
      columns={[
        { key: "name", label: "Nome" },
        { key: "trigger", label: "Gatilho" },
        { key: "price_cents", label: "Preço", render: (r) => `R$ ${(r.price_cents / 100).toFixed(2)}` },
        { key: "is_active", label: "Ativo", render: (r) => r.is_active ? "Sim" : "Não" },
      ]}
      fields={[
        { name: "product_id", label: "Produto principal", type: "select", required: true,
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "name", label: "Nome do upsell", required: true },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "price_cents", label: "Preço em centavos", type: "number", required: true },
        { name: "trigger", label: "Gatilho", type: "select", defaultValue: "after_approved",
          options: [
            { value: "after_approved", label: "Após compra aprovada" },
            { value: "after_pix_pending", label: "Após Pix pendente" },
            { value: "checkout", label: "No checkout" },
          ] },
        { name: "commission_override", label: "Comissão específica (%)", type: "number" },
      ]}
      extraInsert={{ is_active: true, affiliate_gets_commission: true, coproducer_participates: true }}
    />
  );
}
