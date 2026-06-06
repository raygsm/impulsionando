import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/coupons")({
  component: CouponsPage,
});

type Row = {
  id: string; code: string; discount_type: string; discount_value: number;
  max_uses: number | null; used_count: number; status: string;
};

function CouponsPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_coupon", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_coupons"
      title="Cupons"
      description="Cupons de desconto por produto, oferta ou afiliado. Suporta percentual ou valor fixo, validade, limite de uso e regra de comissão (mantém ou reduz)."
      columns={[
        { key: "code", label: "Código" },
        { key: "discount_type", label: "Tipo" },
        { key: "discount_value", label: "Valor", render: (r) => r.discount_type === "percent" ? `${r.discount_value}%` : `R$ ${r.discount_value}` },
        { key: "used_count", label: "Usos", render: (r) => r.max_uses ? `${r.used_count}/${r.max_uses}` : String(r.used_count) },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "code", label: "Código (maiúsculas)", required: true, placeholder: "EMAGRECER10" },
        { name: "product_id", label: "Produto (opcional)", type: "select",
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "discount_type", label: "Tipo de desconto", type: "select", required: true, defaultValue: "percent",
          options: [{ value: "percent", label: "Percentual (%)" }, { value: "fixed", label: "Valor fixo (R$)" }] },
        { name: "discount_value", label: "Valor do desconto", type: "number", required: true },
        { name: "valid_until", label: "Válido até (ISO)", placeholder: "2026-12-31T23:59:59Z" },
        { name: "max_uses", label: "Limite de usos", type: "number" },
        { name: "max_per_customer", label: "Usos por cliente", type: "number", defaultValue: 1 },
        { name: "status", label: "Status", type: "select", defaultValue: "ativo",
          options: [{ value: "ativo", label: "Ativo" }, { value: "pausado", label: "Pausado" }, { value: "expirado", label: "Expirado" }, { value: "esgotado", label: "Esgotado" }] },
      ]}
      extraInsert={{ keep_commission: true }}
    />
  );
}
