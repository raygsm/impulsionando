import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope, Video, Home, RefreshCw, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

type Offering = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  modality: 'presencial' | 'telemedicina' | 'domiciliar' | 'retorno';
  price_cents: number;
  duration_minutes: number;
  requires_prepayment: boolean;
};

const MODALITY_META: Record<Offering['modality'], { icon: typeof Stethoscope; label: string }> = {
  presencial: { icon: Stethoscope, label: 'Atendimento no consultório' },
  telemedicina: { icon: Video, label: 'Atendimento por vídeo' },
  domiciliar: { icon: Home, label: 'Médico onde você estiver' },
  retorno: { icon: RefreshCw, label: 'Retorno acompanhado' },
};

export const Route = createFileRoute('/chrismed')({
  head: () => ({
    meta: [
      { title: 'CHRISMED — Central Médica Premium · agende em minutos' },
      { name: 'description', content: 'Atendimento médico premium: presencial, por vídeo ou na sua residência, hotel ou empresa. Confirmação imediata via PIX, prontuário eletrônico e equipe à disposição.' },
      { property: 'og:title', content: 'CHRISMED — Sua saúde com agilidade, sigilo e excelência' },
      { property: 'og:description', content: 'Escolha o melhor horário e confirme seu atendimento em poucos minutos. Presencial, vídeo e domiciliar.' },
      { property: 'og:type', content: 'website' },
    ],
  }),
  component: ChrismedPage,
  errorComponent: ({ error, reset }) => (
    <div className="container py-12 text-center">
      <h1 className="text-2xl font-semibold mb-2">Ops, algo deu errado</h1>
      <p className="text-muted-foreground mb-4">{String(error)}</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  ),
  notFoundComponent: () => <div className="container py-12">Página não encontrada.</div>,
});

