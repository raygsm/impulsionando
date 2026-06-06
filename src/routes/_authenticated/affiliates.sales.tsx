import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/affiliates/sales")({
  component: SalesPage,
});

type Row = {
  id: string; product_id: string; gross_amount: number; gateway_fee: number; net_amount: number;
  payment_method: string | null; status: string; sold_at: string; approved_at: string | null;
  available_at: string | null; customer_name: string | null; campaign: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  venda_registrada: "Venda registrada", pagto_pendente: "Pagamento pendente", aprovado: "Aprovado",
  aguardando_gateway: "Aguardando gateway", aguardando_prazo_interno: "Aguardando prazo interno",
  disponivel: "Disponível", saque_solicitado: "Saque solicitado", saque_aprovado: "Saque aprovado",
  pago: "Pago", cancelado: "Cancelado", estornado: "Estornado", chargeback: "Chargeback", bloqueado: "Bloqueado",
};

function SalesPage() {
  const { companyId } = useActiveCompany();
  const { data, isLoading } = useQuery({
    queryKey: ["aff_sales", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("aff_sales").select("*").eq("company_id", companyId!).order("sold_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dt = (s: string | null) => s ? new Date(s).toLocaleString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Vendas (Afiliados)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vendas registradas no módulo de afiliados. Origem: link, cupom, QR Code ou integração de gateway. Status muda automaticamente conforme o prazo de liberação.
        </p>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Liberação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">Nenhuma venda registrada ainda.</TableCell></TableRow>}
              {data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{dt(r.sold_at)}</TableCell>
                  <TableCell>{r.customer_name ?? "—"}</TableCell>
                  <TableCell>{r.campaign ?? "—"}</TableCell>
                  <TableCell>{r.payment_method ?? "—"}</TableCell>
                  <TableCell className="text-right">{brl(r.gross_amount)}</TableCell>
                  <TableCell className="text-right">{brl(r.gateway_fee)}</TableCell>
                  <TableCell className="text-right font-medium">{brl(r.net_amount)}</TableCell>
                  <TableCell><Badge variant={r.status === "disponivel" || r.status === "pago" ? "default" : "secondary"}>{STATUS_LABEL[r.status] ?? r.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{dt(r.available_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
