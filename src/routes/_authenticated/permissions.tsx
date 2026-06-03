import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/permissions")({
  head: () => ({ meta: [{ title: "Permissões — Impulsionando" }] }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const { data } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => (await supabase.from("permissions").select("*").order("module").order("code")).data ?? [],
  });

  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, p) => {
    (acc[p.module] ||= [] as never)!.push(p);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Permissões" description="Permissões atômicas registradas no sistema." />
      <div className="space-y-4">
        {Object.entries(grouped).map(([mod, perms]) => (
          <Card key={mod} className="shadow-card">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-medium capitalize">{mod}</div>
              <Badge variant="outline">{perms?.length ?? 0}</Badge>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
              <TableBody>
                {perms?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><code className="text-xs">{p.code}</code></TableCell>
                    <TableCell className="text-sm">{p.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ))}
      </div>
    </div>
  );
}
