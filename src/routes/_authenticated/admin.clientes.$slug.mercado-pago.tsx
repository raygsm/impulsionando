import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, KeyRound, Webhook, ShieldCheck, ArrowRight, CheckCircle2, Circle, Save, AlertTriangle, PlayCircle, History } from "lucide-react";
import { CoreSection } from "@/components/impulsionando";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  saveMpagoCredentials,
  getMpagoCredentialsMasked,
  testMpagoWebhook,
  listMpagoAuditLogs,
} from "@/lib/mpago-credentials.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes/$slug/mercado-pago")({
  head: () => ({ meta: [{ title: "Mercado Pago do cliente — Impulsionando" }] }),
  component: TenantMercadoPagoTab,
  errorComponent: ({ error, reset }) => { const r = useRouter(); return (<div className="p-6 text-sm"><p className="text-destructive mb-2">{error.message}</p><Button size="sm" onClick={()=>{reset();r.invalidate();}}>Tentar novamente</Button></div>); },
});

type TestResult = Awaited<ReturnType<typeof testMpagoWebhook>>;

function TenantMercadoPagoTab() {
  const { slug } = Route.useParams();
  const webhookUrl = `https://impulsionando.com.br/api/public/mercado-pago/${slug}`;

  const companyQ = useQuery({
    queryKey: ["company-by-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,public_slug,subdomain")
        .or(`public_slug.eq.${slug},subdomain.eq.${slug}`)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error(`Empresa ${slug} não encontrada`);
      return data;
    },
  });

  const companyId = companyQ.data?.id;
  const listFn = useServerFn(getMpagoCredentialsMasked);
  const saveFn = useServerFn(saveMpagoCredentials);
  const testFn = useServerFn(testMpagoWebhook);
  const auditFn = useServerFn(listMpagoAuditLogs);

  const credsQ = useQuery({
    queryKey: ["mpago-creds", companyId],
    queryFn: () => listFn({ data: { company_id: companyId! } }),
    enabled: !!companyId,
  });
  const auditQ = useQuery({
    queryKey: ["mpago-audit", companyId],
    queryFn: () => auditFn({ data: { company_id: companyId!, limit: 20 } }),
    enabled: !!companyId,
  });

  const [env, setEnv] = useState<"sandbox" | "production">("production");
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [userIdMp, setUserIdMp] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const prodRow = useMemo(
    () => credsQ.data?.rows.find(r => r.environment === "production") ?? null,
    [credsQ.data],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Sem empresa");
      return saveFn({ data: { company_id: companyId, environment: env, access_token: accessToken, public_key: publicKey, webhook_secret: webhookSecret || null, user_id_mp: userIdMp || null } });
    },
    onSuccess: () => {
      toast.success(env === "production" ? "Credenciais validadas e ativadas" : "Credenciais salvas com segurança");
      setAccessToken(""); setWebhookSecret("");
      credsQ.refetch(); auditQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  const test = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Sem empresa");
      return testFn({ data: { company_id: companyId, environment: "production", webhook_url: webhookUrl } });
    },
    onSuccess: (r) => {
      setTestResult(r);
      if (r.token.ok && r.webhook.reachable) toast.success("Diagnóstico concluído");
      else toast.warning("Diagnóstico concluído com alertas");
      auditQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no diagnóstico"),
  });

  // Bloqueio de produção: só permite salvar se access token informado + public key.
  const isProd = env === "production";
  const disableSave = !companyId || !accessToken || !publicKey || accessToken.length < 20 || save.isPending;

  // Checklist de produção usa a linha atual (post-save) + inputs no formulário.
  const checklist = buildProductionChecklist({ prodRow, formPublicKey: publicKey, formToken: accessToken });

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
      <CoreSection
        title={`Mercado Pago — ${companyQ.data?.name ?? slug}`}
        description="Cada cliente usa a sua própria conta Mercado Pago. Access token e webhook secret ficam criptografados no cofre e nunca voltam ao navegador."
        actions={<Button asChild size="sm" variant="outline"><Link to="/admin/clientes/$slug/financeiro" params={{ slug }}>Financeiro <ArrowRight className="h-3.5 w-3.5" /></Link></Button>}
      >
        {/* Status de produção + checklist */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4"/> Produção — status</div>
          {credsQ.isLoading ? <Skeleton className="h-20"/> : (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <StatusBadge ok={!!prodRow?.public_key_masked} label={`Public key ${prodRow?.public_key_masked ?? "não cadastrada"}`}/>
                <StatusBadge ok={!!prodRow?.access_token_configured} label={prodRow?.access_token_configured ? "Access token presente" : "Access token ausente"}/>
                <StatusBadge ok={!!prodRow?.active} label={prodRow?.active ? "Credencial ativa" : "Credencial inativa"}/>
                <StatusBadge ok={!!prodRow?.webhook_configured} label={prodRow?.webhook_configured ? "Webhook secret cadastrado" : "Webhook secret ausente"} warn/>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {checklist.map(c => (
                  <li key={c.id} className="flex items-start gap-2">
                    {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0"/> : <Circle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0"/>}
                    <span className={c.ok ? "text-muted-foreground" : "text-foreground"}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Tabela original de credenciais */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4"/> Todas as credenciais</div>
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

        {/* Formulário de cadastro */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4"/> Cadastrar / atualizar</div>
          {isProd && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0"/>
              <span>
                Produção só é ativada quando o access token for validado no Mercado Pago.
                Se o token estiver ausente, inválido ou revogado, o salvamento é bloqueado e a credencial permanece como estava.
              </span>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1"><Label>Ambiente</Label>
              <div className="flex gap-2">
                {(["production","sandbox"] as const).map(e => (
                  <Button key={e} type="button" size="sm" variant={env===e?"default":"outline"} onClick={()=>setEnv(e)}>{e}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-1"><Label>User ID MP (opcional)</Label><Input value={userIdMp} onChange={e=>setUserIdMp(e.target.value)} placeholder="123456789"/></div>
            <div className="space-y-1 md:col-span-2"><Label>Access Token {isProd && <span className="text-destructive">*</span>}</Label><Input type="password" autoComplete="off" value={accessToken} onChange={e=>setAccessToken(e.target.value)} placeholder="APP_USR-…"/></div>
            <div className="space-y-1 md:col-span-2"><Label>Public Key</Label><Input value={publicKey} onChange={e=>setPublicKey(e.target.value)} placeholder="APP_USR-…"/></div>
            <div className="space-y-1 md:col-span-2"><Label>Webhook Secret (opcional)</Label><Input type="password" autoComplete="off" value={webhookSecret} onChange={e=>setWebhookSecret(e.target.value)} placeholder="assinado com HMAC"/></div>
          </div>
          <div className="flex justify-end"><Button size="sm" disabled={disableSave} onClick={()=>save.mutate()}><Save className="h-4 w-4 mr-2"/>{save.isPending?(isProd?"Validando no MP…":"Salvando…"):"Salvar credenciais"}</Button></div>
        </Card>

        {/* Webhook + teste */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium"><Webhook className="h-4 w-4"/> Webhook oficial deste cliente</div>
          <code className="block text-xs break-all rounded-md border bg-muted/40 p-2">{webhookUrl}</code>
          <p className="text-xs text-muted-foreground">Cole no painel Mercado Pago do cliente. A verificação HMAC usa o webhook secret cadastrado acima.</p>
          <div className="flex flex-wrap gap-2 items-center pt-1">
            <Button size="sm" variant="outline" disabled={!prodRow?.access_token_configured || test.isPending} onClick={() => test.mutate()}>
              <PlayCircle className="h-4 w-4 mr-2"/>{test.isPending ? "Testando…" : "Enviar evento de teste"}
            </Button>
            {!prodRow?.access_token_configured && (
              <span className="text-xs text-muted-foreground">Salve as credenciais de produção antes de testar.</span>
            )}
          </div>
          {testResult && (
            <div className="mt-2 rounded-md border p-3 text-xs space-y-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge ok={testResult.token.ok} label={testResult.token.ok ? `Token válido (${testResult.token.methods_count} métodos)` : `Token: ${testResult.token.error ?? "falhou"}`}/>
                <StatusBadge ok={testResult.webhook.reachable} label={testResult.webhook.reachable ? `Webhook respondeu HTTP ${testResult.webhook.http_status}` : `Webhook não respondeu: ${testResult.webhook.error ?? "erro"}`}/>
                <StatusBadge ok={testResult.webhook.secret_configured} label={testResult.webhook.secret_configured ? "HMAC assinado" : "Sem HMAC (secret ausente)"} warn/>
              </div>
              {testResult.webhook.body && (
                <pre className="whitespace-pre-wrap break-all text-[11px] text-muted-foreground bg-muted/40 rounded p-2 max-h-40 overflow-auto">{testResult.webhook.body}</pre>
              )}
              <p className="text-[11px] text-muted-foreground">Executado em {new Date(testResult.ts).toLocaleString("pt-BR")}. Uma resposta 2xx significa entrega OK. 401 significa que o handler validou a assinatura corretamente e rejeitou o payload sintético — também é sinal saudável se o secret local for diferente do configurado.</p>
            </div>
          )}
        </Card>

        {/* Trilha de auditoria */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium"><History className="h-4 w-4"/> Trilha de auditoria</div>
          {auditQ.isLoading ? <Skeleton className="h-24"/> : auditQ.data?.rows.length ? (
            <ol className="space-y-2 text-xs">
              {auditQ.data.rows.map(row => (
                <li key={row.id} className="flex items-start gap-2 border-b last:border-0 pb-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${row.severity === "warning" ? "bg-amber-500" : "bg-primary"}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="font-mono text-[10px]">{row.action}</Badge>
                      <span className="text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</span>
                      {row.user_email && <span className="text-muted-foreground">· {row.user_email}</span>}
                      {row.metadata?.environment && <Badge variant={row.metadata.environment === "production" ? "default" : "secondary"} className="text-[10px]">{row.metadata.environment}</Badge>}
                    </div>
                    {Array.isArray(row.metadata?.changed) && row.metadata.changed.length > 0 && (
                      <div className="text-muted-foreground mt-0.5">Campos: <span className="font-mono">{row.metadata.changed.join(", ")}</span></div>
                    )}
                    {row.action === "mpago_credentials.test_webhook" && (
                      <div className="text-muted-foreground mt-0.5">
                        Token {row.metadata?.token_ok ? "OK" : "falhou"} · Webhook HTTP {row.metadata?.webhook_status ?? "—"}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>}
        </Card>

        <Card className="p-5 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground"><Wallet className="h-4 w-4"/> Governança</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access token e webhook secret ficam criptografados em <code>core_secret_values</code> (pgcrypto).</li>
            <li>Somente administradores da própria empresa podem gravar.</li>
            <li>Produção só ativa após validação real no Mercado Pago.</li>
            <li>Toda alteração e teste é auditada em <code>audit_logs</code>.</li>
          </ul>
        </Card>
      </CoreSection>
    </div>
  );
}

function StatusBadge({ ok, label, warn = false }: { ok: boolean; label: string; warn?: boolean }) {
  const cls = ok
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : warn
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-rose-100 text-rose-800 border-rose-200";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
    {ok ? <CheckCircle2 className="h-3 w-3"/> : <Circle className="h-3 w-3"/>}{label}
  </span>;
}

function buildProductionChecklist({ prodRow, formPublicKey, formToken }: {
  prodRow: { public_key_masked: string | null; access_token_configured: boolean; webhook_configured: boolean; active: boolean } | null;
  formPublicKey: string;
  formToken: string;
}) {
  return [
    { id: "public_key", ok: !!prodRow?.public_key_masked || formPublicKey.length > 10, label: "Public Key de produção cadastrada" },
    { id: "access_token", ok: !!prodRow?.access_token_configured, label: "Access Token de produção salvo e criptografado" },
    { id: "validated", ok: !!prodRow?.active, label: "Token validado no Mercado Pago (credencial ativa)" },
    { id: "webhook_url", ok: true, label: "URL de webhook exclusiva desta empresa configurada no painel MP" },
    { id: "webhook_secret", ok: !!prodRow?.webhook_configured, label: "Webhook secret HMAC cadastrado (recomendado)" },
    { id: "diagnostic", ok: !!prodRow?.active, label: "Diagnóstico de webhook executado com sucesso" },
    { id: "form_token_len", ok: formToken.length === 0 || formToken.length >= 20, label: "Nunca cole um token vazio ou truncado" },
  ];
}
