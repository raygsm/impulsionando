// Página-hub canônica da Administração Master — consume `core_admin_menu`.
// Substitui a navegação inflada por uma matriz visual com 2 vertentes e
// grupos por finalidade. Cada card linka para a rota canônica existente.
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminMenu, type AdminMenuGroup } from "@/lib/admin-menu.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Crown, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/master-hub")({
  component: AdminMasterHub,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center gap-2 text-destructive mb-3">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Erro na Administração Master</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => { reset(); router.invalidate(); }}>Tentar novamente</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-8">Hub não encontrado.</div>,
});

function AdminMasterHub() {
  const fetchMenu = useServerFn(listAdminMenu);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-master-hub"],
    queryFn: () => fetchMenu({ data: {} }),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando menu master…</div>;

  const groups: AdminMenuGroup[] = data?.groups ?? [];
  const imp = groups.filter((g) => g.vertente === "impulsionando");
  const cli = groups.filter((g) => g.vertente === "clientes");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Administração Master</h1>
          <p className="text-sm text-muted-foreground">
            Navegação parametrizável do Core Impulsionando — agrupada por finalidade real de gestão.
          </p>
        </div>
        <Link to="/admin/menu-manager">
          <Button variant="outline" size="sm">Gerenciar menu</Button>
        </Link>
      </header>

      <Tabs defaultValue="impulsionando" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="impulsionando" className="gap-2">
            <Crown className="h-4 w-4" /> Impulsionando
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Building2 className="h-4 w-4" /> Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impulsionando" className="mt-6">
          <VerticalGrid groups={imp} accent="from-amber-500/10 to-amber-500/0" />
        </TabsContent>
        <TabsContent value="clientes" className="mt-6">
          <VerticalGrid groups={cli} accent="from-sky-500/10 to-sky-500/0" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VerticalGrid({ groups, accent }: { groups: AdminMenuGroup[]; accent: string }) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum item habilitado nesta vertente.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map((g) => (
        <Card key={`${g.vertente}-${g.group_key}`} className={`bg-gradient-to-br ${accent}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{g.group_label}</CardTitle>
            <CardDescription>{g.items.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {g.items.map((it) => (
              <Link
                key={it.id}
                to={it.route as any}
                className="flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm hover:bg-muted/60 transition-colors group"
              >
                <span className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{it.item_label}</span>
                  {it.description && (
                    <span className="text-xs text-muted-foreground truncate">{it.description}</span>
                  )}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
