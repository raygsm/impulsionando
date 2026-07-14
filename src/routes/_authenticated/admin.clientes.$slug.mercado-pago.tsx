import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, KeyRound, Webhook, ShieldCheck, ArrowRight, CheckCircle2, Circle, Save } from "lucide-react";
import { CoreSection } from "@/components/impulsionando";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { saveMpagoCredentials, getMpagoCredentialsMasked } from "@/lib/mpago-credentials.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/mercado-pago")({
  head: () => ({ meta: [{ title: "Mercado Pago do cliente — Impulsionando" }] }),
  component: TenantMercadoPagoTab,
  errorComponent: ({ error, reset }) => { const r = useRouter(); return (<div className="p-6 text-sm"><p className="text-destructive mb-2">{error.message}</p><Button size="sm" onClick={()=>{reset();r.invalidate();}}>Tentar novamente</Button></div>); },
});

function TenantMercadoPagoTab() {
  const { slug } = Route.useParams();
  const webhookUrl = `https://impulsionando.com.br/api/public/mercado-pago/${slug}`;

  // Resolve company by slug (client-side, RLS-safe select)
  const companyQ = useQuery({
    queryKey: ["company-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id,name,slug").eq("slug", slug).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error(`Empresa ${slug} não encontrada`);
      return data;
    },
  });

  const companyId = companyQ.data?.id;
  const listFn = useServerFn(getMpagoCredentialsMasked);
  const saveFn = useServerFn(saveMpagoCredentials);

  const credsQ = useQuery({
    queryKey: ["mpago-creds", companyId],
    queryFn: () => listFn({ data: { company_id: companyId! } }),
    enabled: !!companyId,
  });

  const [env, setEnv] = useState<"sandbox" | "production">("production");
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [userIdMp, setUserIdMp] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Sem empresa");
      return saveFn({ data: { company_id: companyId, environment: env, access_token: accessToken, public_key: publicKey, webhook_secret: webhookSecret || null, user_id_mp: userIdMp || null } });
    },
    onSuccess: () => { toast.success("Credenciais salvas com segurança"); setAccessToken(""); setWebhookSecret(""); credsQ.refetch(); },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title={`Mercado Pago — ${companyQ.data?.name ?? slug}`}
        description="Cada cliente usa a sua própria conta Mercado Pago. Access token e webhook secret ficam criptografados no cofre e nunca voltam ao navegador."
        actions={<Button asChild size="sm" variant="outline"><Link to="/admin/clientes/$slug/financeiro" params={{ slug }}>Financeiro <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}
      >
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4"/> Status das credenciais</div>
          {credsQ.isLoading ? <Skeleton className="h-24"/> : credsQ.data?.rows.length ? (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2">Ambiente</th><th>Public key</th><th>Access token</th><th>Webhook</th><th>User MP</th><th>Estado</th><th>Atualizado</th></tr></thead>
              <tbody>{credsQ.data.rows.map(r => (
                <tr key={r.environment} className="border-b last:border-0">
                  <td className="py-2"><Badge variant={r.environment==="production"?"default":"secondary"}>{r.environment}</Badge></td>
                  <td className="font-mono text-xs">{r.public_key_masked ?? "—"}</td>
                  <td>{r.access_token_configured ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/> : <Circle className="h-4 w-4 text-muted-foreground"/>}</td>
                  <td>{r.webhook_configured ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/> : <Circle className="h-4 w-4 text-muted-foreground"/>}</td>
                  <td className="font-mono text-xs">{r.user_id_mp ?? "—"}</td>
                  <td>{r.active ? <Badge>ativo</Badge> : <Badge variant="secondary">inativo</Badge>}</td>
                  <td className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="text-sm text-muted-foreground">Nenhuma credencial cadastrada ainda.</p>}
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4"/> Cadastrar / atualizar</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Ambiente</Label>
              <div className="flex gap-2">
                {(["production","sandbox"] as const).map(e => (
                  <Button key={e} type="button" size="sm" variant={env===e?"default":"outline"} onClick={()=>setEnv(e)}>{e}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label>User ID MP (opcional)</Label><Input value={userIdMp} onChange={e=>setUserIdMp(e.target.value)} placeholder="123456789"/></div>
            <div className="space-y-1 md:col-span-2"><Label>Access Token</Label><Input type="password" autoComplete="off" value={accessToken} onChange={e=>setAccessToken(e.target.value)} placeholder="APP_USR-…"/></div>
            <div className="space-y-1 md:col-span-2"><Label>Public Key</Label><Input value={publicKey} onChange={e=>setPublicKey(e.target.value)} placeholder="APP_USR-…"/></div>
            <div className="space-y-1 md:col-span-2"><Label>Webhook Secret (opcional)</Label><Input type="password" autoComplete="off" value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} placeholder="assinado com HMAC"/></div>
          </div>
          <div className="flex justify-end"><Button size="sm" disabled={!companyId || !accessToken || !publicKey || save.isPending} onClick={()=>save.mutate()}><Save className="h-4 w-4 mr-2"/>{save.isPending?"Salvando…":"Salvar credenciais"}</Button></div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-medium"><Webhook className="h-4 w-4"/> Webhook oficial deste cliente</div>
          <code className="block text-xs break-all rounded-md border bg-muted/40 p-2">{webhookUrl}</code>
          <p className="text-xs text-muted-foreground">Cole no painel Mercado Pago do cliente. A verificação HMAC usa o webhook secret cadastrado acima.</p>
        </Card>

        <Card className="p-5 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground"><Wallet className="h-4 w-4"/> Governança</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access token e webhook secret ficam criptografados em <code>core_secret_values</code> (pgcrypto).</li>
            <li>Somente administradores da própria empresa podem gravar.</li>
            <li>As edge functions do MP leem via <code>reveal_secret_value</code> (service role).</li>
            <li>Toda alteração é auditada em <code>audit_logs</code>.</li>
          </ul>
        </Card>
      </CoreSection>
    </div>
  );
}
