import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Auditoria — Impulsionando" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { data } = useQuery({
    queryKey: ["audit"],
    queryFn: async () =>
      (await supabase.from("audit_logs")
        .select("id, action, entity, entity_id, user_email, created_at, companies:company_id(name)")
        .order("created_at", { ascending: false })
        .limit(200)).data ?? [],
  });

  return (
    <div>
      <PageHeader title="Auditoria" description="Histórico de ações críticas na plataforma." />
      <Card className="shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Ação</TableHead><TableHead>Entidade</TableHead><TableHead>Empresa</TableHead><TableHead>Usuário</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem eventos.</TableCell></TableRow>}
            {data?.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs whitespace-nowrap">{new Date(row.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-[10px]">{row.action}</Badge></TableCell>
                <TableCell className="text-sm"><span className="font-medium">{row.entity}</span><span className="text-xs text-muted-foreground ml-1">{row.entity_id?.slice(0, 8)}</span></TableCell>
                <TableCell className="text-sm">{(row.companies as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.user_email ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
