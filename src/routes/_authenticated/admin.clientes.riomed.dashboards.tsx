import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/clientes/riomed/dashboards')({
  component: RiomedDashboardsHub,
});

const AREAS = [
  { to: '/admin/clientes/riomed/dashboard',     title: 'Geral',      desc: 'Visão consolidada do tenant.' },
  { to: '/admin/clientes/riomed/crm',           title: 'Comercial',  desc: 'Pipeline, leads e oportunidades.' },
  { to: '/admin/clientes/riomed/estoque-almoxarifados', title: 'Estoque', desc: 'Almoxarifados, níveis e movimentações.' },
  { to: '/admin/clientes/riomed/marketing',     title: 'Marketing',  desc: 'Campanhas, jornadas e templates.' },
  { to: '/admin/clientes/riomed/locacao',       title: 'Locação',    desc: 'Contratos e ativos alugados.' },
  { to: '/admin/clientes/riomed/assistencia',   title: 'Assistência Técnica', desc: 'OS, manutenção e SLA.' },
  { to: '/admin/clientes/riomed/financeiro',    title: 'Financeiro', desc: 'AR/AP, fiscal e comissões.' },
  { to: '/admin/clientes/riomed/relatorios',    title: 'Relatórios', desc: 'Exportações e séries históricas.' },
  { to: '/admin/clientes/riomed/governanca',    title: 'Core Impulsionando', desc: 'Governança, políticas e auditoria.' },
] as const;

function RiomedDashboardsHub() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboards RioMed</h1>
        <p className="text-muted-foreground mt-1">Hub consolidado por área operacional.</p>
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AREAS.map((a) => (
          <Link key={a.to} to={a.to} className="block rounded-lg border bg-card p-5 hover:border-primary transition-colors">
            <h2 className="font-semibold mb-1">{a.title}</h2>
            <p className="text-sm text-muted-foreground">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
