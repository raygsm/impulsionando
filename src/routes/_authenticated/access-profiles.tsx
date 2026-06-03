import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/access-profiles")({
  head: () => ({ meta: [{ title: "Perfis — Impulsionando" }] }),
  component: ProfilesPage,
});

interface Profile { id: string; slug: string; name: string; is_master_profile: boolean }
interface Permission { id: string; code: string; module: string; description: string | null }
interface PP { profile_id: string; permission_id: string }

function ProfilesPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const canEdit = !!me?.isSuperAdmin;

  const { data: profiles, isLoading: lp } = useQuery({
    queryKey: ["profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles")
        .select("id, slug, name, is_master_profile")
        .order("is_master_profile", { ascending: false }).order("name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: permissions, isLoading: lpe } = useQuery({
    queryKey: ["permissions-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions")
        .select("id, code, module, description").order("module").order("code");
      if (error) throw error;
      return data as Permission[];
    },
  });

  const { data: pp, isLoading: lpp } = useQuery({
    queryKey: ["profile-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_permissions").select("profile_id, permission_id");
      if (error) throw error;
      return data as PP[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ profile_id, permission_id, on }: { profile_id: string; permission_id: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("profile_permissions").insert({ profile_id, permission_id });
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("profile_permissions").delete()
          .eq("profile_id", profile_id).eq("permission_id", permission_id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-permissions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (lp || lpe || lpp) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const map = new Set(pp?.map((r) => `${r.profile_id}:${r.permission_id}`));
  const grouped = (permissions ?? []).reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ||= []).push(p); return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Perfis de acesso"
        description={canEdit ? "Edite a matriz de permissões por perfil." : "Visualização da matriz de permissões."}
        action={!canEdit && <Badge variant="outline">Somente leitura</Badge>}
      />

      <Card className="shadow-card overflow-auto">
        <div className="min-w-max">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-3 font-medium sticky left-0 bg-muted/50 min-w-[260px]">Permissão</th>
                {profiles?.map((pr) => (
                  <th key={pr.id} className="p-3 text-center font-medium min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="truncate max-w-[110px]" title={pr.name}>{pr.name}</span>
                      {pr.is_master_profile && <Badge className="bg-gradient-primary text-[9px] px-1.5 py-0">master</Badge>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([mod, perms]) => (
                <>
                  <tr key={`h-${mod}`} className="bg-accent/30">
                    <td colSpan={(profiles?.length ?? 0) + 1} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {mod}
                    </td>
                  </tr>
                  {perms.map((perm) => (
                    <tr key={perm.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 sticky left-0 bg-background">
                        <div className="font-mono text-xs">{perm.code}</div>
                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                      </td>
                      {profiles?.map((pr) => {
                        const has = map.has(`${pr.id}:${perm.id}`);
                        const isMaster = pr.is_master_profile;
                        return (
                          <td key={pr.id} className="p-3 text-center">
                            <Checkbox
                              checked={isMaster || has}
                              disabled={!canEdit || isMaster}
                              onCheckedChange={(v) => toggle.mutate({ profile_id: pr.id, permission_id: perm.id, on: !!v })}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-3">
        Perfis master (Impulsionando) sempre têm acesso total; alterações ficam desabilitadas.
      </p>
    </div>
  );
}
