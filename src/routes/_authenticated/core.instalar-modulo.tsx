import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listCompaniesForFactory, listInstallableModules } from "@/lib/factory.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InstallModuleDialog } from "@/components/core/InstallModuleDialog";
import { Download, Settings, Boxes } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/instalar-modulo")({
  validateSearch: (s: Record<string, unknown>) => ({
    companyId: (s.companyId as string | undefined) ?? undefined,
  }),
  head: () => ({ meta: [{ title: "Instalar Módulo — Fábrica de Projetos" }] }),
  component: InstalarModuloPage,
});

function InstalarModuloPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | undefined>(search.companyId);
  const [moduleFilter, setModuleFilter] = useState("");

  const listCompanies = useServerFn(listCompaniesForFactory);
  const { data: companiesData } = useQuery({
    queryKey: ["factory-companies"],
    queryFn: () => listCompanies(),
  });

  const listMods = useServerFn(listInstallableModules);
  const { data: modulesData } = useQuery({
    queryKey: ["factory-installable-modules"],
    queryFn: () => listMods(),
  });

  const companies = companiesData?.companies ?? [];
  const modules = (modulesData?.modules ?? []).filter((m: { name: string; slug: string }) =>
    !moduleFilter || m.name.toLowerCase().includes(moduleFilter.toLowerCase()) || m.slug.includes(moduleFilter.toLowerCase()),
  );

  const selectedCompany = companies.find((c: { id: string }) => c.id === companyId);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Boxes className="w-6 h-6 text-primary" /> Instalar Módulos</h1>
        <p className="text-sm text-muted-foreground">
          Selecione um cliente/projeto e instale módulos certificados em poucos cliques. A instalação copia apenas estrutura — nunca dados reais, credenciais ou usuários.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <Label className="text-xs">Cliente / Projeto</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger><SelectValue placeholder="Selecione o cliente…" /></SelectTrigger>
          <SelectContent>
            {companies.map((c: { id: string; name: string; trade_name: string | null; environment: string }) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.trade_name ? `· ${c.trade_name}` : ""} · {c.environment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCompany && (
          <div className="text-xs text-muted-foreground">
            Ambiente: <Badge variant="secondary">{(selectedCompany as { environment: string }).environment}</Badge>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">
          Este módulo será instalado como nova instância estrutural dentro do projeto selecionado. Dados reais, credenciais e informações sensíveis de outros clientes NÃO serão copiados.
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Módulos-base disponíveis</Label>
          <Input className="max-w-xs" placeholder="filtrar…" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {modules.map((m: { id: string; slug: string; name: string; description: string | null; readiness_status: string | null; current_version: string | null; category: string | null }) => {
            const certified = m.readiness_status === "certificado" || m.readiness_status === "publicado";
            return (
              <div key={m.id} className={`border rounded p-3 flex flex-col gap-2 ${!certified ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{m.name}</div>
                    {m.description && <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>}
                  </div>
                  <Badge variant={certified ? "secondary" : "outline"} className="text-[10px] shrink-0">
                    {m.readiness_status ?? "—"}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">{m.category ?? "—"} · v{m.current_version ?? "?"}</div>
                <div className="flex gap-1 mt-1">
                  <InstallModuleDialog
                    moduleSlug={m.slug}
                    moduleName={m.name}
                    companyId={companyId}
                    onInstalled={() => {
                      if (companyId) {
                        navigate({
                          to: "/core/cliente/$id/modulo/$slug/configurar",
                          params: { id: companyId, slug: m.slug },
                        });
                      }
                    }}
                    trigger={
                      <Button size="sm" disabled={!companyId || !certified}>
                        <Download className="w-4 h-4 mr-1" /> Instalar
                      </Button>
                    }
                  />
                  {companyId && (
                    <Link
                      to="/core/cliente/$id/modulo/$slug/configurar"
                      params={{ id: companyId, slug: m.slug }}
                    >
                      <Button size="sm" variant="outline"><Settings className="w-4 h-4 mr-1" /> Configurar</Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {modules.length === 0 && (
            <div className="text-sm text-muted-foreground col-span-2 text-center py-8">Nenhum módulo encontrado.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
