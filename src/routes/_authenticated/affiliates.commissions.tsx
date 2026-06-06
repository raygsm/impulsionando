import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/affiliates/commissions")({
  component: CommissionsPage,
});

type Row = { id: string; recipient_kind: string; amount: number; pct: number | null; status: string; release_at: string | null; released_at: string | null; paid_at: string | null };

const LABEL: Record<string, string> = {
  produtor: "Produtor", coprodutor: "Coprodutor", afiliado: "Afiliado", gerente: "Gerente", plataforma: "Plataforma",
};

function CommissionsPage() {
  const { companyId } = useActiveCompany();
  const { data, isLoading } = useQuery({
    queryKey: ["aff_commissions", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("aff_commissions").select("*").eq("company_id", companyId!).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dt = (s: string | null) => s ? new Date(s).toLocaleString("pt-BR") : "—";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Comissões e Splits</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cada venda gera linhas de comissão para produtor, coprodutor, afiliado, gerente e plataforma. Status muda automaticamente após o prazo do gateway + 3 dias úteis internos.
        </p>
      </div>

      <Card className="p-4">
        <h2 className="font-medium mb-2">Regra de split (padrão)</h2>
        <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
          <li>Venda aprovada → desconta taxa do gateway</li>
          <li>Calcula participação do produtor e coprodutores</li>
          <li>Calcula comissão do afiliado (e do gerente, se houver)</li>
          <li>Registra valores como <em>aguardando_gateway</em></li>
          <li>Após o prazo do gateway → muda para <em>aguardando_prazo_interno</em></li>
          <li>Após + 3 dias úteis → muda para <em>disponivel</em></li>
        </ol>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiário</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Liberar em</TableHead>
                <TableHead>Liberado</TableHead>
                <TableHead>Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhuma comissão registrada ainda.</TableCell></TableRow>}
              {data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{LABEL[r.recipient_kind] ?? r.recipient_kind}</TableCell>
                  <TableCell className="text-right">{r.pct != null ? `${r.pct}%` : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{brl(r.amount)}</TableCell>
                  <TableCell><Badge variant={r.status === "disponivel" || r.status === "pago" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{dt(r.release_at)}</TableCell>
                  <TableCell className="whitespace-nowrap">{dt(r.released_at)}</TableCell>
                  <TableCell className="whitespace-nowrap">{dt(r.paid_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
