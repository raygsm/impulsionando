import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, AlertTriangle, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/portal/proprietario/$token")({
  head: () => ({ meta: [{ title: "Portal do Proprietário — Imobiliária" }] }),
  component: PortalProprietario,
});

interface OwnerPortalData {
  error?: string;
  owner?: { full_name: string; email: string | null; phone: string | null; document: string | null; status: string };
  properties?: Array<{
    id: string; title: string; status: string; price: number | null;
    address: string | null; city: string | null; state: string | null;
    bedrooms: number | null; bathrooms: number | null; area: number | null;
    created_at: string;
  }>;
}

function formatPrice(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function PortalProprietario() {
  const { token } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["owner-portal", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_owner_portal_data", { _token: token });
      if (error) throw error;
      return data as OwnerPortalData;
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  if (!data || data.error || !data.owner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h1 className="font-semibold text-lg mb-2">Acesso não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            Este link é inválido ou foi revogado. Entre em contato com sua imobiliária.
          </p>
        </Card>
      </div>
    );
  }

  const { owner, properties = [] } = data;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3"><Building2 className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="font-bold text-xl">{owner.full_name}</h1>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              {owner.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {owner.email}</span>}
              {owner.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {owner.phone}</span>}
            </div>
          </div>
        </header>

        <Card className="p-4 mb-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Portal do Proprietário</strong> — área somente leitura. Para alterar dados ou
            negociar valores, fale com sua imobiliária.
          </p>
        </Card>

        <section>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Home className="w-5 h-5" /> Seus imóveis ({properties.length})
          </h2>
          {properties.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhum imóvel vinculado a este cadastro ainda.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {properties.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium">{p.title}</h3>
                    <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {(p.address || p.city) && <div>{[p.address, p.city, p.state].filter(Boolean).join(", ")}</div>}
                    <div className="flex gap-3 text-xs">
                      {p.bedrooms != null && <span>{p.bedrooms} dorm.</span>}
                      {p.bathrooms != null && <span>{p.bathrooms} ban.</span>}
                      {p.area != null && <span>{p.area} m²</span>}
                    </div>
                    <div className="font-semibold text-foreground pt-1">{formatPrice(p.price)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Powered by Impulsionando • {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
