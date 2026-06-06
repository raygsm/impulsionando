import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/affiliates/crm")({
  component: CrmFlowsPage,
});

type Row = { id: string; name: string; kind: string; is_active: boolean };

function CrmFlowsPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_options_crm", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <h2 className="font-medium mb-1">CRM de vendas e recompra</h2>
        <p className="text-sm text-muted-foreground">
          Configure réguas de recuperação (carrinho, Pix, boleto, cartão recusado) e recompra (por prazo de consumo do plano).
          Os <strong>passos</strong> são definidos em JSON, ex.:
          <code className="block bg-background border rounded p-2 mt-2 text-xs whitespace-pre">{`[
  { "delay_days": 0,  "channel": "whatsapp", "template": "Seu Pix está aguardando pagamento..." },
  { "delay_days": 1,  "channel": "email",    "template": "Não perca seu desconto..." },
  { "delay_days": 23, "channel": "whatsapp", "template": "Seu tratamento está acabando..." }
]`}</code>
        </p>
      </Card>

      <ResourceListPage<Row>
        table="aff_crm_flows"
        title="Fluxos de CRM"
        description="Cada fluxo é disparado por um evento (carrinho abandonado, Pix pendente, recompra etc.) e envia uma sequência de mensagens nos prazos definidos."
        columns={[
          { key: "name", label: "Nome" },
          { key: "kind", label: "Tipo" },
          { key: "is_active", label: "Ativo", render: (r) => r.is_active ? "Sim" : "Não" },
        ]}
        fields={[
          { name: "name", label: "Nome da régua", required: true, placeholder: "Recompra — Emagrecedor 1 Pote" },
          { name: "kind", label: "Tipo", type: "select", required: true, defaultValue: "cart_recovery",
            options: [
              { value: "cart_recovery", label: "Recuperação de carrinho" },
              { value: "pix_pending", label: "Pix pendente" },
              { value: "boleto_pending", label: "Boleto pendente" },
              { value: "card_declined", label: "Cartão recusado" },
              { value: "repurchase", label: "Recompra" },
              { value: "post_purchase", label: "Pós-compra" },
            ] },
          { name: "product_id", label: "Produto (opcional)", type: "select",
            options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
          { name: "steps", label: "Passos (JSON)", type: "textarea",
            defaultValue: '[\n  { "delay_days": 0, "channel": "whatsapp", "template": "..." }\n]' },
        ]}
        extraInsert={{ is_active: true, stop_on_paid: true }}
      />
    </div>
  );
}
