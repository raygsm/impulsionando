import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listMyBrandingCompanies } from "@/lib/my-branding.functions";
import { IdentityTab } from "@/components/core/IdentityTab";
import { EmailAliasesTab } from "@/components/core/EmailAliasesTab";
import { DomainTab } from "@/components/core/DomainTab";
import { BrandingCompletenessCard } from "@/components/core/BrandingCompletenessCard";
import { BrandingPreviewTab } from "@/components/core/BrandingPreviewTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: BrandingPage,
});

function BrandingPage() {
  const fetchFn = useServerFn(listMyBrandingCompanies);
  const { data, isLoading } = useQuery({
    queryKey: ["my-branding-companies"],
    queryFn: () => fetchFn(),
  });

  const companies = data?.companies ?? [];
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected && companies.length > 0) setSelected(companies[0].id);
  }, [companies, selected]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-7 w-7" /> Branding & White-label
        </h1>
        <p className="text-muted-foreground">Logo, paleta, domínio próprio e e-mails do time — aplicado em todo o tenant.</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando empresas…</CardContent></Card>
      ) : companies.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma empresa vinculada à sua conta. Conclua o onboarding em <a className="underline" href="/onboarding">/onboarding</a>.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle>Empresa</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={selected ?? ""} onValueChange={setSelected}>
                  <SelectTrigger className="w-[320px]"><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.trade_name || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected && (() => {
                  const c = companies.find((x) => x.id === selected);
                  return c ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-6 w-6 rounded border"
                        style={{ background: c.primary_color || "transparent" }}
                        title={`Primária ${c.primary_color || "—"}`}
                      />
                      <span
                        className="inline-block h-6 w-6 rounded border"
                        style={{ background: c.secondary_color || "transparent" }}
                        title={`Secundária ${c.secondary_color || "—"}`}
                      />
                      {c.logo_url ? <img src={c.logo_url} alt="logo" className="h-8 w-auto border rounded" /> : <Badge variant="outline">sem logo</Badge>}
                      <Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "ativa" : "inativa"}</Badge>
                    </div>
                  ) : null;
                })()}
              </div>
            </CardHeader>
          </Card>

          {selected && <BrandingCompletenessCard companyId={selected} />}

          {selected && (
            <Tabs defaultValue="identity">
              <TabsList>
                <TabsTrigger value="identity">Identidade & Marca</TabsTrigger>
                <TabsTrigger value="emails">E-mails do time</TabsTrigger>
                <TabsTrigger value="domain">Domínio próprio</TabsTrigger>
                <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
              </TabsList>
              <TabsContent value="identity" className="mt-4"><IdentityTab companyId={selected} /></TabsContent>
              <TabsContent value="emails" className="mt-4"><EmailAliasesTab companyId={selected} /></TabsContent>
              <TabsContent value="domain" className="mt-4"><DomainTab companyId={selected} /></TabsContent>
              <TabsContent value="preview" className="mt-4"><BrandingPreviewTab companyId={selected} /></TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
