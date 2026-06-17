import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { KeyRound, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/access-profiles/matrix")({
  head: () => ({ meta: [{ title: "Matriz de Permissões — Impulsionando" }] }),
  component: MatrixPage,
});

interface MatrixRow {
  profile_id: string;
  profile_name: string;
  profile_slug: string;
  is_master_profile: boolean;
  permission_id: string;
  permission_code: string;
  permission_module: string;
  granted: boolean;
}

async function fetchMatrix(): Promise<MatrixRow[]> {
  const { data, error } = await supabase.rpc("permission_matrix" as never);
  if (error) throw error;
  return (data ?? []) as unknown as MatrixRow[];
}

function MatrixPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["permission-matrix"], queryFn: fetchMatrix });
  const [q, setQ] = useState("");

  const { profiles, permissions, granted } = useMemo(() => {
    const profilesMap = new Map<string, { id: string; name: string; isMaster: boolean }>();
    const permsMap = new Map<string, { id: string; code: string; module: string }>();
    const grantedSet = new Set<string>();
    for (const r of data ?? []) {
      profilesMap.set(r.profile_id, { id: r.profile_id, name: r.profile_name, isMaster: r.is_master_profile });
      permsMap.set(r.permission_id, { id: r.permission_id, code: r.permission_code, module: r.permission_module });
      if (r.granted) grantedSet.add(`${r.profile_id}:${r.permission_id}`);
    }
    return {
      profiles: Array.from(profilesMap.values()),
      permissions: Array.from(permsMap.values()).sort((a, b) =>
        (a.module + a.code).localeCompare(b.module + b.code)),
      granted: grantedSet,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return permissions;
    return permissions.filter((p) => p.code.toLowerCase().includes(term) || p.module.toLowerCase().includes(term));
  }, [permissions, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const p of filtered) {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggle = useMutation({
    mutationFn: async (v: { profileId: string; permissionId: string; granted: boolean }) => {
      const { error } = await supabase.rpc("permission_matrix_toggle" as never, {
        _profile_id: v.profileId, _permission_id: v.permissionId, _granted: v.granted,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permission-matrix"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="container mx-auto py-6 max-w-[1400px]">
      <PageHeader
        title="Matriz de Permissões"
        description="SIM/NÃO por perfil × permissão. Mudanças são salvas automaticamente."
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por permissão ou módulo…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Badge variant="outline"><KeyRound className="h-3 w-3 mr-1" /> {profiles.length} perfis · {permissions.length} permissões</Badge>
      </div>

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && (
        <Card className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur">
              <tr>
                <th className="text-left px-4 py-3 sticky left-0 bg-muted/80 z-10 min-w-[260px]">Permissão</th>
                {profiles.map((p) => (
                  <th key={p.id} className="px-3 py-3 text-center min-w-[120px]">
                    <div className="font-semibold">{p.name}</div>
                    {p.isMaster && <Badge variant="secondary" className="mt-1">master</Badge>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.map(([mod, perms]) => (
                <>
                  <tr key={`hdr-${mod}`} className="bg-muted/30">
                    <td colSpan={profiles.length + 1} className="px-4 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {mod}
                    </td>
                  </tr>
                  {perms.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-2 sticky left-0 bg-background z-10">
                        <div className="font-mono text-xs">{p.code}</div>
                      </td>
                      {profiles.map((pr) => {
                        const key = `${pr.id}:${p.id}`;
                        const isOn = granted.has(key);
                        return (
                          <td key={pr.id} className="px-3 py-2 text-center">
                            <Switch
                              checked={isOn}
                              disabled={toggle.isPending}
                              onCheckedChange={(v) => {
                                if (isOn) granted.delete(key); else granted.add(key);
                                toggle.mutate({ profileId: pr.id, permissionId: p.id, granted: v });
                              }}
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
        </Card>
      )}
    </div>
  );
}
