import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { maskCEP, maskCNPJ, maskCPF, maskPhone, isValidCEP, isValidEmail, isValidPhoneBR, lookupCEP } from '@/lib/validators'

export const Route = createFileRoute('/wmp/conversa/$protocol')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === 'string' ? search.token : '' }),
  head: () => ({ meta: [{ title: 'Exportar conversa com o Millito - WMP' }, { name: 'robots', content: 'noindex, nofollow' }] }),
  component: WmpConversationExportPage,
})

type FormState = {
  fullName: string
  email: string
  phone: string
  cpf: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  isCompany: boolean
  companyName: string
  companyDocument: string
}

const initialForm: FormState = {
  fullName: '', email: '', phone: '', cpf: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  isCompany: false, companyName: '', companyDocument: '',
}

function WmpConversationExportPage() {
  const { protocol } = Route.useParams()
  const { token } = Route.useSearch()
  const [form, setForm] = useState<FormState>(initialForm)
  const [loadingState, setLoadingState] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [optionalOpen, setOptionalOpen] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const tokenLooksValid = /^[0-9a-f-]{36}$/i.test(token)
  const requiredReady = useMemo(() => form.fullName.trim().length >= 5 && isValidEmail(form.email) && isValidPhoneBR(form.phone), [form.fullName, form.email, form.phone])

  useEffect(() => {
    if (!tokenLooksValid) { setInvalid(true); setLoadingState(false); return }
    void (async () => {
      const { data, error: stateError } = await supabase.rpc('wmp_get_export_registration_state' as never, { p_protocol: protocol, p_access_token: token } as never)
      if (stateError || !data) { setInvalid(true); setLoadingState(false); return }
      const state = data as unknown as Record<string, any>
      if (state.valid !== true) { setInvalid(true); setLoadingState(false); return }
      if (state.registered) {
        setForm((current) => ({
          ...current,
          fullName: String(state.full_name ?? ''), email: String(state.email ?? ''), phone: maskPhone(String(state.whatsapp ?? '')),
          cpf: maskCPF(String(state.optional?.cpf ?? '')), cep: maskCEP(String(state.optional?.cep ?? '')),
          logradouro: String(state.optional?.logradouro ?? ''), numero: String(state.optional?.numero ?? ''), complemento: String(state.optional?.complemento ?? ''),
          bairro: String(state.optional?.bairro ?? ''), cidade: String(state.optional?.cidade ?? ''), estado: String(state.optional?.estado ?? ''),
          isCompany: state.optional?.is_company === true, companyName: String(state.optional?.company_name ?? ''), companyDocument: maskCNPJ(String(state.optional?.company_document ?? '')),
        }))
        setOptionalOpen(Boolean(state.optional && Object.keys(state.optional).length))
      }
      if (state.export_status === 'SENT') setSent(true)
      setLoadingState(false)
    })()
  }, [protocol, token, tokenLooksValid])

  async function fillCep() {
    if (!isValidCEP(form.cep)) return
    setCepLoading(true)
    const result = await lookupCEP(form.cep)
    setCepLoading(false)
    if (!result) return
    setForm((f) => ({ ...f, cep: maskCEP(result.cep), logradouro: result.logradouro, bairro: result.bairro, cidade: result.cidade, estado: result.uf }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!requiredReady) { setError('Preencha corretamente nome completo, celular e e-mail.'); return }
    setSubmitting(true)
    try {
      const optional = {
        cpf: form.cpf || null,
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        is_company: form.isCompany,
        company_name: form.companyName || null,
        company_document: form.companyDocument || null,
      }
      const { error: registerError } = await supabase.rpc('wmp_register_conversation_export' as never, {
        p_protocol: protocol,
        p_access_token: token,
        p_full_name: form.fullName.trim(),
        p_email: form.email.trim().toLowerCase(),
        p_whatsapp: form.phone,
        p_optional: optional,
      } as never)
      if (registerError) throw registerError

      const { data: delivery, error: deliveryError } = await supabase.functions.invoke('wmp-conversation-export', { body: { protocol, access_token: token } })
      if (deliveryError) throw deliveryError
      if (!delivery?.ok) throw new Error(delivery?.error ?? 'Não foi possível concluir o envio.')
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a conversa. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingState) return <WmpFrame><div className="flex min-h-[52vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#6f3c87]" /></div></WmpFrame>

  if (invalid) return (
    <WmpFrame>
      <Card className="mx-auto max-w-xl border-[#e2d5e8] shadow-sm"><CardContent className="space-y-4 py-10 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-[#6f3c87]" /><h1 className="text-xl font-semibold">Link de atendimento inválido ou expirado</h1><p className="text-sm text-muted-foreground">Volte ao atendimento do Millito e solicite novamente a exportação da conversa.</p><Button asChild><Link to="/wmp/orcamento">Falar com o Millito</Link></Button></CardContent></Card>
    </WmpFrame>
  )

  if (sent) return (
    <WmpFrame>
      <Card className="mx-auto max-w-xl border-[#e2d5e8] shadow-sm"><CardContent className="space-y-5 py-10 text-center"><CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" /><div><h1 className="text-2xl font-semibold">Conversa enviada</h1><p className="mt-2 text-sm text-muted-foreground">A íntegra do atendimento foi enviada ao e-mail cadastrado.</p></div><div className="rounded-xl bg-[#f7f1fa] px-4 py-3 text-sm"><span className="text-muted-foreground">Protocolo</span><div className="mt-1 font-mono font-semibold text-[#4d2760]">{protocol}</div></div><Button asChild variant="outline"><Link to="/wmp/orcamento">Voltar para a WMP</Link></Button></CardContent></Card>
    </WmpFrame>
  )

  return (
    <WmpFrame>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.6fr]">
        <aside className="space-y-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#80539a]">Exportação segura</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Receba sua conversa com o Millito</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Para enviar a conversa e o protocolo por e-mail, precisamos apenas de três dados obrigatórios. Os demais campos são opcionais: quanto mais completo o cadastro, melhor a WMP poderá conhecer e atender você nas próximas interações.</p></div>
          <div className="rounded-2xl border border-[#e2d5e8] bg-white p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[#6f3c87]" /><div><p className="font-semibold">Obrigatório</p><p className="mt-1 text-sm text-muted-foreground">Nome completo, celular e e-mail.</p></div></div><div className="mt-4 flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-[#6f3c87]" /><div><p className="font-semibold">Envio automático</p><p className="mt-1 text-sm text-muted-foreground">Após concluir, a conversa integral será enviada automaticamente para o e-mail informado.</p></div></div></div>
          <div className="rounded-xl bg-[#2a1238] p-4 text-sm text-white"><span className="text-white/60">Protocolo</span><div className="mt-1 break-all font-mono font-semibold text-[#f4cf87]">{protocol}</div></div>
        </aside>

        <Card className="border-[#e2d5e8] shadow-sm">
          <CardHeader><CardTitle>Cadastro para exportação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome completo *" className="md:col-span-2"><Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} autoComplete="name" required /></Field>
                <Field label="Celular / WhatsApp *"><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: maskPhone(e.target.value) }))} inputMode="tel" autoComplete="tel" required /></Field>
                <Field label="E-mail *"><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" autoComplete="email" required /></Field>
              </div>

              <button type="button" onClick={() => setOptionalOpen((v) => !v)} className="flex w-full items-center justify-between rounded-xl border border-[#e2d5e8] bg-[#faf7fb] px-4 py-3 text-left"><div><p className="font-semibold">Completar cadastro opcional</p><p className="mt-0.5 text-xs text-muted-foreground">CPF, endereço e informações da empresa podem ser preenchidos agora ou depois.</p></div><ChevronDown className={`h-5 w-5 transition ${optionalOpen ? 'rotate-180' : ''}`} /></button>

              {optionalOpen && (
                <div className="space-y-4 rounded-2xl border border-[#e2d5e8] p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="CPF"><Input value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: maskCPF(e.target.value) }))} inputMode="numeric" /></Field>
                    <Field label="CEP"><div className="flex gap-2"><Input value={form.cep} onChange={(e) => setForm((f) => ({ ...f, cep: maskCEP(e.target.value) }))} onBlur={fillCep} inputMode="numeric" /><Button type="button" variant="outline" onClick={fillCep} disabled={cepLoading || !isValidCEP(form.cep)}>{cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}</Button></div></Field>
                    <Field label="Endereço" className="md:col-span-2"><Input value={form.logradouro} onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))} /></Field>
                    <Field label="Número"><Input value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} /></Field>
                    <Field label="Complemento"><Input value={form.complemento} onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))} /></Field>
                    <Field label="Bairro"><Input value={form.bairro} onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))} /></Field>
                    <Field label="Cidade"><Input value={form.cidade} onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))} /></Field>
                    <Field label="Estado"><Input value={form.estado} maxLength={2} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value.toUpperCase().slice(0, 2) }))} /></Field>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#faf7fb] p-3"><Checkbox checked={form.isCompany} onCheckedChange={(checked) => setForm((f) => ({ ...f, isCompany: checked === true }))} /><span className="text-sm font-medium">Estou falando em nome de uma empresa</span></label>
                  {form.isCompany && <div className="grid gap-4 md:grid-cols-2"><Field label="Razão social / nome da empresa"><Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} /></Field><Field label="CNPJ"><Input value={form.companyDocument} onChange={(e) => setForm((f) => ({ ...f, companyDocument: maskCNPJ(e.target.value) }))} inputMode="numeric" /></Field></div>}
                </div>
              )}

              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <Button type="submit" className="w-full bg-[#5d2d72] hover:bg-[#4c235e]" disabled={submitting || !requiredReady}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando conversa...</> : 'Concluir cadastro e enviar conversa'}</Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">Ao solicitar o envio, você autoriza a WMP a usar o e-mail informado exclusivamente para esta comunicação e para o relacionamento decorrente deste atendimento, conforme as políticas aplicáveis.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </WmpFrame>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label>{label}</Label>{children}</div>
}

function WmpFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#f7f3fb] text-[#281535]"><header className="border-b border-white/10 bg-[#2a1238]"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6"><Link to="/wmp/orcamento" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9b66f]/50 bg-white/10 font-bold text-[#f4cf87]">W</div><div><p className="font-bold tracking-[0.14em] text-[#f4cf87]">WMP</p><p className="text-xs text-white/65">Wagner Miller Produções</p></div></Link><span className="hidden text-xs font-medium text-white/55 sm:block">Ambiente seguro de atendimento</span></div></header><main className="px-4 py-8 sm:px-6 lg:py-12">{children}</main></div>
}
