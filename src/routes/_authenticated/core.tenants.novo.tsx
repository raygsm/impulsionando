import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import { listProvisionOptions, provisionTenant } from '@/lib/tenant-provisioning.functions'
import { PageHeader } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, ChevronRight, Building2, CreditCard, Palette, UserPlus } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/core/tenants/novo')({
  head: () => ({ meta: [{ title: 'Novo Tenant — Impulsionando' }] }),
  component: Page,
})

type Step = 0 | 1 | 2 | 3

interface FormState {
  name: string; legal_name: string; document: string; email: string; whatsapp: string;
  subdomain: string; niche_id: string;
  country_code: 'BR' | 'BO';
  plan_id: string;
  primary_color: string; secondary_color: string; logo_url: string;
  admin_email: string; admin_name: string;
}


const STEPS = [
  { id: 0, label: 'Empresa', icon: Building2 },
  { id: 1, label: 'Plano', icon: CreditCard },
  { id: 2, label: 'Branding', icon: Palette },
  { id: 3, label: 'Admin inicial', icon: UserPlus },
] as const

function Page() {
  const navigate = useNavigate()
  const optsFn = useServerFn(listProvisionOptions)
  const provFn = useServerFn(provisionTenant)
  const { data: opts } = useQuery({ queryKey: ['tenant-opts'], queryFn: () => optsFn() })

  const [step, setStep] = useState<Step>(0)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '', legal_name: '', document: '', email: '', whatsapp: '',
    subdomain: '', niche_id: '',
    plan_id: '',
    primary_color: '#0ea5e9', secondary_color: '#6366f1', logo_url: '',
    admin_email: '', admin_name: '',
  })

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const canNext = useMemo(() => {
    if (step === 0) return form.name.trim().length >= 2
    if (step === 3) return /\S+@\S+\.\S+/.test(form.admin_email) && form.admin_name.trim().length >= 2
    return true
  }, [step, form])

  async function submit() {
    setSubmitting(true)
    try {
      const res = await provFn({ data: {
        empresa: {
          name: form.name,
          legal_name: form.legal_name || undefined,
          document: form.document || undefined,
          email: form.email || undefined,
          whatsapp: form.whatsapp || undefined,
          subdomain: form.subdomain || undefined,
          niche_id: form.niche_id || undefined,
        },
        plano: form.plan_id ? { plan_id: form.plan_id } : undefined,
        branding: {
          primary_color: form.primary_color || undefined,
          secondary_color: form.secondary_color || undefined,
          logo_url: form.logo_url || undefined,
        },
        admin: { email: form.admin_email, display_name: form.admin_name },
      } })
      toast.success(`Tenant "${res.companyName}" provisionado.${res.inviteSent ? ' Convite enviado ao admin.' : ''}`)
      navigate({ to: '/companies' })
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao provisionar tenant.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Novo Tenant"
        description="Provisione uma nova empresa dentro do core Impulsionando."
      />

      <ol className="flex items-center gap-2 text-sm overflow-x-auto pb-1">
        {STEPS.map((s) => {
          const done = step > s.id
          const active = step === s.id
          const Icon = s.icon
          return (
            <li key={s.id} className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : done
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="font-medium">{s.label}</span>
              </div>
              {s.id < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </li>
          )
        })}
      </ol>

      <Card className="p-6 space-y-4">
        {step === 0 && (
          <>
            <Field label="Nome fantasia *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Razão social"><Input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} /></Field>
              <Field label="CNPJ / CPF"><Input value={form.document} onChange={(e) => set('document', e.target.value)} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
              <Field label="Subdomínio (opcional)" hint="apenas letras minúsculas, números e hífen">
                <Input value={form.subdomain} onChange={(e) => set('subdomain', e.target.value.toLowerCase())} placeholder="meu-bar" />
              </Field>
              <Field label="Nicho">
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.niche_id}
                  onChange={(e) => set('niche_id', e.target.value)}
                >
                  <option value="">— Selecione —</option>
                  {opts?.niches.map((n: any) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </Field>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Escolha o plano inicial. O tenant pode evoluir depois via /minha-assinatura.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <PlanOption selected={form.plan_id === ''} onClick={() => set('plan_id', '')}
                title="Sem plano (trial)" hint="Tenant inicia com período de avaliação." />
              {opts?.plans.map((p: any) => (
                <PlanOption key={p.id} selected={form.plan_id === p.id} onClick={() => set('plan_id', p.id)}
                  title={p.name}
                  hint={`${(Number(p.recurring_amount) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / ${p.cycle}`} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cor primária">
                <div className="flex gap-2">
                  <input type="color" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} className="w-12 h-10 rounded border border-input" />
                  <Input value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} />
                </div>
              </Field>
              <Field label="Cor secundária">
                <div className="flex gap-2">
                  <input type="color" value={form.secondary_color} onChange={(e) => set('secondary_color', e.target.value)} className="w-12 h-10 rounded border border-input" />
                  <Input value={form.secondary_color} onChange={(e) => set('secondary_color', e.target.value)} />
                </div>
              </Field>
            </div>
            <Field label="URL do logo (opcional)">
              <Input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://..." />
            </Field>
            <div
              className="p-4 rounded-md border border-border text-sm"
              style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.secondary_color})`, color: 'white' }}
            >
              Pré-visualização da identidade do tenant.
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-muted-foreground">
              O administrador inicial receberá um convite por e-mail para ativar o acesso. Se já existir no ecossistema, será vinculado direto.
            </p>
            <Field label="Nome do administrador *"><Input value={form.admin_name} onChange={(e) => set('admin_name', e.target.value)} /></Field>
            <Field label="E-mail do administrador *"><Input type="email" value={form.admin_email} onChange={(e) => set('admin_email', e.target.value)} /></Field>
          </>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1) as Step)} disabled={step === 0 || submitting}>
            Voltar
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => Math.min(3, s + 1) as Step)} disabled={!canNext}>
              Avançar
            </Button>
          ) : (
            <Button onClick={submit} disabled={!canNext || submitting}>
              {submitting ? 'Provisionando…' : 'Provisionar tenant'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function PlanOption({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-lg border transition-all ${
        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </button>
  )
}
