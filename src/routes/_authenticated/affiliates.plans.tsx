import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/plans")({
  component: PlansPage,
});

type Row = {
  id: string; name: string; quantity: number;
  consumption_days: number | null; price_cents: number; sort_order: number; is_active: boolean;
};

function PlansPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_plans", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_product_plans"
      title="Planos / Variações"
      description="Variações do produto (ex.: 1, 2 ou 3 potes). Defina quantidade, preço e prazo de consumo — o CRM de recompra usa esses prazos para reativar compradores no momento certo."
      columns={[
        { key: "name", label: "Plano" },
        { key: "quantity", label: "Qtd" },
        { key: "consumption_days", label: "Consumo (dias)" },
        { key: "price_cents", label: "Preço", render: (r) => `R$ ${(r.price_cents / 100).toFixed(2)}` },
        { key: "is_active", label: "Ativo", render: (r) => r.is_active ? "Sim" : "Não" },
      ]}
      fields={[
        { name: "product_id", label: "Produto", type: "select", required: true,
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "name", label: "Nome do plano", required: true, placeholder: "1 Pote — Tratamento Inicial" },
        { name: "quantity", label: "Quantidade", type: "number", defaultValue: 1, required: true },
        { name: "consumption_days", label: "Duração estimada (dias)", type: "number", placeholder: "30" },
        { name: "price_cents", label: "Preço em centavos", type: "number", required: true, placeholder: "19700" },
        { name: "sort_order", label: "Ordem", type: "number", defaultValue: 0 },
        { name: "followup_before_end_days", label: "1º aviso antes do fim (dias)", type: "number", defaultValue: 7 },
        { name: "followup_second_days_before", label: "2º aviso antes do fim (dias)", type: "number", defaultValue: 1 },
        { name: "followup_after_end_days", label: "3º aviso após o fim (dias)", type: "number", defaultValue: 3 },
      ]}
      extraInsert={{ is_active: true }}
    />
  );
}
