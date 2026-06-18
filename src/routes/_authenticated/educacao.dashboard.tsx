import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { educDashboard } from '@/lib/educ.functions'
import { useEducBranding } from '@/lib/educ-branding'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Trophy,
  Building2,
  Megaphone,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/educacao/dashboard')({
  head: () => ({ meta: [{ title: 'Dashboard Educação' }] }),
  component: EducDashboardPage,
})

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

function EducDashboardPage() {
  const fetcher = useServerFn(educDashboard)
  const { data, isLoading } = useQuery({
    queryKey: ['educ-dashboard'],
    queryFn: () => fetcher({}),
    refetchInterval: 60_000,
  })

  if (isLoading || !data) {
    return (
      <div className="container max-w-6xl py-6">
        <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
      </div>
    )
  }

  const k = data.kpis

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2 truncate">
            <GraduationCap className="h-6 w-6 shrink-0" aria-hidden="true" /> Dashboard Educação
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Indicadores consolidados da rede educacional — leads, matrículas, conversão,
            evasão, receita, inadimplência e ranking de polos.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/educacao/polos">Gerir polos</Link>
        </Button>
      </header>

      <section
        aria-label="Indicadores-chave"
        className="grid gap-3 grid-cols-2 md:grid-cols-4"
      >
        <Kpi icon={Users} label="Leads" value={k.totalLeads.toString()} />
        <Kpi icon={TrendingUp} label="Matrículas" value={k.totalMatriculas.toString()} />
        <Kpi icon={TrendingUp} label="Conversão" value={pct(k.conversao)} />
        <Kpi icon={TrendingDown} label="Evasão" value={k.evasao.toString()} tone="warning" />
        <Kpi icon={DollarSign} label="Receita ativa/mês" value={fmtBRL(k.receitaMes)} />
        <Kpi
          icon={AlertTriangle}
          label="Inadimplência"
          value={fmtBRL(k.inadimplenciaValor)}
          tone="danger"
        />
        <Kpi icon={Users} label="Alunos ativos" value={k.ativos.toString()} />
        <Kpi
          icon={AlertTriangle}
          label="Contas em atraso"
          value={k.inadimplentes.toString()}
          tone="warning"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4" aria-hidden="true" /> Ranking de polos
          </h2>
          <ol className="space-y-1.5 text-sm">
            {data.ranking.length === 0 ? (
              <li className="text-muted-foreground">Sem polos cadastrados ainda.</li>
            ) : (
              data.ranking.slice(0, 10).map((p, i) => (
                <li
                  key={p.polo_id}
                  className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-2"
                >
                  <span className="font-mono text-muted-foreground">#{i + 1}</span>
                  <span className="truncate font-medium">{p.nome}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {p.matriculas} mat. / {p.leads} leads
                  </span>
                  {p.acima_meta ? (
                    <Badge variant="default" className="ml-2">
                      acima da meta
                    </Badge>
                  ) : p.meta > 0 ? (
                    <Badge variant="outline" className="ml-2">
                      abaixo da meta
                    </Badge>
                  ) : (
                    <span />
                  )}
                </li>
              ))
            )}
          </ol>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4" aria-hidden="true" /> Leads por campanha
          </h2>
          {data.campanhas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lead com campanha definida.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.campanhas
                .sort((a, b) => b.leads - a.leads)
                .map((c) => (
                  <li
                    key={c.campanha}
                    className="grid grid-cols-[1fr_auto] items-center gap-2"
                  >
                    <span className="truncate">{c.campanha}</span>
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {c.leads} leads
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4" aria-hidden="true" /> Performance detalhada por polo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1">Polo</th>
                <th scope="col" className="px-2 py-1 text-right">Leads</th>
                <th scope="col" className="px-2 py-1 text-right">Matr.</th>
                <th scope="col" className="px-2 py-1 text-right">Conv.</th>
                <th scope="col" className="px-2 py-1 text-right">Evasão</th>
                <th scope="col" className="px-2 py-1 text-right">Meta</th>
                <th scope="col" className="px-2 py-1 text-right">Receita</th>
              </tr>
            </thead>
            <tbody>
              {data.polos.map((p) => (
                <tr key={p.polo_id} className="border-t border-border/50">
                  <td className="px-2 py-1.5 font-medium">{p.nome}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{p.leads}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{p.matriculas}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{pct(p.conversao)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{p.evasao}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{p.meta || '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{fmtBRL(p.receita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: string
  tone?: 'default' | 'warning' | 'danger'
}) {
  const toneCls =
    tone === 'danger'
      ? 'text-red-700 dark:text-red-300'
      : tone === 'warning'
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-foreground'
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className={`text-xl font-bold mt-1 tabular-nums ${toneCls}`}>{value}</div>
    </Card>
  )
}
