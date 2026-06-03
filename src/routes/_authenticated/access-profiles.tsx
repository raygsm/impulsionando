import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/access-profiles")({
  head: () => ({ meta: [{ title: "Perfis — Impulsionando" }] }),
  component: ProfilesPage,
});

function ProfilesPage() {
  const { data } = useQuery({
    queryKey: ["access-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, slug, name, description, is_master_profile, profile_permissions(permissions(code))")
        .order("is_master_profile", { ascending: false })
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Perfis de acesso" description="Papéis aplicados aos usuários." />
      <Card className="shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Perfil</TableHead><TableHead>Escopo</TableHead><TableHead>Permissões</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.map((p) => {
              const perms = (p.profile_permissions as Array<{ permissions: { code: string } }> | null) ?? [];
              return (
                <TableRow key={p.id}>
                  <TableCell><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.description}</div></TableCell>
                  <TableCell>{p.is_master_profile ? <Badge className="bg-gradient-primary">Impulsionando</Badge> : <Badge variant="outline">Cliente</Badge>}</TableCell>
                  <TableCell><span className="text-sm font-medium">{perms.length}</span><span className="text-xs text-muted-foreground"> permissões</span></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
