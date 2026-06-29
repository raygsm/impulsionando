import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Shield, UserMinus, UserPlus } from "lucide-react";
import {
  ALL_APP_ROLES,
  assignTenantRole,
  findUserForTenant,
  listRbacTenants,
  listTenantRoleAssignments,
  revokeTenantRole,
  type AppRole,
} from "@/lib/rbac-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/rbac")({
  head: () => ({ meta: [{ title: "RBAC por Tenant — Impulsionando" }] }),
  component: AdminRbacPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <Card className="p-4 text-sm text-destructive">{String(error?.message ?? error)}</Card>
        <Button className="mt-3" size="sm" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">Não encontrado.</div>,
});

function AdminRbacPage() {
  const router = useRouter();
  const fnListTenants = useServerFn(listRbacTenants);
  const fnListAssignments = useServerFn(listTenantRoleAssignments);
  const fnAssign = useServerFn(assignTenantRole);
  const fnRevoke = useServerFn(revokeTenantRole);
  const fnFind = useServerFn(findUserForTenant);

  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [pickedUser, setPickedUser] = useState<{ user_id: string; label: string } | null>(null);
  const [pickedRole, setPickedRole] = useState<AppRole>("operador");

  const tenantsQ = useQuery({ queryKey: ["rbac-tenants"], queryFn: () => fnListTenants() });

  const filteredTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    const list = tenantsQ.data ?? [];
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q) || (t.public_slug ?? "").toLowerCase().includes(q));
  }, [tenantSearch, tenantsQ.data]);

  const assignmentsQ = useQuery({
    queryKey: ["rbac-assignments", selectedTenant],
    queryFn: () => fnListAssignments({ data: { companyId: selectedTenant! } }),
    enabled: !!selectedTenant,
  });

  const searchUsersQ = useQuery({
    queryKey: ["rbac-find-user", selectedTenant, userSearch],
    queryFn: () => fnFind({ data: { companyId: selectedTenant!, query: userSearch } }),
    enabled: !!selectedTenant && userSearch.length >= 2,
  });

  const assignMut = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) =>
      fnAssign({ data: { companyId: selectedTenant!, userId: vars.userId, role: vars.role } }),
    onSuccess: (res) => {
      toast.success(res.already ? "Usuário já possuía esse papel" : "Papel atribuído");
      setPickedUser(null);
      setUserSearch("");
      assignmentsQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atribuir papel"),
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => fnRevoke({ data: { roleAssignmentId: id } }),
    onSuccess: () => {
      toast.success("Papel revogado");
      assignmentsQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao revogar"),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="RBAC por Tenant"
        description="Gerencie papéis (user_roles) de cada usuário dentro de cada tenant. Apenas equipe Impulsionando."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Lista de tenants */}
        <Card className="p-3 shadow-card">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tenant"
              className="pl-8"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[70vh] overflow-y-auto space-y-1">
            {tenantsQ.isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            {filteredTenants.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTenant(t.id)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-sm hover:bg-accent ${selectedTenant === t.id ? "bg-accent font-medium" : ""}`}
              >
                <div className="truncate">{t.name}</div>
                {t.public_slug && <div className="text-[10px] text-muted-foreground">{t.public_slug}</div>}
              </button>
            ))}
            {!tenantsQ.isLoading && filteredTenants.length === 0 && (
              <div className="text-sm text-muted-foreground p-3">Nenhum tenant.</div>
            )}
          </div>
        </Card>

        {/* Detalhe */}
        <Card className="p-4 shadow-card">
          {!selectedTenant ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Selecione um tenant à esquerda para gerenciar papéis.
            </div>
          ) : (
            <>
              {/* Atribuir */}
              <div className="border rounded-md p-3 mb-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Atribuir papel
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
                  <div className="relative">
                    <Input
                      placeholder="Buscar usuário deste tenant (email ou nome, min. 2 caracteres)"
                      value={pickedUser ? pickedUser.label : userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setPickedUser(null);
                      }}
                    />
                    {!pickedUser && userSearch.length >= 2 && (
                      <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-56 overflow-auto">
                        {searchUsersQ.isLoading && <div className="p-2 text-xs">Buscando…</div>}
                        {(searchUsersQ.data ?? []).map((u) => {
                          const label = u.display_name ?? u.email ?? u.user_id;
                          return (
                            <button
                              key={u.user_id}
                              onClick={() => setPickedUser({ user_id: u.user_id, label })}
                              className="block w-full text-left px-2 py-1.5 text-sm hover:bg-accent"
                            >
                              <div>{label}</div>
                              {u.email && <div className="text-[10px] text-muted-foreground">{u.email}</div>}
                            </button>
                          );
                        })}
                        {!searchUsersQ.isLoading && (searchUsersQ.data ?? []).length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground">Nenhum resultado.</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Select value={pickedRole} onValueChange={(v) => setPickedRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_APP_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!pickedUser || assignMut.isPending}
                    onClick={() => pickedUser && assignMut.mutate({ userId: pickedUser.user_id, role: pickedRole })}
                  >
                    Atribuir
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Só aparecem usuários já vinculados a este tenant via <code>user_profiles</code>.
                </p>
              </div>

              {/* Tabela de membros */}
              <div className="text-sm font-medium mb-2">Membros e papéis</div>
              {assignmentsQ.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Papéis</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(assignmentsQ.data ?? []).map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">
                          {u.display_name ?? "—"}
                          {!u.is_active && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{u.email ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-xs text-muted-foreground">sem papéis</span>}
                            {u.roles.map((r) => (
                              <Badge key={r.id} variant="secondary" className="gap-1">
                                {r.role}
                                <button
                                  className="ml-1 opacity-60 hover:opacity-100"
                                  title="Revogar"
                                  onClick={() => revokeMut.mutate(r.id)}
                                >
                                  <UserMinus className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                    {(assignmentsQ.data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground text-center py-6">
                          Nenhum usuário neste tenant.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
