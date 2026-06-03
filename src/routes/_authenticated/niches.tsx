import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/niches")({
  head: () => ({ meta: [{ title: "Nichos — Impulsionando" }] }),
  component: NichesPage,
});

function NichesPage() {
  const { data } = useQuery({
    queryKey: ["niches"],
    queryFn: async () => (await supabase.from("niches").select("*").order("name")).data ?? [],
  });

  return (
    <div>
      <PageHeader title="Nichos" description="Segmentos atendidos pela plataforma." />
      <Card className="shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nicho</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <div className="font-medium">{n.name}</div>
                  <div className="text-xs text-muted-foreground">{n.description}</div>
                </TableCell>
                <TableCell><code className="text-xs">{n.slug}</code></TableCell>
                <TableCell>{n.is_active ? <Badge className="bg-success text-success-foreground">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
