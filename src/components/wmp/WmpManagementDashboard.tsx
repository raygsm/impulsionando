import { CalendarDays, FileText, Headphones, Package, Settings, Sparkles, Users, WalletCards, Workflow } from 'lucide-react'

const modules = [
  { title: 'Propostas', description: 'Criação, envio, negociação, aceite e histórico de versões.', href: '/wmp/propostas', icon: FileText, enabled: true },
  { title: 'CRM e clientes', description: 'Leads, relacionamento, histórico e oportunidades comerciais.', icon: Users, enabled: false },
  { title: 'Agenda e eventos', description: 'Planejamento operacional, eventos próprios e eventos contratados.', icon: CalendarDays, enabled: false },
  { title: 'DJs e parceiros', description: 'Disponibilidade, convites, confirmações, cachês e operação.', icon: Headphones, enabled: false },
  { title: 'Equipamentos e locações', description: 'Catálogo, valores de locação, proprietários, repasses e margem.', icon: Package, enabled: false },
  { title: 'Financeiro e repasses', description: 'Receitas, locações, mão de obra, beneficiários e pagamentos.', icon: WalletCards, enabled: false },
  { title: 'Millito', description: 'Conversas, qualificação, tickets, exportações e atendimento inteligente.', icon: Sparkles, enabled: false },
  { title: 'Automações e jornadas', description: 'Comunicação de leads, propostas, equipe e pós-evento.', icon: Workflow, enabled: false },
  { title: 'Configurações', description: 'Dados da WMP, permissões, integrações e parâmetros operacionais.', icon: Settings, enabled: false },
] as const

export function WmpManagementDashboard() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">WMP — Wagner Miller Produções</p>
        <h1 className="text-3xl font-semibold tracking-tight">Área de gestão</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">Central operacional e comercial da WMP. O acesso é autenticado e respeita as permissões atribuídas a cada gestor.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Módulos de gestão WMP">
        {modules.map(({ title, description, icon: Icon, ...item }) => {
          const body = <><div className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-muted/50"><Icon className="size-5" aria-hidden="true" /></div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>{!item.enabled && <p className="mt-3 text-xs font-medium text-muted-foreground">Em finalização técnica</p>}</>
          return item.enabled && 'href' in item ? <a key={title} href={item.href} className="group rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">{body}</a> : <div key={title} className="rounded-xl border bg-card p-5 opacity-70">{body}</div>
        })}
      </section>
    </main>
  )
}
