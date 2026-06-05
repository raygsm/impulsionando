import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type State =
  | { kind: 'loading' }
  | { kind: 'valid' }
  | { kind: 'already' }
  | { kind: 'invalid'; message?: string }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token')
    : null;

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', message: 'Link inválido — token ausente.' });
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setState({ kind: 'invalid', message: data?.error ?? 'Link inválido ou expirado.' });
          return;
        }
        if (data?.valid === false && data?.reason === 'already_unsubscribed') {
          setState({ kind: 'already' });
          return;
        }
        if (data?.valid) {
          setState({ kind: 'valid' });
          return;
        }
        setState({ kind: 'invalid' });
      })
      .catch(() => setState({ kind: 'invalid', message: 'Falha ao validar o link.' }));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: 'submitting' });
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState({ kind: 'error', message: data?.error ?? 'Erro ao processar.' });
        return;
      }
      if (data?.success || data?.reason === 'already_unsubscribed') {
        setState({ kind: 'success' });
        return;
      }
      setState({ kind: 'error', message: 'Não foi possível concluir.' });
    } catch {
      setState({ kind: 'error', message: 'Erro de conexão.' });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cancelar inscrição</CardTitle>
          <CardDescription>Impulsionando — notificações por e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.kind === 'loading' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando link...
            </div>
          )}
          {state.kind === 'valid' && (
            <>
              <p className="text-sm">
                Confirme abaixo para não receber mais e-mails deste tipo.
              </p>
              <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
            </>
          )}
          {state.kind === 'submitting' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processando...
            </div>
          )}
          {state.kind === 'success' && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <p>Inscrição cancelada com sucesso. Você não receberá mais esses e-mails.</p>
            </div>
          )}
          {state.kind === 'already' && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <p>Você já havia cancelado a inscrição anteriormente.</p>
            </div>
          )}
          {(state.kind === 'invalid' || state.kind === 'error') && (
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p>{state.message ?? 'Link inválido ou expirado.'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
});
