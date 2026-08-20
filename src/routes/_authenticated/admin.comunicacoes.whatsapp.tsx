import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, QrCode, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImpulsionandoWhatsAppPairing, startImpulsionandoWhatsAppPairing } from '@/lib/impulsionando/whatsapp-pairing.functions';

export const Route = createFileRoute('/_authenticated/admin/comunicacoes/whatsapp')({
  component: WhatsAppPairingPage,
  head: () => ({ meta: [{ title: 'WhatsApp — Centro de Comunicação — Impulsionando' }] }),
});

function WhatsAppPairingPage() {
  const statusFn = useServerFn(getImpulsionandoWhatsAppPairing);
  const startFn = useServerFn(startImpulsionandoWhatsAppPairing);
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ['impulsionando-whatsapp-pairing'],
    queryFn: () => statusFn(),
    refetchInterval: 8000,
  });

  const pairing = useMutation({
    mutationFn: () => startFn(),
    onSuccess: (data) => {
      if (!data.ok && data.blocked) return;
      setQr(data.qr || null);
      setPairingCode(data.pairingCode || null);
      void status.refetch();
    },
  });

  const s = status.data;
  const connected = Boolean(s?.connected);
  const blocked = Boolean(s && !s.credentialsConfigured);
  const responseBlocked = Boolean(pairing.data && !pairing.data.ok && pairing.data.blocked);

  return <div className="container mx-auto max-w-5xl p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link to="/admin/comunicacoes" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Centro de Comunicação</Link>
        <h1 className="text-2xl font-bold">WhatsApp · Impulsionando · Impulsionito</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pareamento seguro do WhatsApp oficial da Impulsionando com o Impulsionito Core.</p>
      </div>
      <Button variant="outline" onClick={() => void status.refetch()} disabled={status.isFetching}><RefreshCw className={`mr-2 size-4 ${status.isFetching ? 'animate-spin' : ''}`} />Atualizar</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Endpoint</CardTitle></CardHeader><CardContent><Badge variant="outline">{s?.endpointStatus || 'consultando'}</Badge><p className="mt-3 break-all text-xs text-muted-foreground">{s?.endpointAddress || '—'}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Provedor</CardTitle></CardHeader><CardContent><div className="font-semibold">{s?.endpointProvider || '—'}</div><p className="mt-2 text-xs text-muted-foreground">Instância: {s?.instance || 'impulsionando-impulsionito'}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conexão</CardTitle></CardHeader><CardContent>{connected ? <div className="flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 className="size-5" />Conectado</div> : <div className="flex items-center gap-2 font-semibold text-amber-700"><TriangleAlert className="size-5" />Aguardando pareamento</div>}<p className="mt-2 text-xs text-muted-foreground">Estado do provedor: {s?.providerState || 'não informado'}</p></CardContent></Card>
    </div>

    <Card className="mt-5">
      <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="size-5" />Conectar WhatsApp oficial</CardTitle></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">O QR Code é solicitado ao provedor somente pelo servidor e exibido apenas nesta área autenticada. Tokens, chaves e segredos nunca são enviados para o navegador.</p>
          <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><div><strong>Instância isolada do Core</strong><p className="mt-1 text-muted-foreground">A Impulsionando usa a sessão <code>impulsionando-impulsionito</code>, separada de qualquer cliente e ligada ao endpoint oficial do Impulsionito.</p></div></div>
          </div>
          {(blocked || responseBlocked) && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Credenciais do provedor ainda não instaladas no servidor.</strong><p className="mt-1">Configure <code>IMPULSIONANDO_EVOLUTION_BASE_URL</code> e <code>IMPULSIONANDO_EVOLUTION_API_KEY</code>. O canal continuará como PENDING_CONNECTION até uma sessão real ser pareada.</p></div>}
          {!connected && <Button className="mt-5" onClick={() => pairing.mutate()} disabled={pairing.isPending || blocked}>{pairing.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}Gerar QR Code</Button>}
          {pairing.isError && <p className="mt-3 text-sm text-destructive">Não foi possível iniciar o pareamento. Nenhum canal foi marcado como ativo.</p>}
          {pairingCode && <div className="mt-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Código alternativo</div><div className="mt-1 font-mono text-xl font-bold tracking-[0.2em]">{pairingCode}</div></div>}
        </div>
        <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-white p-4">
          {connected ? <div className="text-center"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><strong className="mt-3 block">WhatsApp conectado</strong><p className="mt-1 text-xs text-muted-foreground">O Impulsionito está pareado ao endpoint oficial da Impulsionando.</p></div> : qr ? <img src={qr} alt="QR Code para parear o WhatsApp da Impulsionando" className="max-h-64 max-w-64" /> : <div className="text-center text-muted-foreground"><QrCode className="mx-auto size-16 opacity-30" /><p className="mt-3 text-sm">O QR aparecerá aqui.</p></div>}
        </div>
      </CardContent>
    </Card>
  </div>;
}
