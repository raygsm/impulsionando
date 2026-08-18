import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getCoreWhatsAppPairing,
  startCoreWhatsAppPairing,
} from '@/lib/core/whatsapp-pairing.functions';

export const Route = createFileRoute('/_authenticated/teste/comunicacoes/whatsapp-universal')({
  component: UniversalWhatsAppPairingPage,
  head: () => ({ meta: [{ title: 'Homologação WhatsApp Universal — Impulsionando Core' }] }),
});

function UniversalWhatsAppPairingPage() {
  const statusFn = useServerFn(getCoreWhatsAppPairing);
  const startFn = useServerFn(startCoreWhatsAppPairing);
  const [tenantInput, setTenantInput] = useState('impulsionando');
  const [tenantSlug, setTenantSlug] = useState('impulsionando');
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const normalizedTenant = useMemo(
    () => tenantSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
    [tenantSlug],
  );

  const status = useQuery({
    queryKey: ['core-whatsapp-pairing', normalizedTenant],
    queryFn: () => statusFn({ data: { tenantSlug: normalizedTenant } } as never),
    enabled: Boolean(normalizedTenant),
    refetchInterval: 8000,
    retry: false,
  });

  const pairing = useMutation({
    mutationFn: () => startFn({ data: { tenantSlug: normalizedTenant } } as never),
    onSuccess: (data: any) => {
      setQr(data?.qr || null);
      setPairingCode(data?.pairingCode || null);
      void status.refetch();
    },
  });

  const s: any = status.data;
  const connected = Boolean(s?.connected);
  const blocked = Boolean(s && !s.credentialsConfigured);

  function applyTenant() {
    const next = tenantInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!next) return;
    setQr(null);
    setPairingCode(null);
    setTenantSlug(next);
  }

  async function copyCode() {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold">
        HOMOLOGAÇÃO — Core Universal — produção não alterada
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/comunicacoes"
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Centro de Comunicação
          </Link>
          <h1 className="text-2xl font-bold">WhatsApp por QR Code · Core Universal</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Uma infraestrutura privada compartilhada, com instância, sessão, agente, endpoint e histórico isolados por empresa.
          </p>
        </div>
        <Button variant="outline" onClick={() => void status.refetch()} disabled={status.isFetching}>
          <RefreshCw className={`mr-2 size-4 ${status.isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="text-base">Empresa conectada ao Core</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={tenantInput}
              onChange={(event) => setTenantInput(event.target.value)}
              placeholder="Ex.: impulsionando"
              autoComplete="off"
              className="max-w-md"
            />
            <Button variant="secondary" onClick={applyTenant}>Carregar empresa</Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Esta seleção é apenas de homologação. O servidor sempre valida se o usuário pertence à empresa ou é administrador da Impulsionando antes de consultar ou iniciar o pareamento.
          </p>
        </CardContent>
      </Card>

      {status.isError && (
        <Card className="mb-5 border-destructive/40">
          <CardContent className="flex gap-3 pt-6 text-sm">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" />
            <div>
              <strong>Não foi possível acessar este canal.</strong>
              <p className="mt-1 text-muted-foreground">
                Verifique permissão, cadastro do tenant, agente ativo e endpoint WhatsApp. Nenhuma alteração foi aplicada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Empresa</CardTitle></CardHeader>
          <CardContent><div className="font-semibold">{s?.tenantName || normalizedTenant || '—'}</div><p className="mt-1 text-xs text-muted-foreground">{s?.tenant || '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Agente</CardTitle></CardHeader>
          <CardContent><div className="font-semibold">{s?.agentName || '—'}</div><p className="mt-1 break-all text-xs text-muted-foreground">{s?.agentKey || '—'}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Instância</CardTitle></CardHeader>
          <CardContent><div className="break-all font-mono text-sm">{s?.instance || '—'}</div><p className="mt-1 text-xs text-muted-foreground">Isolada por empresa/agente</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent>
            {connected ? (
              <Badge className="gap-1"><CheckCircle2 className="size-3" /> Conectado</Badge>
            ) : (
              <Badge variant="outline" className="gap-1"><TriangleAlert className="size-3" /> {s?.endpointStatus || 'Aguardando'}</Badge>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Provider: {s?.endpointProvider || 'não vinculado'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><QrCode className="size-5" /> Conectar WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O QR Code é gerado pelo adaptador WhatsApp privado e exibido somente nesta área autenticada. A API key do provedor, o segredo do webhook e as credenciais da OpenAI permanecem exclusivamente no servidor.
            </p>

            <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                <div>
                  <strong>Isolamento obrigatório</strong>
                  <p className="mt-1 text-muted-foreground">
                    Cada empresa recebe sessão própria. O WhatsApp é vinculado ao agente especializado daquela empresa e grava mensagens no ledger omnichannel do respectivo tenant.
                  </p>
                </div>
              </div>
            </div>

            {blocked && (
              <div className="mt-4 rounded-xl border border-amber-500/40 p-4 text-sm">
                <strong>Provedor ainda não disponível no runtime desta homologação.</strong>
                <p className="mt-1 text-muted-foreground">
                  O canal não será marcado como ativo até a Evolution API responder e o pareamento real ser concluído.
                </p>
              </div>
            )}

            {!connected && (
              <Button
                className="mt-5"
                onClick={() => pairing.mutate()}
                disabled={pairing.isPending || blocked || status.isError || !s}
              >
                {pairing.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}
                Conectar WhatsApp
              </Button>
            )}

            {pairing.isError && (
              <p className="mt-3 text-sm text-destructive">
                O pareamento não foi iniciado. O endpoint permaneceu sem ativação.
              </p>
            )}

            {pairingCode && (
              <div className="mt-5 rounded-xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Código alternativo</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="font-mono text-xl font-bold tracking-[0.18em]">{pairingCode}</div>
                  <Button variant="ghost" size="icon" onClick={copyCode} title="Copiar código">
                    {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-80 items-center justify-center rounded-2xl border bg-white p-4">
            {connected ? (
              <div className="text-center text-slate-900">
                <CheckCircle2 className="mx-auto size-14" />
                <strong className="mt-3 block">WhatsApp conectado</strong>
                <p className="mt-1 text-xs text-slate-500">A conexão ainda passa pelo teste E2E antes da promoção para produção.</p>
              </div>
            ) : qr ? (
              <img src={qr} alt={`QR Code para conectar WhatsApp de ${s?.tenantName || normalizedTenant}`} className="max-h-72 max-w-72" />
            ) : (
              <div className="text-center text-slate-500">
                <QrCode className="mx-auto size-16 opacity-30" />
                <p className="mt-3 text-sm">O QR Code temporário aparecerá aqui.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
