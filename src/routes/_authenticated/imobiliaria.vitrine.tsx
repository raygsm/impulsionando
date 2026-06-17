import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { getVitrineCounters } from '@/lib/realestate-vitrine.functions'
import { useActiveCompany } from '@/hooks/use-active-company'
import { PageHeader, StatCard } from '@/components/app/PageElements'
import { Home, MessageSquare, Search, Users, BellRing, Send, Inbox, Star } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/imobiliaria/vitrine')({
  head: () => ({ meta: [{ title: 'Vitrine — Painel imobiliário' }] }),
  component: Page,
})

function Page() {
  const { companyId } = useActiveCompany()
  const fetchCounters = useServerFn(getVitrineCounters)
  const { data } = useQuery({
    queryKey: ['vitrine-counters', companyId],
    enabled: !!companyId,
    queryFn: () => fetchCounters({ data: { companyId } }),
    refetchInterval: 20000,
  })
  const c = data ?? {
    interestsTotal: 0, interestsNew: 0, interestsAttending: 0, interestsLast30Days: 0,
    messagesNew: 0, messagesTotal: 0, searchesActive: 0, searchesTotal: 0,
    propertiesActive: 0, propertiesFeatured: 0, leadsFromVitrineLast7Days: 0,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Painel da vitrine"
        description="Visão consolidada dos resultados gerados pela vitrine pública."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Interessados (total)" value={c.interestsTotal} icon={Users} />
        <StatCard label="Interessados novos" value={c.interestsNew} hint="Aguardando atendimento" icon={BellRing} accent />
        <StatCard label="Em atendimento" value={c.interestsAttending} icon={Send} />
        <StatCard label="Últimos 30 dias" value={c.interestsLast30Days} icon={Users} />
        <StatCard label="Mensagens novas" value={c.messagesNew} icon={MessageSquare} />
        <StatCard label="Mensagens (total)" value={c.messagesTotal} icon={Inbox} />
        <StatCard label="Buscas ativas" value={c.searchesActive} icon={Search} />
        <StatCard label="Buscas (total)" value={c.searchesTotal} icon={Search} />
        <StatCard label="Imóveis ativos" value={c.propertiesActive} icon={Home} />
        <StatCard label="Imóveis em destaque" value={c.propertiesFeatured} icon={Star} />
        <StatCard label="Leads vindos da vitrine (7d)" value={c.leadsFromVitrineLast7Days} icon={Users} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Link to="/imobiliaria/interessados" className="block p-5 rounded-lg border bg-card hover:bg-accent transition">
          <div className="font-semibold">Interessados</div>
          <div className="text-sm text-muted-foreground mt-1">Atender quem clicou em ‘Tenho interesse’.</div>
        </Link>
        <Link to="/imobiliaria/mensagens" className="block p-5 rounded-lg border bg-card hover:bg-accent transition">
          <div className="font-semibold">Mensagens</div>
          <div className="text-sm text-muted-foreground mt-1">Caixa de entrada das ações da vitrine.</div>
        </Link>
        <Link to="/imobiliaria/intencoes" className="block p-5 rounded-lg border bg-card hover:bg-accent transition">
          <div className="font-semibold">Buscas salvas</div>
          <div className="text-sm text-muted-foreground mt-1">Clientes que cadastraram busca.</div>
        </Link>
      </div>
    </div>
  )
}
