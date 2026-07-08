import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyTenantDomain,
  requestCustomDomain,
  recheckTenantDns,
} from "@/lib/tenant-domain.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, RefreshCw, Save, ShieldCheck, ShieldAlert, Clock, Copy } from "lucide-react";
import { toast } from "sonner";

function statusBadge(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  if (["active", "verified", "ok", "issued"].includes(s)) {
    return <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> {status}</Badge>;
  }
  if (["pending", "provisioning", "checking"].includes(s)) {
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {status}</Badge>;
  }
  if (["error", "failed", "expired"].includes(s)) {
    return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> {status}</Badge>;
  }
  return <Badge variant="secondary">{status || "—"}</Badge>;
}

function CopyButton({ value }: { value: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      aria-label="Copiar valor"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("Copiado");
      }}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
  );
}

export function DomainTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyTenantDomain);
  const requestFn = useServerFn(requestCustomDomain);
  const recheckFn = useServerFn(recheckTenantDns);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-domain", companyId],
    queryFn: () => getFn({ data: { companyId } }),
  });

  const identity = data?.identity;
  const lovable = data?.lovable;
  const [domain, setDomain] = useState("");

  useEffect(() => {
    setDomain(identity?.custom_domain ?? "");
  }, [identity?.custom_domain]);

  const saveMut = useMutation({
    mutationFn: (custom: string | null) => requestFn({ data: { companyId, customDomain: custom } }),
    onSuccess: () => {
      toast.success("Domínio salvo. Configure os DNS para verificar.");
      qc.invalidateQueries({ queryKey: ["tenant-domain", companyId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  const recheckMut = useMutation({
    mutationFn: () => recheckFn({ data: { companyId } }),
    onSuccess: () => {
      toast.success("Verificação solicitada.");
      qc.invalidateQueries({ queryKey: ["tenant-domain", companyId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao reverificar"),
  });

  if (isLoading) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando…</CardContent></Card>;
  }
  if (!identity) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Identidade ainda não provisionada. Conclua o onboarding para liberar domínio próprio.
        </CardContent>
      </Card>
    );
  }

  const txtValue = `${lovable?.txtValuePrefix}${identity.id.slice(0, 12)}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Endereços do tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-muted-foreground text-xs uppercase">Subdomínio Impulsionando</div>
              <div className="font-mono">{identity.full_domain ?? `${identity.subdomain}.${identity.root_domain}`}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase">Domínio próprio</div>
              <div className="font-mono">{identity.custom_domain ?? "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs uppercase">DNS</span>
              {statusBadge(identity.dns_status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs uppercase">SSL</span>
              {statusBadge(identity.ssl_status)}
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase">Provisionado</div>
              <div>{identity.provisioned_at ? new Date(identity.provisioned_at).toLocaleString("pt-BR") : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase">Última checagem DNS</div>
              <div>{identity.dns_last_checked_at ? new Date(identity.dns_last_checked_at).toLocaleString("pt-BR") : "—"}</div>
            </div>
          </div>
          {identity.dns_error && (
            <div className="text-destructive text-xs">Último erro: {identity.dns_error}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurar domínio próprio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domínio (ex: app.seusite.com.br)</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="app.seusite.com.br"
                className="font-mono"
              />
              <Button
                onClick={() => saveMut.mutate(domain.trim() || null)}
                disabled={saveMut.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" /> Salvar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Após salvar, crie os registros DNS abaixo no seu provedor (Registro.br, Cloudflare, GoDaddy, etc.). A propagação pode levar até 72h.
            </p>
          </div>

          <div className="rounded-md border">
            <div className="px-4 py-2 text-xs font-medium bg-muted/50">Registros DNS necessários</div>
            <div className="divide-y text-sm">
              <div className="p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2 font-mono text-xs">A</div>
                <div className="col-span-3 font-mono text-xs">@</div>
                <div className="col-span-6 font-mono text-xs flex items-center gap-2">
                  {lovable?.aRecordValue}
                  <CopyButton value={lovable?.aRecordValue ?? ""} />
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">root</div>
              </div>
              <div className="p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2 font-mono text-xs">A</div>
                <div className="col-span-3 font-mono text-xs">www</div>
                <div className="col-span-6 font-mono text-xs flex items-center gap-2">
                  {lovable?.aRecordValue}
                  <CopyButton value={lovable?.aRecordValue ?? ""} />
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">www</div>
              </div>
              <div className="p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-2 font-mono text-xs">TXT</div>
                <div className="col-span-3 font-mono text-xs">{lovable?.txtName}</div>
                <div className="col-span-6 font-mono text-xs flex items-center gap-2 break-all">
                  {txtValue}
                  <CopyButton value={txtValue} />
                </div>
                <div className="col-span-1 text-xs text-muted-foreground">verify</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Quando os registros estiverem ativos, clique em reverificar para provisionar SSL automaticamente.
            </p>
            <Button
              variant="outline"
              onClick={() => recheckMut.mutate()}
              disabled={recheckMut.isPending || !identity.custom_domain}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${recheckMut.isPending ? "animate-spin" : ""}`} /> Reverificar DNS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
