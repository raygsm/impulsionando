import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/admin/onda-y')({
  component: OndaYHub,
});

function OndaYHub() {
  const cards = [
    {
      to: '/admin/onda-y/fretes',
      title: 'Logística & Fretes',
      desc: 'Tabelas de frete por região/peso/modalidade, parâmetros de retirada/despacho do tenant.',
    },
    {
      to: '/admin/onda-y/prorata',
      title: 'Módulos & Pro-rata',
      desc: 'Registrar upgrade/downgrade de módulo com cálculo pro-rata e impacto na próxima fatura.',
    },
    {
      to: '/admin/onda-y/setores',
      title: 'Setores & Membros',
      desc: 'Vincular usuários a setores (estoque, financeiro, comercial, logística) com canais de notificação.',
    },
    {
      to: '/admin/onda-y/crm-reguas',
      title: 'CRM — Réguas',
      desc: 'Regras de pós-venda, recuperação e relacionamento (X dias) por canal e setor.',
    },
  ];
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Onda Y — Operação completa</h1>
        <p className="text-muted-foreground mt-1">
          Logística de venda, pro-rata de módulos, RBAC por setor e réguas de CRM.
        </p>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="block rounded-lg border bg-card p-5 hover:border-primary transition-colors"
          >
            <h2 className="font-semibold mb-1">{c.title}</h2>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
