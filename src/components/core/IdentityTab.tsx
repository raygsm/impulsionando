import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCompanyIdentity, updateCompanyIdentity } from "@/lib/company-identity.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Palette, MessageCircle, Globe, Mail, MapPin, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

const FIELDS: Array<{ key: string; label: string; type?: string; group: string }> = [
  { key: "name", label: "Razão / Nome", group: "core" },
  { key: "trade_name", label: "Nome fantasia", group: "core" },
  { key: "legal_name", label: "Razão social", group: "core" },
  { key: "document", label: "CNPJ / CPF", group: "core" },
  { key: "company_type", label: "Tipo (clínica, escritório…)", group: "core" },
  { key: "segment", label: "Segmento", group: "core" },
  { key: "owner_name", label: "Responsável", group: "core" },

  { key: "logo_url", label: "URL do logotipo", group: "brand" },
  { key: "primary_color", label: "Cor primária (#hex)", group: "brand" },
  { key: "secondary_color", label: "Cor secundária (#hex)", group: "brand" },

  { key: "email", label: "E-mail principal", type: "email", group: "contact" },
  { key: "phone", label: "Telefone", group: "contact" },
  { key: "whatsapp", label: "WhatsApp", group: "contact" },
  { key: "financial_email", label: "E-mail financeiro", type: "email", group: "contact" },
  { key: "support_email", label: "E-mail de suporte", type: "email", group: "contact" },
  { key: "commercial_email", label: "E-mail comercial", type: "email", group: "contact" },

  { key: "domain", label: "Domínio próprio", group: "web" },
  { key: "subdomain", label: "Subdomínio (impulsionando.com.br)", group: "web" },
  { key: "website", label: "Site", group: "web" },
  { key: "instagram", label: "Instagram", group: "web" },
  { key: "facebook", label: "Facebook", group: "web" },

  { key: "address_line", label: "Endereço", group: "address" },
  { key: "address_city", label: "Cidade", group: "address" },
  { key: "address_state", label: "UF", group: "address" },
  { key: "address_zip", label: "CEP", group: "address" },
];

const GROUPS: Array<{ id: string; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "core", title: "Identidade", icon: UserIcon },
  { id: "brand", title: "Marca", icon: Palette },
  { id: "contact", title: "Contato e comunicação", icon: MessageCircle },
  { id: "web", title: "Web e domínios", icon: Globe },
  { id: "address", title: "Endereço", icon: MapPin },
];

export function IdentityTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const fetchFn = useServerFn(getCompanyIdentity);
  const updateFn = useServerFn(updateCompanyIdentity);

  const { data, isLoading } = useQuery({
    queryKey: ["company-identity", companyId],
    queryFn: () => fetchFn({ data: { companyId } }),
  });

  const [form, setForm] = useState<Record<string, string>>({});

  const initial = data?.company ?? {};
  const value = (k: string) =>
    form[k] !== undefined ? form[k] : ((initial as Record<string, unknown>)[k] as string) ?? "";

  const save = useMutation({
    mutationFn: () => updateFn({ data: { companyId, patch: form as never } }),
    onSuccess: () => {
      toast.success("Identidade atualizada — toda nova comunicação herdará estes dados.");
      qc.invalidateQueries({ queryKey: ["company-identity", companyId] });
      qc.invalidateQueries({ queryKey: ["client-360", companyId] });
      setForm({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Card className="p-4">Carregando identidade…</Card>;

  const identity = (data?.identity ?? {}) as Record<string, string>;
  const primary = identity.company_primary_color || "#7c3aed";

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {identity.company_logo ? (
            <img src={identity.company_logo} alt="" className="w-12 h-12 rounded object-cover" />
          ) : (
            <div className="w-12 h-12 rounded flex items-center justify-center text-white font-bold"
                 style={{ background: primary }}>
              {(identity.company_name || "?").charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{identity.company_name ?? "—"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {identity.company_whatsapp ?? "—"} · {identity.company_email ?? "—"}
            </div>
          </div>
          <Badge variant="outline">Pré-visualização</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Estes dados são injetados automaticamente em toda comunicação (e-mail, WhatsApp, in-app) emitida por qualquer módulo desta empresa. Nenhum template precisa ser editado.
        </p>
      </Card>

      {GROUPS.map((g) => (
        <Card key={g.id} className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <g.icon className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{g.title}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.filter((f) => f.group === g.id).map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  value={value(f.key)}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="sticky bottom-2 z-10">
        <Button
          className="w-full"
          onClick={() => save.mutate()}
          disabled={Object.keys(form).length === 0 || save.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {save.isPending ? "Salvando…" : "Salvar identidade"}
        </Button>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Últimas comunicações enviadas
        </h3>
        {data?.lastMessages?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma comunicação registrada.</p>
        )}
        <div className="space-y-1.5">
          {data?.lastMessages?.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs border-b last:border-0 py-1.5">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.event_code}</div>
                <div className="text-muted-foreground truncate">
                  {m.channel} · {m.recipient_email ?? m.recipient_phone ?? "—"}
                </div>
              </div>
              <Badge variant={m.status === "sent" ? "default" : "outline"}>{m.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
