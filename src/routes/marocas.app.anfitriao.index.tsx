import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, CalendarRange, Sparkles, Wrench, Wallet, TrendingUp, ArrowRight, AlertTriangle, LogIn, LogOut } from "lucide-react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { KpiCard, Section, DataTable, StatusBadge, EventPill } from "@/components/marocas/MarocasUI";
import { MOCK_IMOVEIS, MOCK_RESERVAS, MOCK_AGENDA, fmtBRL, fmtDateBR, imovelById } from "@/components/marocas/marocasMockData";

export const Route = createFileRoute("/marocas/app/anfitriao/")({
  head: () => ({ meta: [{ title: "Dashboard do anfitrião — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const imoveis = MOCK_IMOVEIS;
  const ativos = imoveis.filter((i) => i.status === "ativo").length;
  const reservasAtuais = MOCK_RESERVAS.filter((r) => r.status === "confirmado").length;
  const proxEntradas = MOCK_RESERVAS.filter((r) => r.status === "confirmado").slice(0, 5);
  const limpezasPendentes = MOCK_AGENDA.filter((e) => e.tipo === "limpeza" && e.status !== "concluido").length;
  const manutOpen = MOCK_AGENDA.filter((e) => e.tipo === "manutencao" && e.status !== "concluido").length;
  const ocupacao = Math.round(imoveis.reduce((a, i) => a + i.ocupacao30d, 0) / imoveis.length);
  const receita = MOCK_RESERVAS.filter((r) => r.status !== "cancelado").reduce((a, r) => a + r.valorTotal, 0);
  const custoOp = 8420;

  return (
    <MarocasAppShell
      title="Bom dia, Renata 👋"
      description="Visão geral da operação Marocas — últimos 30 dias e próximas 72h."
      breadcrumbs={[{ label: "Anfitrião" }]}
      actions={
        <>
          <Link to="/marocas/app/anfitriao/imoveis" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Meus imóveis</Link>
          <Link to="/marocas/app/anfitriao/agenda" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold hover:opacity-90">Abrir agenda</Link>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        <KpiCard label="Imóveis ativos" value={`${ativos}/${imoveis.length}`} icon={<Home className="h-4 w-4" />} />
        <KpiCard label="Reservas atuais" value={reservasAtuais} icon={<CalendarRange className="h-4 w-4" />} />
        <KpiCard label="Ocupação 30d" value={`${ocupacao}%`} tone="success" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label="Limpezas pendentes" value={limpezasPendentes} tone={limpezasPendentes > 0 ? "warn" : "default"} icon={<Sparkles className="h-4 w-4" />} />
        <KpiCard label="Manutenções abertas" value={manutOpen} tone={manutOpen > 0 ? "warn" : "default"} icon={<Wrench className="h-4 w-4" />} />
        <KpiCard label="Receita estimada" value={fmtBRL(receita)} hint={`Custo op.: ${fmtBRL(custoOp)}`} icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Section
            title="Próximas 72h"
            description="Entradas, saídas, limpezas e vistorias programadas."
            actions={<Link to="/marocas/app/anfitriao/agenda" className="text-sm text-primary hover:underline inline-flex items-center gap-1">Ver agenda <ArrowRight className="h-3.5 w-3.5" /></Link>}
          >
            <DataTable
              rows={MOCK_AGENDA.slice(0, 6)}
              columns={[
                { header: "Tipo", render: (r) => <EventPill type={r.tipo} /> },
                { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
                { header: "Data", render: (r) => `${fmtDateBR(r.data)} · ${r.hora}` },
                { header: "Responsável", render: (r) => r.responsavel ?? <span className="text-muted-foreground">a definir</span> },
                { header: "Status", render: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </Section>

          <Section title="Próximas entradas confirmadas">
            <DataTable
              rows={proxEntradas}
              columns={[
                { header: "Check-in", render: (r) => <span className="inline-flex items-center gap-1"><LogIn className="h-3.5 w-3.5 text-emerald-600" />{fmtDateBR(r.checkin)}</span> },
                { header: "Check-out", render: (r) => <span className="inline-flex items-center gap-1"><LogOut className="h-3.5 w-3.5 text-sky-600" />{fmtDateBR(r.checkout)}</span> },
                { header: "Imóvel", render: (r) => imovelById(r.imovelId)?.apelido ?? "—" },
                { header: "Hóspede", render: (r) => r.hospede },
                { header: "Canal", render: (r) => <span className="text-xs">{r.canal}</span> },
                { header: "Valor", render: (r) => <span className="tabular-nums">{fmtBRL(r.valorTotal)}</span> },
              ]}
            />
          </Section>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-red-300/60 bg-red-50/50 dark:bg-red-950/20 p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" /> 1 urgência aberta
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Ar-condicionado sem gelar · Copa Ocean 902 · há 12min</p>
            <Link to="/marocas/app/anfitriao/manutencoes" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Abrir chamado <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm">Ocupação por imóvel</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {imoveis.map((i) => (
                <li key={i.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate mr-2">{i.apelido}</span>
                    <span className="tabular-nums">{i.ocupacao30d}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${i.ocupacao30d}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm">Ações rápidas</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Link to="/marocas/app/anfitriao/reservas" className="rounded-md border p-2 hover:bg-muted">Nova reserva</Link>
              <Link to="/marocas/app/anfitriao/limpezas" className="rounded-md border p-2 hover:bg-muted">Agendar limpeza</Link>
              <Link to="/marocas/app/anfitriao/manutencoes" className="rounded-md border p-2 hover:bg-muted">Abrir manutenção</Link>
              <Link to="/marocas/app/anfitriao/automacoes" className="rounded-md border p-2 hover:bg-muted">Ver automações</Link>
            </div>
          </div>
        </div>
      </div>
    </MarocasAppShell>
  );
}
