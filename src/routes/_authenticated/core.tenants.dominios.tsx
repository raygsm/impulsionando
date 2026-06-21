import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { listTenantOnboarding, resendTenantAdminInvite, updateTenantSubdomain } from '@/lib/tenant-provisioning.functions'
import { PageHeader } from '@/components/app/PageElements'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Globe, Mail, RefreshCw, Save } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/core/tenants/dominios')({
  head: () => ({ meta: [{ title: 'Domínios & Convites de Tenants — Impulsionando' }] }),
  component: Page,
})

function Page() {
  const qc = useQueryClient()
  const listFn = useServerFn(listTenantOnboarding)
  const resendFn = useServerFn(resendTenantAdminInvite)
  const updFn = useServerFn(updateTenantSubdomain)
  const { data, isLoading } = useQuery({ queryKey: ['tenant-onboarding'], queryFn: () => listFn() })
  const [edits, setEdits] = useState<Record<string, string>>({})

  async function onResend(companyId: string, email: string) {
    try {
      await resendFn({ data: { companyId, email } })
      toast.success(`Convite reenviado para ${email}`)
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao reenviar') }
  }
  async function onSaveSub(companyId: string) {
    const value = (edits[companyId] ?? '').trim().toLowerCase()
    if (!/^[a-z0-9-]{3,40}$/.test(value)) { toast.error('Subdomínio inválido (3–40, a-z0-9-)'); return }
    try {
      await updFn({ data: { companyId, subdomain: value } })
      toast.success(`Subdomínio atualizado para ${value}`)
      await qc.invalidateQueries({ queryKey: ['tenant-onboarding'] })
    } catch (e: any) { toast.error(e?.message ?? 'Falha ao atualizar') }
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <PageHeader title="Domínios & Convites" description="Gerencie subdomínios whitelabel e reenvie convites de admin dos tenants do ecossistema." />
      {isLoading ? (
        <Card className="p-8 text-sm text-muted-foreground">Carregando tenants…</Card>
      ) : (
        <div className="grid gap-3">
          {(data?.tenants ?? []).map((t: any) => (
            <Card key={t.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.email ?? '—'}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={t.is_active ? 'default' : 'secondary'}>{t.status ?? '—'}</Badge>
                  {t.domain && <Badge variant="outline">domínio: {t.domain.status}</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[240px]">
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Subdomínio whitelabel</label>
                  <Input
                    placeholder="ex.: cliente-x"
                    defaultValue={t.subdomain ?? ''}
                    onChange={(e) => setEdits((s) => ({ ...s, [t.id]: e.target.value }))}
                  />
                </div>
                <Button size="sm" onClick={() => onSaveSub(t.id)}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Admins</div>
                {t.admins.length === 0 && <div className="text-xs text-muted-foreground">Nenhum admin vinculado.</div>}
                {t.admins.map((a: any) => (
                  <div key={a.user_id} className="flex items-center justify-between gap-2 text-sm border rounded px-2 py-1">
                    <span>{a.display_name ?? a.email} <span className="text-xs text-muted-foreground">({a.email})</span></span>
                    <Button size="sm" variant="ghost" onClick={() => onResend(t.id, a.email)}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Reenviar convite
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          {(data?.tenants ?? []).length === 0 && (
            <Card className="p-8 text-sm text-muted-foreground">Nenhum tenant provisionado ainda. Crie um em <a className="underline" href="/core/tenants/novo">/core/tenants/novo</a>.</Card>
          )}
        </div>
      )}
    </div>
  )
}
