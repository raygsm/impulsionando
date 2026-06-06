import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/bumps")({
  component: BumpsPage,
});

type Row = { id: string; name: string; price_cents: number; is_active: boolean };

function BumpsPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_bumps", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_bumps"
      title="Order Bump"
      description="Ofereça um item complementar no checkout, antes da finalização. Você define se o afiliado e o coprodutor participam da comissão do bump."
      columns={[
        { key: "name", label: "Nome" },
        { key: "price_cents", label: "Preço", render: (r) => `R$ ${(r.price_cents / 100).toFixed(2)}` },
        { key: "is_active", label: "Ativo", render: (r) => r.is_active ? "Sim" : "Não" },
      ]}
      fields={[
        { name: "product_id", label: "Produto principal", type: "select", required: true,
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "name", label: "Nome do bump", required: true, placeholder: "Guia Digital de Alimentação Inteligente" },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "price_cents", label: "Preço em centavos", type: "number", required: true },
        { name: "image_url", label: "URL da imagem" },
        { name: "commission_override", label: "Comissão específica (%)", type: "number" },
      ]}
      extraInsert={{ is_active: true, affiliate_gets_commission: true, coproducer_participates: true }}
    />
  );
}
