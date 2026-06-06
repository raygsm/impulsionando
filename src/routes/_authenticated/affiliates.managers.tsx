import { createFileRoute } from "@tanstack/react-router";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/managers")({
  component: ManagersPage,
});

type Row = { id: string; name: string; email: string | null; whatsapp: string | null; commission_pct: number; status: string };

function ManagersPage() {
  return (
    <ResourceListPage<Row>
      table="aff_managers"
      title="Gerentes de Afiliados"
      description="O gerente de afiliados acompanha uma carteira de afiliados, ajuda na ativação e recebe comissão sobre as vendas dos afiliados sob sua gestão."
      columns={[
        { key: "name", label: "Nome" },
        { key: "email", label: "E-mail" },
        { key: "whatsapp", label: "WhatsApp" },
        { key: "commission_pct", label: "Comissão %", render: (r) => `${r.commission_pct}%` },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "name", label: "Nome", required: true },
        { name: "email", label: "E-mail", type: "email" },
        { name: "whatsapp", label: "WhatsApp" },
        { name: "commission_pct", label: "Comissão sobre vendas dos afiliados (%)", type: "number", defaultValue: 5 },
        { name: "commission_fixed", label: "Comissão fixa por venda (R$)", type: "number" },
        { name: "notes", label: "Observações", type: "textarea" },
        { name: "status", label: "Status", type: "select", defaultValue: "aprovado",
          options: [{ value: "aprovado", label: "Ativo" }, { value: "suspenso", label: "Suspenso" }, { value: "inativo", label: "Inativo" }] },
      ]}
    />
  );
}
