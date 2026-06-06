import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/coproducers")({
  component: CoproducersPage,
});

type Row = { id: string; name: string; document: string | null; product_id: string; participation_pct: number | null; fixed_amount: number | null; scope: string; status: string };

function CoproducersPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_copro", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <ResourceListPage<Row>
      table="aff_coproducers"
      title="Coprodutores"
      description="Coprodutores participam da receita do produto ou oferta, com percentual ou valor fixo. O sistema registra suas participações, valores pendentes, liberados e pagos."
      columns={[
        { key: "name", label: "Nome" },
        { key: "document", label: "Documento" },
        { key: "participation_pct", label: "Participação", render: (r) => r.participation_pct != null ? `${r.participation_pct}%` : (r.fixed_amount ? `R$ ${r.fixed_amount}` : "—") },
        { key: "scope", label: "Escopo" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "product_id", label: "Produto", type: "select", required: true,
          options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "name", label: "Nome do coprodutor", required: true },
        { name: "document", label: "CPF / CNPJ" },
        { name: "email", label: "E-mail", type: "email" },
        { name: "whatsapp", label: "WhatsApp" },
        { name: "participation_pct", label: "Percentual (%)", type: "number" },
        { name: "fixed_amount", label: "Valor fixo (R$)", type: "number" },
        { name: "scope", label: "Escopo", type: "select", defaultValue: "product",
          options: [{ value: "product", label: "Produto inteiro" }, { value: "offer", label: "Oferta específica" }, { value: "campaign", label: "Campanha específica" }] },
        { name: "status", label: "Status", type: "select", defaultValue: "aprovado",
          options: [{ value: "aprovado", label: "Aprovado" }, { value: "pendente", label: "Pendente" }, { value: "suspenso", label: "Suspenso" }, { value: "inativo", label: "Inativo" }] },
      ]}
    />
  );
}
