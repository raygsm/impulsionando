import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { ResourceListPage } from "@/components/affiliates/ResourceListPage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/affiliates/links")({
  component: LinksPage,
});

type Row = {
  id: string; slug: string; kind: string; campaign: string | null;
  clicks: number; leads: number; sales: number; revenue: number;
  is_active: boolean; product_id: string | null; affiliate_id: string | null;
};

function LinksPage() {
  const { companyId } = useActiveCompany();
  const { data: products } = useQuery({
    queryKey: ["aff_products_lk", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_products").select("id, name").eq("company_id", companyId!)).data ?? [],
  });
  const { data: affs } = useQuery({
    queryKey: ["aff_aff_lk", companyId],
    enabled: !!companyId,
    queryFn: async () => (await supabase.from("aff_affiliates").select("id, name").eq("company_id", companyId!)).data ?? [],
  });

  const base = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <ResourceListPage<Row>
      table="aff_links"
      title="Links, Cupons e QR Codes"
      description="Cada link/cupom/QR Code é único e registra cliques, leads, vendas, receita e comissão por afiliado, produto, oferta e campanha."
      columns={[
        { key: "slug", label: "Link / Slug", render: (r) => (
          <div className="flex items-center gap-2">
            <code className="text-xs">{base}/r/{r.slug}</code>
            <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(`${base}/r/${r.slug}`); toast.success("Link copiado"); }}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) },
        { key: "kind", label: "Tipo" },
        { key: "campaign", label: "Campanha" },
        { key: "clicks", label: "Cliques" },
        { key: "leads", label: "Leads" },
        { key: "sales", label: "Vendas" },
        { key: "revenue", label: "Receita", render: (r) => Number(r.revenue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
      ]}
      fields={[
        { name: "slug", label: "Slug (parte final da URL)", required: true, placeholder: "promo-junho-joao" },
        { name: "kind", label: "Tipo", type: "select", defaultValue: "link",
          options: [{ value: "link", label: "Link único" }, { value: "cupom", label: "Cupom" }, { value: "qrcode", label: "QR Code" }] },
        { name: "product_id", label: "Produto", type: "select", options: (products ?? []).map((p) => ({ value: p.id, label: p.name })) },
        { name: "affiliate_id", label: "Afiliado", type: "select", options: (affs ?? []).map((a) => ({ value: a.id, label: a.name })) },
        { name: "campaign", label: "Campanha" },
        { name: "destination_url", label: "URL de destino", placeholder: "https://…" },
      ]}
    />
  );
}
