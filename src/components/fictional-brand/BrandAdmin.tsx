import { BarChart3, Calendar, LayoutDashboard, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useBrand } from "./BrandThemeProvider";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  producao: "Em produção",
  entregue: "Entregue",
  confirmado: "Confirmado",
  concluido: "Concluído",
};

export function BrandAdmin() {
  const b = useBrand();
  const a = b.admin;
  const maxRevenue = Math.max(...(a.revenue?.map((r) => r.value) ?? [1]));
  const maxFunnel = Math.max(...(a.funnel?.map((f) => f.value) ?? [1]));

  return (
    <div style={{ background: b.palette.ink, color: b.palette.primaryFg }} className="min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-2 text-xs opacity-70">
          <LayoutDashboard className="h-4 w-4" />
          Painel administrativo · simulação
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: b.typography.heading }}>
          Central operacional
        </h1>
        <p className="mt-2 text-sm opacity-70 max-w-xl">
          Uma prévia de como o time da {b.companyName} acompanha o dia a dia dentro da plataforma Impulsionando.
        </p>

        {/* KPIs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {a.kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border p-5"
              style={{ background: `${b.palette.primaryFg}0a`, borderColor: `${b.palette.primaryFg}18` }}
            >
              <div className="text-xs uppercase tracking-wider opacity-70">{k.label}</div>
              <div className="mt-2 text-3xl font-bold" style={{ fontFamily: b.typography.heading, color: b.palette.accent }}>
                {k.value}
              </div>
              {k.hint && <div className="mt-1 text-xs opacity-70">{k.hint}</div>}
            </div>
          ))}
        </div>

        {/* Grid principal */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Faturamento */}
          {a.revenue && (
            <div className="rounded-2xl border p-6 lg:col-span-2" style={{ background: `${b.palette.primaryFg}08`, borderColor: `${b.palette.primaryFg}18` }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: b.palette.accent }} />
                  <h2 className="font-semibold" style={{ fontFamily: b.typography.heading }}>Faturamento (últimos 4 meses)</h2>
                </div>
                <span className="text-xs opacity-70">Simulação</span>
              </div>
              <div className="flex items-end gap-4 h-48">
                {a.revenue.map((r) => (
                  <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full rounded-t-md" style={{
                      height: `${(r.value / maxRevenue) * 100}%`,
                      background: `linear-gradient(180deg, ${b.palette.accent}, ${b.palette.primary})`,
                      minHeight: 12,
                    }} />
                    <div className="text-xs opacity-70">{r.month}</div>
                    <div className="text-[11px] font-semibold">R$ {(r.value / 1000).toFixed(0)}k</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funil */}
          {a.funnel && (
            <div className="rounded-2xl border p-6" style={{ background: `${b.palette.primaryFg}08`, borderColor: `${b.palette.primaryFg}18` }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4" style={{ color: b.palette.accent }} />
                <h2 className="font-semibold" style={{ fontFamily: b.typography.heading }}>Funil de conversão</h2>
              </div>
              <div className="space-y-3">
                {a.funnel.map((f) => (
                  <div key={f.stage}>
                    <div className="flex items-center justify-between text-xs opacity-80">
                      <span>{f.stage}</span>
                      <span className="font-semibold">{f.value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: `${b.palette.primaryFg}18` }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(f.value / maxFunnel) * 100}%`, background: b.palette.accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedidos ou agenda */}
          {a.orders && (
            <div className="rounded-2xl border p-6 lg:col-span-3" style={{ background: `${b.palette.primaryFg}08`, borderColor: `${b.palette.primaryFg}18` }}>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBag className="h-4 w-4" style={{ color: b.palette.accent }} />
                <h2 className="font-semibold" style={{ fontFamily: b.typography.heading }}>Pedidos em andamento</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs opacity-70 text-left">
                    <tr className="border-b" style={{ borderColor: `${b.palette.primaryFg}18` }}>
                      <th className="py-2 pr-3">Pedido</th>
                      <th className="py-2 pr-3">Cliente</th>
                      <th className="py-2 pr-3">Recebido</th>
                      <th className="py-2 pr-3">Total</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0" style={{ borderColor: `${b.palette.primaryFg}0f` }}>
                        <td className="py-3 pr-3 font-mono text-xs">{o.id}</td>
                        <td className="py-3 pr-3">{o.customer}</td>
                        <td className="py-3 pr-3 opacity-80">{o.when}</td>
                        <td className="py-3 pr-3 font-semibold">{o.total}</td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${b.palette.accent}30`, color: b.palette.accent }}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {a.appointments && (
            <div className="rounded-2xl border p-6 lg:col-span-3" style={{ background: `${b.palette.primaryFg}08`, borderColor: `${b.palette.primaryFg}18` }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4" style={{ color: b.palette.accent }} />
                <h2 className="font-semibold" style={{ fontFamily: b.typography.heading }}>Agenda de hoje</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs opacity-70 text-left">
                    <tr className="border-b" style={{ borderColor: `${b.palette.primaryFg}18` }}>
                      <th className="py-2 pr-3">Horário</th>
                      <th className="py-2 pr-3">Paciente</th>
                      <th className="py-2 pr-3">Serviço</th>
                      <th className="py-2 pr-3">Profissional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.appointments.map((ap) => (
                      <tr key={ap.id} className="border-b last:border-0" style={{ borderColor: `${b.palette.primaryFg}0f` }}>
                        <td className="py-3 pr-3 font-semibold">{ap.when}</td>
                        <td className="py-3 pr-3">{ap.patient}</td>
                        <td className="py-3 pr-3 opacity-80">{ap.service}</td>
                        <td className="py-3 pr-3 opacity-80">{ap.professional}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border p-6 flex flex-wrap items-center gap-4 justify-between" style={{ background: `${b.palette.accent}18`, borderColor: `${b.palette.accent}55` }}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: b.palette.accent, color: b.palette.ink }}>
              <Users className="h-5 w-5" />
            </span>
            <div>
              <div className="font-semibold" style={{ fontFamily: b.typography.heading }}>
                Quer um painel assim para o seu negócio?
              </div>
              <div className="text-xs opacity-80">A Impulsionando implanta em até 14 dias, com sua marca e seus dados.</div>
            </div>
          </div>
          <a
            href="/onboarding-site"
            className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold"
            style={{ background: b.palette.accent, color: b.palette.ink }}
          >
            Iniciar rascunho
          </a>
        </div>
      </div>
    </div>
  );
}
