import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/crosssells")({
  component: CrossSellsPage,
});

type Row = { id: string; name: string; moment: string; is_active: boolean };

function CrossSellsPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_cross", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_crosssells"
      title="Cross-sell"
      description="Ofertas complementares apresentadas em pós-compra, e-mail/WhatsApp futuro, área do cliente ou checkout."
      columns={[
        { key: "name", label: "Nome" },
        { key: "moment", label: "Momento" },
        { key: "is_active", label: "Ativo", render: (r) => r.is_active ? "Sim" : "Não" },
      ]}
      fields={[
        { name: "product_id", label: "Produto base", type: "select", required: true,
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "name", label: "Nome", required: true },
        { name: "moment", label: "Momento", type: "select", defaultValue: "post_purchase",
          options: [
            { value: "post_purchase", label: "Pós-compra" },
            { value: "email", label: "E-mail/WhatsApp futuro" },
            { value: "area", label: "Área do cliente" },
            { value: "checkout", label: "Checkout" },
          ] },
      ]}
      extraInsert={{ is_active: true }}
    />
  );
}