function ChrismedPage() {
  const router = useRouter();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Offering | null>(null);
  const [payer, setPayer] = useState({ first_name: '', last_name: '', email: '', doc: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pixResult, setPixResult] = useState<{ qr_code: string; qr_code_base64: string; payment_id: string } | null>(null);
  const [pollStatus, setPollStatus] = useState<string>('pending');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('chrismed_service_offerings')
        .select('id,slug,name,description,modality,price_cents,duration_minutes,requires_prepayment')
        .eq('company_id', CHRISMED_COMPANY_ID)
        .eq('active', true)
        .order('display_order');
      if (error) toast.error('Erro ao carregar serviços');
      else setOfferings((data ?? []) as Offering[]);
      setLoading(false);
    })();
  }, []);

  // Polling do status do pagamento PIX
  useEffect(() => {
    if (!pixResult || pollStatus === 'approved') return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('mpago_payments')
        .select('status')
        .eq('id', pixResult.payment_id)
        .maybeSingle();
      if (data?.status) {
        setPollStatus(data.status);
        if (data.status === 'approved') {
          clearInterval(interval);
          toast.success('Pagamento confirmado! Você receberá os detalhes por e-mail.');
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixResult, pollStatus]);

  async function handlePay() {
    if (!selected) return;
    if (!payer.email || !payer.first_name) {
      toast.error('Preencha pelo menos nome e e-mail.');
      return;
    }
    if (selected.price_cents === 0) {
      toast.success('Retorno agendado sem cobrança. Entraremos em contato para confirmar.');
      setSelected(null);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mpago-create-payment', {
        body: {
          company_id: CHRISMED_COMPANY_ID,
          payment_method: 'pix',
          amount_cents: selected.price_cents,
          description: `CHRISMED — ${selected.name}`,
          payer: {
            email: payer.email,
            first_name: payer.first_name,
            last_name: payer.last_name || undefined,
            identification: payer.doc ? { type: 'CPF', number: payer.doc.replace(/\D/g, '') } : undefined,
          },
          context_type: 'chrismed_service_offering',
          context_id: selected.id,
          metadata: { offering_slug: selected.slug, modality: selected.modality },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPixResult({
        qr_code: data.mp.qr_code,
        qr_code_base64: data.mp.qr_code_base64,
        payment_id: data.payment.id,
      });
    } catch (e) {
      toast.error(`Erro ao gerar PIX: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-white">
      {/* Top bar */}
      <header className="border-b bg-white/85 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-sm">C</div>
            <div>
              <div className="font-semibold tracking-tight text-slate-900">CHRISMED</div>
              <div className="text-[11px] uppercase tracking-wider text-teal-700/80 -mt-0.5">Central Médica Premium</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <a href="/chrismed" className="px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 rounded-md">Agendar</a>
            <a href="/chrismed/ofertas" className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-md">Modalidades</a>
          </nav>
        </div>
      </header>

      <main className="container py-12 max-w-5xl">
        {!pixResult && !selected && (
          <>
            <div className="text-center mb-12">
              <Badge variant="outline" className="border-teal-200 text-teal-700 mb-4 bg-teal-50/60">Atendimento concierge · presencial, vídeo e domiciliar</Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-[1.1]">
                Cuidado médico <span className="text-teal-600">sem fila, sem espera</span>,<br className="hidden md:block" /> com a privacidade que você merece.
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Escolha a modalidade, confirme em minutos e tenha seu atendimento garantido.
                Prontuário eletrônico, prescrição digital e equipe disponível antes, durante e após a consulta.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-teal-600" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {offerings.map((o) => {
                  const Icon = MODALITY_META[o.modality].icon;
                  return (
                    <Card key={o.id} className="border-teal-100/80 hover:border-teal-400 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group bg-white" onClick={() => setSelected(o)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <Icon className="h-6 w-6" />
                          </div>
                          <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">{MODALITY_META[o.modality].label}</Badge>
                        </div>
                        <CardTitle className="mt-3 text-xl">{o.name}</CardTitle>
                        <CardDescription className="text-slate-600">{o.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-bold text-slate-900">
                            {o.price_cents === 0 ? 'Cortesia' : `R$ ${(o.price_cents / 100).toFixed(2).replace('.', ',')}`}
                          </div>
                          <div className="text-xs text-muted-foreground">Duração estimada: {o.duration_minutes} min</div>
                        </div>
                        <Button className="bg-teal-600 hover:bg-teal-700 shadow-sm">Reservar horário</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Trust signals */}
            <div className="grid sm:grid-cols-3 gap-4 mt-14 pt-10 border-t border-teal-100">
              {[
                { t: 'Confirmação imediata', d: 'Pagou, está confirmado. Horário reservado e bloqueado em sua agenda.' },
                { t: 'Sigilo absoluto', d: 'Prontuário eletrônico criptografado. Conformidade total com a LGPD.' },
                { t: 'Equipe à disposição', d: 'WhatsApp dedicado para dúvidas antes e suporte clínico após o atendimento.' },
              ].map((b) => (
                <div key={b.t} className="text-center sm:text-left">
                  <div className="font-semibold text-slate-900 mb-1">{b.t}</div>
                  <div className="text-sm text-slate-600">{b.d}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Form */}
        {selected && !pixResult && (
          <Card className="max-w-xl mx-auto border-teal-100">
            <CardHeader>
              <button onClick={() => setSelected(null)} className="text-sm text-teal-700 hover:underline self-start mb-2">← Trocar modalidade</button>
              <CardTitle>{selected.name}</CardTitle>
              <CardDescription>
                {selected.price_cents === 0
                  ? 'Sem custo — confirme seus dados e reservamos seu horário.'
                  : `Investimento de R$ ${(selected.price_cents / 100).toFixed(2).replace('.', ',')} · pagamento via PIX com confirmação imediata`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fn">Nome*</Label>
                  <Input id="fn" value={payer.first_name} onChange={(e) => setPayer({ ...payer, first_name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="ln">Sobrenome</Label>
                  <Input id="ln" value={payer.last_name} onChange={(e) => setPayer({ ...payer, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="em">E-mail*</Label>
                <Input id="em" type="email" value={payer.email} onChange={(e) => setPayer({ ...payer, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="doc">CPF</Label>
                <Input id="doc" value={payer.doc} onChange={(e) => setPayer({ ...payer, doc: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <Button onClick={handlePay} disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700">
                {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {selected.price_cents === 0 ? 'Confirmar reserva' : 'Reservar e pagar via PIX'}
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Seu horário só é bloqueado após a confirmação do pagamento. Reembolso integral para cancelamentos com mais de 24h.
              </p>
            </CardContent>
          </Card>
        )}

        {/* PIX result */}
        {pixResult && (
          <Card className="max-w-xl mx-auto border-teal-100">
            <CardHeader className="text-center">
              {pollStatus === 'approved' ? (
                <>
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <CardTitle>Atendimento confirmado</CardTitle>
                  <CardDescription>Seu horário está bloqueado em nossa agenda. Enviamos os detalhes e orientações para o seu e-mail e WhatsApp.</CardDescription>
                </>
              ) : (
                <>
                  <CardTitle>Reserve seu horário em segundos</CardTitle>
                  <CardDescription>
                    Aponte a câmera para o QR Code ou use o código copia-e-cola. Confirmaremos automaticamente após o pagamento.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            {pollStatus !== 'approved' && (
              <CardContent className="space-y-4">
                {pixResult.qr_code_base64 ? (
                  <img src={`data:image/png;base64,${pixResult.qr_code_base64}`} alt="QR Code PIX" className="mx-auto rounded-lg border bg-white p-3" width={256} height={256} />
                ) : null}
                {pixResult.qr_code ? (
                  <div className="space-y-1">
                    <Label>Código PIX copia-e-cola</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={pixResult.qr_code} className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(pixResult.qr_code); toast.success('Copiado!'); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
                <Button variant="outline" className="w-full" onClick={() => { setPixResult(null); setSelected(null); setPollStatus('pending'); router.invalidate(); }}>
                  Cancelar e voltar
                </Button>
              </CardContent>
            )}
            {pollStatus === 'approved' && (
              <CardContent>
                <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => { setPixResult(null); setSelected(null); setPollStatus('pending'); }}>
                  Agendar outra consulta
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </main>

      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          CHRISMED · Clínica Médica · Atendimento ético e humanizado
          <div className="mt-1">Powered by <span className="font-semibold text-teal-700">Impulsionando</span></div>
        </div>
      </footer>
    </div>
  );
}
