import { CalendarDays, FileText, Headphones, Package, Settings, ShieldCheck, Sparkles, Users, WalletCards, Workflow } from 'lucide-react'

const modules = [
  { title: 'Propostas', description: 'Criação, envio, negociação, aceite e histórico de versões.', href: '/wmp/propostas', icon: FileText, enabled: true },
  { title: 'Contratos e cláusulas', description: 'Governança jurídica versionada. Contrato só é liberado após aceite comercial e com cláusulas ativas.', href: '/wmp/contratos/clausulas', icon: ShieldCheck, enabled: true },
  { title: 'CRM e clientes', description: 'Briefings, leads, qualificação, contatos e evolução comercial.', href: '/wmp/operacao?area=crm', icon: Users, enabled: true },
  { title: 'Agenda e eventos', description: 'Bookings, datas, locais, prazos, cachês e status operacional.', href: '/wmp/operacao?area=agenda', icon: CalendarDays, enabled: true },
  { title: 'DJs e parceiros', description: 'Cadastros, aprovação, disponibilidade, convites e confirmações.', href: '/wmp/operacao?area=djs', icon: Headphones, enabled: true },
  { title: 'Equipamentos e locações', description: 'Catálogo canônico, fabricante, modelo, quantidade, locação, proprietários e curadoria.', href: '/wmp/equipamentos', icon: Package, enabled: true },
  { title: 'Financeiro e repasses', description: 'Locações, beneficiários, valores e acompanhamento de repasses.', href: '/wmp/operacao?area=finance', icon: WalletCards, enabled: true },
  { title: 'Milito', description: 'Conversas encerradas, protocolos, elegibilidade e exportações.', href: '/wmp/operacao?area=millito', icon: Sparkles, enabled: true },
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
          const body = <><div className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-muted/50"><Icon className="size-5" aria-hidden="true" /></div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>{!item.enabled && <p className="mt-3 text-xs font-medium text-muted-foreground">Em homologação final</p>}</>
          return item.enabled && 'href' in item ? <a key={title} href={item.href} className="group rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">{body}</a> : <div key={title} className="rounded-xl border bg-card p-5 opacity-70">{body}</div>
        })}
      </section>
    </main>
  )
}