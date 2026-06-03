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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Usuários — Impulsionando" }] }),
  component: UsersPage,
});

interface UserRow {
  id: string; user_id: string; display_name: string | null; email: string | null;
  is_active: boolean; company_id: string;
  companies: { name: string } | null;
  profiles: { name: string; slug: string } | null;
}

interface Permission { id: string; code: string; module: string; description: string | null }
interface Override { permission_id: string; effect: "grant" | "deny" }

function UsersPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [editing, setEditing] = useState<UserRow | null>(null);

  const { data: users } = useQuery({
    queryKey: ["users-list", companyFilter],
    queryFn: async () => {
      let q = supabase.from("user_profiles")
        .select("id, user_id, display_name, email, is_active, company_id, companies:company_id(name), profiles:profile_id(name, slug)")
        .order("created_at", { ascending: false });
      if (companyFilter !== "all") q = q.eq("company_id", companyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as UserRow[];
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["companies-opt-users"],
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
        description="Vínculos de usuário a empresas, perfis e permissões."
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
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead><TableHead>Empresa</TableHead>
              <TableHead>Perfil</TableHead><TableHead>Ativo</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum vínculo.</TableCell></TableRow>}
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.display_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell className="text-sm">{u.companies?.name ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{u.profiles?.name ?? "—"}</Badge></TableCell>
                <TableCell><Switch checked={u.is_active} onCheckedChange={(v) => toggle.mutate({ id: u.id, value: v })} /></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <OverridesDialog user={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function OverridesDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const open = !!user;

  const { data: perms } = useQuery({
    queryKey: ["permissions-all-dlg"],
    enabled: open,
    queryFn: async () => (await supabase.from("permissions").select("id, code, module, description").order("module").order("code")).data as Permission[] ?? [],
  });

  const { data: overrides } = useQuery({
    queryKey: ["user-overrides", user?.user_id, user?.company_id],
    enabled: open && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_permission_overrides")
        .select("permission_id, effect")
        .eq("user_id", user!.user_id).eq("company_id", user!.company_id);
      if (error) throw error;
      return data as Override[];
    },
  });

  const setOverride = useMutation({
    mutationFn: async ({ permission_id, effect }: { permission_id: string; effect: "grant" | "deny" | "none" }) => {
      if (!user) return;
      if (effect === "none") {
        const { error } = await supabase.from("user_permission_overrides").delete()
          .eq("user_id", user.user_id).eq("company_id", user.company_id).eq("permission_id", permission_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_permission_overrides").upsert(
          { user_id: user.user_id, company_id: user.company_id, permission_id, effect },
          { onConflict: "user_id,company_id,permission_id" }
        );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-overrides"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const map = new Map(overrides?.map((o) => [o.permission_id, o.effect]));
  const grouped = (perms ?? []).reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ||= []).push(p); return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permissões individuais</DialogTitle>
          <DialogDescription>
            {user?.display_name ?? user?.email} — perfil <strong>{user?.profiles?.name}</strong>.
            Use <Badge variant="outline" className="mx-1">Liberar</Badge> para conceder além do perfil, ou
            <Badge variant="outline" className="mx-1">Bloquear</Badge> para revogar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(grouped).map(([mod, list]) => (
            <div key={mod}>
              <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">{mod}</div>
              <div className="space-y-1.5">
                {list.map((p) => {
                  const cur = map.get(p.id) ?? "none";
                  return (
                    <div key={p.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs">{p.code}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant={cur === "grant" ? "default" : "outline"}
                          onClick={() => setOverride.mutate({ permission_id: p.id, effect: cur === "grant" ? "none" : "grant" })}>
                          Liberar
                        </Button>
                        <Button size="sm" variant={cur === "deny" ? "destructive" : "outline"}
                          onClick={() => setOverride.mutate({ permission_id: p.id, effect: cur === "deny" ? "none" : "deny" })}>
                          Bloquear
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
