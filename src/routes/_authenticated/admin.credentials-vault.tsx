import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCredentialsVault, toggleCredentialActive } from "@/lib/credentials-vault.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { KeyRound, RefreshCw, ShieldCheck, ShieldOff, CreditCard, MessageSquare, FileText, Plug } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/credentials-vault")({
  component: Page,
  errorComponent: ({ error, reset }) => { const router = useRouter(); return (<div className="p-6"><Card><CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader><CardContent><p className="text-sm">{error.message}</p><Button size="sm" onClick={()=>{reset();router.invalidate();}}>Tentar novamente</Button></CardContent></Card></div>); },
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

function Page() {
  const fn = useServerFn(listCredentialsVault);
  const toggleFn = useServerFn(toggleCredentialActive);
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin","credentials-vault"],
    queryFn: () => fn({ data: { companyId: null } }),
  });
  const toggle = useMutation({
    mutationFn: (v: { table: any; id: string; active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin","credentials-vault"] }); toast.success("Estado atualizado"); },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-72 mb-4"/><Skeleton className="h-64"/></div>;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><KeyRound className="h-6 w-6 text-primary"/>Cofre de Credenciais</h1>
          <p className="text-sm text-muted-foreground">Painel super-only. Valores sensíveis ficam mascarados — secrets reais em Supabase Vault.</p>
        </div>
        <Button size="sm" variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`h-4 w-4 mr-2 ${isFetching?"animate-spin":""}`}/>Atualizar</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4"/>Mercado Pago ({data.mercadoPago.length})</CardTitle></CardHeader>
        <CardContent>
          {data.mercadoPago.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma credencial cadastrada.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2">Empresa</th><th>Env</th><th>Token (ref)</th><th>Public key</th><th>Webhook (ref)</th><th>User MP</th><th>Estado</th><th></th></tr></thead>
              <tbody>{data.mercadoPago.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{r.company_id?.slice(0,8)}…</td>
                  <td><Badge variant={r.environment==="production"?"default":"secondary"}>{r.environment}</Badge></td>
                  <td className="font-mono text-xs">{r.access_token_secret_name ?? "—"}</td>
                  <td className="font-mono text-xs">{r.public_key_masked ?? "—"}</td>
                  <td className="font-mono text-xs">{r.webhook_secret_name ?? "—"}</td>
                  <td className="font-mono text-xs">{r.user_id_mp_masked ?? "—"}</td>
                  <td>{r.active ? <Badge>ativo</Badge> : <Badge variant="secondary">inativo</Badge>}</td>
                  <td><Button size="sm" variant="ghost" onClick={()=>toggle.mutate({table:"mpago_credentials",id:r.id,active:!r.active})}>{r.active?<ShieldOff className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}</Button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4"/>WhatsApp ({data.whatsapp.length})</CardTitle></CardHeader>
        <CardContent>
          {data.whatsapp.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma credencial cadastrada.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2">Empresa</th><th>Label</th><th>Provedor</th><th>Número</th><th>Token</th><th>Webhook</th><th>Saúde</th><th>Estado</th><th></th></tr></thead>
              <tbody>{data.whatsapp.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{r.company_id?.slice(0,8)}…</td>
                  <td>{r.label ?? "—"}</td>
                  <td>{r.provider}</td>
                  <td className="font-mono text-xs">{r.sender_number_masked ?? "—"}</td>
                  <td className="text-xs">{r.access_token_masked ?? <span className="text-muted-foreground">ausente</span>}</td>
                  <td className="text-xs">{r.webhook_secret_masked ?? <span className="text-muted-foreground">ausente</span>}</td>
                  <td><Badge variant={r.health_status==="ok"?"default":r.health_status?"destructive":"secondary"}>{r.health_status ?? "—"}</Badge></td>
                  <td>{r.is_active ? <Badge>ativo</Badge> : <Badge variant="secondary">inativo</Badge>}</td>
                  <td><Button size="sm" variant="ghost" onClick={()=>toggle.mutate({table:"core_whatsapp_credentials",id:r.id,active:!r.is_active})}>{r.is_active?<ShieldOff className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}</Button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Emissores fiscais ({data.fiscal.length})</CardTitle></CardHeader>
        <CardContent>
          {data.fiscal.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum emissor cadastrado.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2">Razão social</th><th>CNPJ</th><th>Provedor</th><th>Env</th><th>RPS série</th><th>Próx. nº</th><th>ISS</th><th>Estado</th><th></th></tr></thead>
              <tbody>{data.fiscal.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2">{r.legal_name ?? r.trade_name ?? "—"}</td>
                  <td className="font-mono text-xs">{r.cnpj_masked ?? "—"}</td>
                  <td>{r.provider ?? "—"}</td>
                  <td><Badge variant={r.environment==="production"?"default":"secondary"}>{r.environment}</Badge></td>
                  <td>{r.rps_serie ?? "—"}</td>
                  <td className="font-mono text-xs">{r.next_rps_number ?? "—"}</td>
                  <td>{r.iss_rate ? `${Number(r.iss_rate)}%` : "—"}</td>
                  <td>{r.is_active ? <Badge>ativo</Badge> : <Badge variant="secondary">inativo</Badge>}</td>
                  <td><Button size="sm" variant="ghost" onClick={()=>toggle.mutate({table:"core_fiscal_issuer_config",id:r.id,active:!r.is_active})}>{r.is_active?<ShieldOff className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}</Button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4"/>Integrações ({data.integrations.length})</CardTitle></CardHeader>
        <CardContent>
          {data.integrations.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma integração cadastrada.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2">Slug</th><th>Nome</th><th>Env</th><th>Status</th><th>Secrets</th><th>Último teste</th><th>Último erro</th><th>Estado</th><th></th></tr></thead>
              <tbody>{data.integrations.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{r.slug}</td>
                  <td>{r.name}</td>
                  <td><Badge variant={r.environment==="production"?"default":"secondary"}>{r.environment ?? "—"}</Badge></td>
                  <td><Badge variant={r.status==="ok"?"default":r.status?"destructive":"secondary"}>{r.status ?? "—"}</Badge></td>
                  <td className="text-xs">{r.secret_refs_count}</td>
                  <td className="text-xs">{r.last_test_at ? new Date(r.last_test_at).toLocaleString("pt-BR") : "—"}</td>
                  <td className="text-xs text-destructive max-w-[200px] truncate">{r.last_error ?? "—"}</td>
                  <td>{r.is_active ? <Badge>ativo</Badge> : <Badge variant="secondary">inativo</Badge>}</td>
                  <td><Button size="sm" variant="ghost" onClick={()=>toggle.mutate({table:"core_integrations",id:r.id,active:!r.is_active})}>{r.is_active?<ShieldOff className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}</Button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </CardContent>
      </Card>

      <Card><CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
        <p>• Tokens de acesso e webhook secrets do Mercado Pago vivem em <code>Supabase Vault</code> — aqui exibimos só a referência (<code>access_token_secret_name</code>, <code>webhook_secret_name</code>).</p>
        <p>• Tokens WhatsApp/Fiscal são armazenados criptografados na própria tabela (campos <code>*_encrypted</code>) e nunca chegam ao cliente — só a confirmação "configurado".</p>
        <p>• Toda alteração é registrada em <code>audit_logs</code>.</p>
      </CardContent></Card>
    </div>
  );
}
