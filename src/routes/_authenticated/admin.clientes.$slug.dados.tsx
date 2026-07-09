import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/dados")({
  head: () => ({ meta: [{ title: "Dados do cliente — Impulsionando" }] }),
  component: TenantDadosTab,
});

// Onda 3.2 — Cliente 360. Frontend-only: apenas a estrutura visual da aba
// "Dados do cliente". Leitura real ocorre em /admin/clientes/$slug (Resumo)
// e em /core/cliente/$id. Backend será destravado nas fases posteriores.
function TenantDadosTab() {
  const { slug } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <header>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Dados do cliente
        </h2>
        <p className="text-sm text-muted-foreground">
          Identidade, contatos, endereço e status comercial de <code>{slug}</code>.
        </p>
      </header>

      <Card className="p-6 space-y-4 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <Field icon={<Building2 className="h-4 w-4" />} label="Razão social" hint="Nome legal registrado do cliente conectado ao Core." />
          <Field icon={<Building2 className="h-4 w-4" />} label="Nome fantasia" hint="Nome comercial exibido nas telas do cliente." />
          <Field icon={<Mail className="h-4 w-4" />} label="E-mail principal" />
          <Field icon={<Phone className="h-4 w-4" />} label="Telefone / WhatsApp" />
          <Field icon={<MapPin className="h-4 w-4" />} label="Endereço" hint="Cidade / UF / país usados para locale e faturamento." />
          <Field icon={<Globe className="h-4 w-4" />} label="Site institucional" />
        </div>

        <div className="flex flex-wrap gap-2 items-center border-t pt-3">
          <Badge variant="outline">Aba visual · Onda 3.2</Badge>
          <span className="text-xs text-muted-foreground">
            Enquanto o backend não é destravado, a leitura e edição continuam disponíveis em Resumo e no Core.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug" params={{ slug }}>Abrir Resumo</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/clientes/$slug/configuracoes" params={{ slug }}>Ir para Configurações</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-medium text-muted-foreground/70">—</div>
      {hint ? <div className="text-[11px] text-muted-foreground mt-1">{hint}</div> : null}
    </div>
  );
}
