import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, QrCode, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { getChrismedWhatsAppPairing, startChrismedWhatsAppPairing } from '@/lib/chrismed/whatsapp-pairing.functions';

export const Route = createFileRoute('/_authenticated/chrismed/whatsapp')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedWhatsAppPairingPage,
  head: () => ({ meta: [{ title: 'WhatsApp — CHRISMED' }] }),
});

function ChrismedWhatsAppPairingPage() {
  const statusFn = useServerFn(getChrismedWhatsAppPairing);
  const startFn = useServerFn(startChrismedWhatsAppPairing);
  const [qr, setQr] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ['chrismed-whatsapp-pairing'],
    queryFn: () => statusFn(),
    refetchInterval: 8000,
  });

  const pairing = useMutation({
    mutationFn: () => startFn(),
    onSuccess: (data) => {
      setQr(data.qr || null);
      setPairingCode(data.pairingCode || null);
      void status.refetch();
    },
  });

  const s = status.data;
  const connected = Boolean(s?.connected);
  const blocked = s && !s.credentialsConfigured;

  return <div className="container mx-auto max-w-5xl p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-primary">CHRISMED · Centro de Comunicação</p>
        <h1 className="text-2xl font-bold">WhatsApp da CHRISMED</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pareamento seguro do número oficial com a instância especializada da CHRISMED.</p>
      </div>
      <Button variant="outline" onClick={() => void status.refetch()} disabled={status.isFetching}><RefreshCw className={`mr-2 size-4 ${status.isFetching ? 'animate-spin' : ''}`} />Atualizar</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Número</CardTitle></CardHeader><CardContent><div className="font-semibold">{s?.endpointAddress || '+55 21 97253-7868'}</div><p className="mt-2 text-xs text-muted-foreground">Canal principal da CHRISMED</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Instância</CardTitle></CardHeader><CardContent><div className="font-semibold">{s?.instance || 'chrismed-oliver'}</div><p className="mt-2 text-xs text-muted-foreground">Isolada por cliente</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Conexão</CardTitle></CardHeader><CardContent>{connected ? <div className="flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 className="size-5" />Conectado</div> : <div className="flex items-center gap-2 font-semibold text-amber-700"><TriangleAlert className="size-5" />Aguardando pareamento</div>}<p className="mt-2 text-xs text-muted-foreground">Estado: {s?.providerState || s?.endpointStatus || 'não informado'}</p></CardContent></Card>
    </div>

    <Card className="mt-5">
      <CardHeader><CardTitle className="flex items-center gap-2"><QrCode className="size-5" />Conectar por QR Code</CardTitle></CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">O QR Code é gerado no servidor e exibido apenas nesta área autenticada. A credencial do provedor nunca aparece no navegador.</p>
          <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><div><strong>Segurança por tenant</strong><p className="mt-1 text-muted-foreground">A CHRISMED usa sessão e credenciais próprias. Nenhum token de outro cliente é reutilizado.</p></div></div></div>
          {blocked && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Infraestrutura preparada; credenciais do provedor ainda ausentes.</strong><p className="mt-1">Instalar CHRISMED_EVOLUTION_BASE_URL e CHRISMED_EVOLUTION_API_KEY no servidor para liberar a geração real do QR Code.</p></div>}
          {!connected && <Button className="mt-5" onClick={() => pairing.mutate()} disabled={pairing.isPending || Boolean(blocked)}>{pairing.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}Gerar QR Code</Button>}
          {pairing.isError && <p className="mt-3 text-sm text-destructive">Falha ao iniciar o pareamento. O canal não foi marcado como conectado.</p>}
          {pairingCode && <div className="mt-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">Código alternativo</div><div className="mt-1 font-mono text-xl font-bold tracking-[0.2em]">{pairingCode}</div></div>}
        </div>
        <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-white p-4">
          {connected ? <div className="text-center"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><strong className="mt-3 block">WhatsApp conectado</strong><p className="mt-1 text-xs text-muted-foreground">Pronto para validar webhook e teste E2E.</p></div> : qr ? <img src={qr} alt="QR Code para parear WhatsApp CHRISMED" className="max-h-64 max-w-64" /> : <div className="text-center text-muted-foreground"><QrCode className="mx-auto size-16 opacity-30" /><p className="mt-3 text-sm">O QR aparecerá aqui.</p></div>}
        </div>
      </CardContent>
    </Card>
  </div>;
}
