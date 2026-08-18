import { createFileRoute, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, QrCode, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImpulsionandoWhatsAppPairing, startImpulsionandoWhatsAppPairing } from '@/lib/impulsionando/whatsapp-pairing.functions';

export const Route = createFileRoute('/_authenticated/teste/comunicacoes/whatsapp')({
  component: ImpulsionandoWhatsAppPairingPage,
  head: () => ({ meta: [{ title: 'Homologação WhatsApp — Impulsionito — Impulsionando' }] }),
});

function ImpulsionandoWhatsAppPairingPage() {
  const statusFn = useServerFn(getImpulsionandoWhatsAppPairing);
  const startFn = useServerFn(startImpulsionandoWhatsAppPairing);
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const status = useQuery({ queryKey: ['impulsionando-whatsapp-pairing'], queryFn: () => statusFn(), refetchInterval: 8000 });
  const pairing = useMutation({ mutationFn: () => startFn(), onSuccess: (data) => { setQr(data.qr || null); setPairingCode(data.pairingCode || null); void status.refetch(); } });
  const s = status.data;
  const connected = Boolean(s?.connected);
  const blocked = s && !s.credentialsConfigured;

  return <div className="container mx-auto max-w-5xl p-6">
    <div className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold">HOMOLOGAÇÃO — não altera produção</div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link to="/admin/comunicacoes" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Centro de Comunicação</Link>
        <h1 className="text-2xl font-bold">WhatsApp · Impulsionando · Impulsionito</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conecte o número oficial ao mesmo cérebro do Impulsionito usado no ecossistema Impulsionando.</p>
      </div>
      <Button variant="outline" onClick={() => void status.refetch()} disabled={status.isFetching}><RefreshCw className={`mr-2 size-4 ${status.isFetching ? 'animate-spin' : ''}`} />Atualizar</Button>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Endpoint</CardTitle></CardHeader><CardContent><Badge variant="outline">{s?.endpointStatus || 'consultando'}</Badge><p className="mt-3 break-all text-xs text-muted-foreground">{s?.endpointAddress || '—'}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Provedor WhatsApp</CardTitle></CardHeader><CardContent><div className="font-semibold">{s?.endpointProvider || '—'}</div><p className="mt-2 text-xs text-muted-foreground">Instância: {s?.instance || 'impulsionito-core'}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conexão</CardTitle></CardHeader><CardContent>{connected ? <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5" />Conectado</div> : <div className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-5" />Aguardando pareamento</div>}<p className="mt-2 text-xs text-muted-foreground">Estado: {s?.providerState || 'não informado'}</p></CardContent></Card>
    </div>
    <Card className="mt-5">
      <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="size-5" />Conectar WhatsApp por QR Code</CardTitle></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">O QR Code é solicitado pelo servidor e aparece apenas nesta área administrativa autenticada. Credenciais do provedor e da OpenAI nunca são enviadas ao navegador.</p>
          <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><div><strong>Um cérebro, vários canais</strong><p className="mt-1 text-muted-foreground">O WhatsApp será um canal do Impulsionito. O histórico entra no ledger omnichannel como WhatsApp e não cria um segundo agente.</p></div></div></div>
          {blocked && <div className="mt-4 rounded-xl border p-4 text-sm"><strong>Adaptador WhatsApp ainda sem credencial operacional.</strong><p className="mt-1 text-muted-foreground">A OpenAI do Impulsionito é independente e permanece a mesma. Falta apenas a credencial/URL do provedor de sessão WhatsApp para gerar o QR real.</p></div>}
          {!connected && <Button className="mt-5" onClick={() => pairing.mutate()} disabled={pairing.isPending || Boolean(blocked)}>{pairing.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}Conectar WhatsApp</Button>}
          {pairing.isError && <p className="mt-3 text-sm text-destructive">Não foi possível iniciar o pareamento. O canal não foi marcado como ativo.</p>}
          {pairingCode && <div className="mt-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Código alternativo</div><div className="mt-1 font-mono text-xl font-bold tracking-[0.2em]">{pairingCode}</div></div>}
        </div>
        <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-white p-4">
          {connected ? <div className="text-center"><CheckCircle2 className="mx-auto size-14" /><strong className="mt-3 block">WhatsApp conectado</strong><p className="mt-1 text-xs text-muted-foreground">A ativação final exige webhook e teste E2E.</p></div> : qr ? <img src={qr} alt="QR Code para conectar WhatsApp da Impulsionando" className="max-h-64 max-w-64" /> : <div className="text-center text-muted-foreground"><QrCode className="mx-auto size-16 opacity-30" /><p className="mt-3 text-sm">O QR Code aparecerá aqui.</p></div>}
        </div>
      </CardContent>
    </Card>
  </div>;
}
