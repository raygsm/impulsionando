import { createFileRoute } from "@tanstack/react-router";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/affiliates/affiliates")({
  component: AffiliatesListPage,
});

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aprovado: "default", pendente: "secondary", reprovado: "destructive", suspenso: "destructive", bloqueado: "destructive", inativo: "outline",
};

type Row = { id: string; name: string; email: string | null; whatsapp: string | null; document: string | null; main_channel: string | null; status: string };

function AffiliatesListPage() {
  return (
    <ResourceListPage<Row>
      table="aff_affiliates"
      title="Afiliados"
      description="Cadastro de afiliados — parceiros, influenciadores ou indicadores que recebem comissão por venda. Pendentes precisam ser aprovados antes de gerar links."
      columns={[
        { key: "name", label: "Nome" },
        { key: "email", label: "E-mail" },
        { key: "whatsapp", label: "WhatsApp" },
        { key: "main_channel", label: "Canal principal" },
        { key: "status", label: "Status", render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge> },
      ]}
      fields={[
        { name: "name", label: "Nome completo", required: true },
        { name: "document", label: "CPF / CNPJ" },
        { name: "email", label: "E-mail", type: "email" },
        { name: "whatsapp", label: "WhatsApp" },
        { name: "city", label: "Cidade" },
        { name: "state", label: "Estado" },
        { name: "instagram", label: "Instagram" },
        { name: "site", label: "Site" },
        { name: "main_channel", label: "Canal principal de divulgação", placeholder: "Instagram, YouTube, blog…" },
        { name: "pix_key", label: "Chave Pix" },
        { name: "notes", label: "Observações internas", type: "textarea" },
        { name: "status", label: "Status", type: "select", defaultValue: "pendente", options: [
          { value: "pendente", label: "Pendente" }, { value: "aprovado", label: "Aprovado" }, { value: "reprovado", label: "Reprovado" }, { value: "suspenso", label: "Suspenso" }, { value: "bloqueado", label: "Bloqueado" }, { value: "inativo", label: "Inativo" },
        ]},
      ]}
    />
  );
}
