import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Usuários — Impulsionando" }] }),
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  const { data: users } = useQuery({
    queryKey: ["users-list", companyFilter],
    queryFn: async () => {
      let q = supabase.from("user_profiles")
        .select("id, user_id, display_name, email, is_active, created_at, companies:company_id(id, name), profiles:profile_id(name, slug)")
        .order("created_at", { ascending: false });
      if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-opt"],
    queryFn: async () => (await supabase.from("companies").select("id, name").order("name")).data ?? [],
  });

  const toggle = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("user_profiles").update({ is_active: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["users-list"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Vínculos de usuário a empresas e perfis de acesso."
        action={
          me?.isSuperAdmin && (
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )
        }
      />
      <Card className="shadow-card">
        <Table>
          <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Empresa</TableHead><TableHead>Perfil</TableHead><TableHead>Ativo</TableHead></TableRow></TableHeader>
          <TableBody>
            {users?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum vínculo.</TableCell></TableRow>}
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell><div className="font-medium">{u.display_name ?? "—"}</div><div className="text-xs text-muted-foreground">{u.email}</div></TableCell>
                <TableCell className="text-sm">{(u.companies as { name: string } | null)?.name ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{(u.profiles as { name: string } | null)?.name ?? "—"}</Badge></TableCell>
                <TableCell><Switch checked={u.is_active} onCheckedChange={(v) => toggle.mutate({ id: u.id, value: v })} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground mt-3">
        Novos usuários se cadastram pela tela de acesso. Vinculação a outras empresas/perfis será expandida na Sprint 2.
      </p>
    </div>
  );
}
