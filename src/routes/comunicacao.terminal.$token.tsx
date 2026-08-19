import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownRight, ArrowUpRight, Maximize2, Minus, RefreshCw, Trophy } from "lucide-react";

export const Route = createFileRoute("/comunicacao/terminal/$token")({
  component: TeamTerminalPage,
  head: () => ({ meta: [{ title: "Terminal da Equipe — Impulsionando" }] }),
});

type MetricBlock = { gross: number; paid: number; effective_percent: number; suggested?: number; transactions?: number };
type TerminalPayload = {
  ok: boolean;
  error?: string;
  terminal?: {
    name: string;
    company_name: string;
    service_charge_percent: number;
    daily_target_percent: number;
    show_revenue: boolean;
    show_service_charge_value: boolean;
    show_comparisons: boolean;
    refresh_seconds: number;
    timezone: string;
  };
  today?: MetricBlock;
  yesterday?: MetricBlock;
  last_7_days?: MetricBlock;
  last_30_days?: MetricBlock;
  generated_at?: string;
};

function money(value: number | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

function pct(value: number | undefined) {
  return `${Number(value ?? 0).toFixed(2).replace(".", ",")}%`;
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (Math.abs(delta) < 0.005) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-4 w-4" /> estável</span>;
  if (delta > 0) return <span className="inline-flex items-center gap-1 text-emerald-500"><ArrowUpRight className="h-4 w-4" /> +{delta.toFixed(2).replace(".", ",")} p.p.</span>;
  return <span className="inline-flex items-center gap-1 text-rose-500"><ArrowDownRight className="h-4 w-4" /> {delta.toFixed(2).replace(".", ",")} p.p.</span>;
}

function TeamTerminalPage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["team-terminal", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pos_team_terminal_metrics", { p_token: token });
      if (error) throw error;
      return data as TerminalPayload;
    },
    refetchInterval: (query) => Math.max(5000, Number((query.state.data as TerminalPayload | undefined)?.terminal?.refresh_seconds ?? 15) * 1000),
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center bg-slate-950 text-white"><RefreshCw className="h-8 w-8 animate-spin" /></div>;
  if (error || !data?.ok || !data.terminal || !data.today) return <div className="min-h-screen grid place-items-center bg-slate-950 p-8 text-center text-white"><div><h1 className="text-2xl font-semibold">Terminal indisponível</h1><p className="mt-2 text-slate-400">O acesso pode ter expirado ou sido desativado.</p></div></div>;

  const t = data.terminal;
  const today = data.today;
  const target = Number(t.daily_target_percent ?? t.service_charge_percent ?? 0);
  const effective = Number(today.effective_percent ?? 0);
  const achievement = target > 0 ? Math.min(100, (effective / target) * 100) : 0;
  const remaining = Math.max(0, target - effective);
  const status = effective >= target ? "Meta atingida" : remaining <= 1 ? "Muito perto da meta" : "Vamos buscar a meta";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8 lg:p-10 overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1800px] flex-col">
        <header className="flex items-start justify-between gap-6 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm uppercase tracking-[.22em] text-slate-400">{t.name}</p>
            <h1 className="mt-1 text-3xl font-semibold md:text-5xl">{t.company_name}</h1>
            <p className="mt-2 text-slate-400">Desempenho da equipe em tempo real</p>
          </div>
          <button
            type="button"
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="rounded-xl border border-white/15 bg-white/5 p-3 text-slate-300 hover:bg-white/10"
            aria-label="Tela cheia"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </header>

        <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-sm text-slate-400">Taxa efetivamente paga hoje</p>
                  <div className="mt-2 text-6xl font-bold tracking-tight md:text-8xl">{pct(effective)}</div>
                  <div className="mt-3 flex items-center gap-2 text-lg"><Trophy className="h-5 w-5" /> {status}</div>
                </div>
                <div className="min-w-[220px] text-right">
                  <p className="text-sm text-slate-400">Meta configurada</p>
                  <div className="mt-1 text-4xl font-semibold">{pct(target)}</div>
                  {effective < target ? <p className="mt-2 text-sm text-slate-400">Faltam {pct(remaining)} para a meta</p> : null}
                </div>
              </div>
              <div className="mt-8 h-5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${achievement}%` }} />
              </div>
            </div>

            {t.show_revenue ? <MetricCard label="Faturamento do dia" value={money(today.gross)} hint={`${today.transactions ?? 0} lançamentos`} /> : null}
            {t.show_service_charge_value ? <MetricCard label="Taxa arrecadada" value={money(today.paid)} hint={`Sugestão: ${money(today.suggested)}`} /> : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-7">
            <p className="text-sm uppercase tracking-[.18em] text-slate-400">Comparativos</p>
            <h2 className="mt-2 text-2xl font-semibold">Como estamos?</h2>
            {t.show_comparisons ? (
              <div className="mt-6 space-y-5">
                <CompareRow label="Ontem" current={effective} previous={Number(data.yesterday?.effective_percent ?? 0)} />
                <CompareRow label="Últimos 7 dias" current={effective} previous={Number(data.last_7_days?.effective_percent ?? 0)} />
                <CompareRow label="Últimos 30 dias" current={effective} previous={Number(data.last_30_days?.effective_percent ?? 0)} />
              </div>
            ) : <p className="mt-5 text-slate-400">Comparativos desativados para este terminal.</p>}

            <div className="mt-8 rounded-2xl bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">Mensagem para a equipe</p>
              <p className="mt-2 text-xl font-medium leading-relaxed">
                {effective >= target
                  ? "Excelente trabalho. A percepção de valor do atendimento está aparecendo no resultado."
                  : "Cada atendimento conta. Qualidade, atenção e experiência aumentam a adesão à taxa de serviço."}
              </p>
            </div>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
          <span>Impulsionando · Terminal da Equipe</span>
          <span>Atualização automática a cada {t.refresh_seconds}s</span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><p className="text-sm text-slate-400">{label}</p><div className="mt-2 text-4xl font-semibold md:text-5xl">{value}</div><p className="mt-2 text-sm text-slate-500">{hint}</p></div>;
}

function CompareRow({ label, current, previous }: { label: string; current: number; previous: number }) {
  return <div className="rounded-2xl border border-white/10 p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-400">{label}</p><div className="mt-1 text-3xl font-semibold">{pct(previous)}</div></div><div className="text-right"><Delta current={current} previous={previous} /></div></div></div>;
}
