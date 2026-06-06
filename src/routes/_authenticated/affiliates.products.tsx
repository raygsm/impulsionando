import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";

export const Route = createFileRoute("/_authenticated/affiliates/products")({
  component: ProductsPage,
});

type Row = {
  id: string;
  name: string;
  kind: string;
  base_price: number;
  default_commission_pct: number;
  status: string;
  allow_affiliate: boolean;
};

function ProductsPage() {
  return (
    <ResourceListPage<Row>
      table="aff_products"
      title="Produtos"
      description="Catálogo de produtos comissionáveis. Cada produto pode ter várias ofertas, comissão padrão e regras de afiliação."
      columns={[
        { key: "name", label: "Nome" },
        { key: "kind", label: "Tipo" },
        { key: "base_price", label: "Valor base", render: (r) => Number(r.base_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
        { key: "default_commission_pct", label: "Comissão padrão", render: (r) => `${r.default_commission_pct}%` },
        { key: "allow_affiliate", label: "Afiliados", render: (r) => (r.allow_affiliate ? "Sim" : "Não") },
        { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge> },
      ]}
      fields={[
        { name: "name", label: "Nome do produto", required: true },
        { name: "description", label: "Descrição", type: "textarea" },
        { name: "category", label: "Categoria" },
        { name: "kind", label: "Tipo", type: "select", defaultValue: "digital", options: [
          { value: "fisico", label: "Físico" },
          { value: "digital", label: "Digital" },
          { value: "servico", label: "Serviço" },
          { value: "evento", label: "Evento" },
          { value: "assinatura", label: "Assinatura" },
          { value: "plano", label: "Plano recorrente" },
          { value: "consulta", label: "Consulta" },
          { value: "agenda", label: "Agenda" },
          { value: "curso", label: "Curso" },
          { value: "experiencia", label: "Experiência" },
        ]},
        { name: "base_price", label: "Valor base (R$)", type: "number", defaultValue: 0 },
        { name: "default_commission_pct", label: "Comissão padrão (%)", type: "number", defaultValue: 30 },
        { name: "sales_page_url", label: "Página de venda (URL)" },
        { name: "checkout_url", label: "Checkout (URL)" },
        { name: "status", label: "Status", type: "select", defaultValue: "draft", options: [
          { value: "draft", label: "Rascunho" }, { value: "active", label: "Ativo" }, { value: "paused", label: "Pausado" }, { value: "blocked", label: "Bloqueado" }, { value: "closed", label: "Encerrado" },
        ]},
      ]}
    />
  );
}
