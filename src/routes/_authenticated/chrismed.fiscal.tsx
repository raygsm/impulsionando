import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { CheckCircle2, FileText, KeyRound, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type FiscalStatus = {
  legal_name: string;
  cnpj: string;
  municipal_registration: string | null;
  service_code: string | null;
  service_description: string;
  tax_regime: string;
  provider: string;
  environment: 'homologation' | 'production';
  enabled: boolean;
  provider_secret: boolean;
  webhook_secret: boolean;
  provider_token_validated: boolean;
  focus_company_registered: boolean;
  ready: boolean;
  jobs?: { blocked?: number; queued?: number; sent?: number; issued?: number; failed?: number };
};

export const Route = createFileRoute('/_authenticated/chrismed/fiscal')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedFiscal,
  head: () => ({ meta: [{ title: 'Fiscal e NFS-e — Gestão CHRISMED' }] }),
});

function digits(value: string) { return value.replace(/\D/g, ''); }
function maskedCnpj(value: string) {
  const v = digits(value);
  return v.length === 14 ? `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12)}` : value;
}

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão administrativa não encontrada.');
  return token;
}

function ChrismedFiscal() {
  const [status, setStatus] = useState<FiscalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [environment, setEnvironment] = useState<'homologation' | 'production'>('homologation');
  const [focusToken, setFocusToken] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc('chrismed_get_fiscal_admin_status' as never);
    setLoading(false);
    if (error) return toast.error('Não foi possível carregar o status fiscal da CHRISMED.');
    const next = data as unknown as FiscalStatus;
    setStatus(next);
    if (next?.environment) setEnvironment(next.environment);
  }
  useEffect(() => { void load(); }, []);

  async function saveFocus() {
    if (focusToken.trim().length < 16) return toast.error('Informe o token Focus NFe diretamente neste campo seguro.');
    setSaving(true);
    const { error } = await supabase.rpc('chrismed_configure_focus_nfse' as never, {
      p_environment: environment,
      p_api_token: focusToken.trim(),
    } as never);
    setSaving(false);
    if (error) return toast.error('Não foi possível armazenar a credencial Focus NFe.');
    setFocusToken('');
    toast.success('Token armazenado no cofre. A emissão continua bloqueada até a validação externa da credencial.');
    await load();
  }

  async function validateFocus() {
    setValidating(true);
    try {
      const token = await accessToken();
      const response = await fetch('/api/chrismed/fiscal/focus/validate', { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
      const body = await response.json().catch(()=>({})) as { companyRegistered?: boolean; error?: string };
      if (!response.ok) throw new Error(body.error || 'Não foi possível validar a credencial Focus NFe.');
      toast.success(body.companyRegistered ? 'Token válido e CHRISMED localizada no ambiente Focus NFe.' : 'Token válido, mas o CNPJ CHRISMED ainda não está cadastrado/habilitado nesse ambiente Focus NFe.');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível validar a credencial Focus NFe.');
    } finally {
      setValidating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">Gestão fiscal</p>
            <h1 className="mt-1 text-3xl font-bold">NFS-e CHRISMED</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#3F4A47]">Configuração do emissor, readiness da Focus NFe e fila fiscal. Nenhum segredo armazenado no cofre é reexibido nesta tela.</p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
        </header>

        {status && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Emissor" value={status.legal_name} />
              <Metric label="CNPJ" value={maskedCnpj(status.cnpj)} />
              <Metric label="Inscrição municipal" value={status.municipal_registration ?? 'Pendente'} />
              <Metric label="Código do serviço" value={status.service_code ?? 'Pendente'} />
            </section>

            <Card className={status.ready ? 'border-emerald-300 bg-white' : 'border-amber-300 bg-white'}>
              <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Readiness de emissão</CardTitle><Badge className={status.ready ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-amber-50 text-amber-950 border border-amber-300'}>{status.ready ? 'PRONTO' : 'BLOQUEADO'}</Badge></div></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <State label="Inscrição municipal" ok={Boolean(status.municipal_registration)} />
                <State label="Código 04.01.01" ok={Boolean(status.service_code)} />
                <State label="Token Focus no Vault" ok={status.provider_secret} />
                <State label="Token autorizado" ok={status.provider_token_validated} />
                <State label="CHRISMED cadastrada na Focus" ok={status.focus_company_registered} />
              </CardContent>
            </Card>

            <Card className="border-[#D9D3CB] bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Credencial Focus NFe</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><ShieldAlert className="mr-2 inline h-4 w-4" />Salvar o token <strong>não ativa emissão</strong>. A CHRISMED permanece em fail-closed até validar a credencial e confirmar o CNPJ no ambiente Focus.</div>
                <div className="grid gap-4 md:grid-cols-[14rem_1fr_auto] md:items-end">
                  <div><Label htmlFor="focus-env">Ambiente</Label><select id="focus-env" value={environment} onChange={(e)=>setEnvironment(e.target.value as 'homologation'|'production')} className="mt-1 h-10 w-full rounded-md border border-[#D9D3CB] bg-white px-3"><option value="homologation">Homologação</option><option value="production">Produção</option></select></div>
                  <div><Label htmlFor="focus-token">Token API Focus NFe</Label><Input id="focus-token" type="password" autoComplete="new-password" value={focusToken} onChange={(e)=>setFocusToken(e.target.value)} placeholder="Digite diretamente aqui; não envie por chat" /></div>
                  <Button onClick={() => void saveFocus()} disabled={saving || focusToken.trim().length < 16} className="bg-[#071C18] text-white">{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Salvando…</> : 'Salvar no cofre'}</Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D9D3CB] bg-[#FDFCFB] p-4">
                  <p className="max-w-3xl text-xs leading-5 text-[#596660]">A validação é somente leitura: consulta a lista de empresas da Focus usando HTTP Basic e verifica se o CNPJ 42.625.058/0001-70 está cadastrado no ambiente selecionado. Nenhuma nota é emitida.</p>
                  <Button variant="outline" onClick={() => void validateFocus()} disabled={validating || !status.provider_secret}>{validating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Validando…</> : <><ShieldCheck className="mr-2 h-4 w-4"/>Validar token</>}</Button>
                </div>
                <p className="text-xs text-[#596660]">O token é encaminhado à RPC protegida e armazenado no Supabase Vault. A aplicação mantém apenas o nome da referência secreta.</p>
              </CardContent>
            </Card>

            <Card className="border-[#D9D3CB] bg-white"><CardHeader><CardTitle>Fila fiscal</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-5"><Metric label="Bloqueadas" value={String(status.jobs?.blocked ?? 0)} /><Metric label="Na fila" value={String(status.jobs?.queued ?? 0)} /><Metric label="Enviadas" value={String(status.jobs?.sent ?? 0)} /><Metric label="Emitidas" value={String(status.jobs?.issued ?? 0)} /><Metric label="Falhas" value={String(status.jobs?.failed ?? 0)} /></CardContent></Card>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#D9D3CB] bg-white p-4"><div className="text-[10px] uppercase tracking-[0.13em] text-[#596660]">{label}</div><div className="mt-2 break-words font-semibold">{value}</div></div>; }
function State({ label, ok }: { label: string; ok: boolean }) { return <div className={`rounded-xl border p-3 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>{ok ? <CheckCircle2 className="mr-2 inline h-4 w-4"/> : <ShieldAlert className="mr-2 inline h-4 w-4"/>}{label}</div>; }
