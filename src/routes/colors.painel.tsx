/**
 * /colors/painel — Painel FRONT-END de conversão + diagnóstico Colors Saúde.
 *
 *  - Contadores por evento
 *  - Funil CTA → Checkout com session_id/visitor_id (jornada real)
 *  - Diagnóstico de consentimento (por que eventos podem não chegar ao GA4)
 *  - Exportação CSV por período (últimas 24h / 7d / 30d / tudo)
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  readColorsEventBuffer,
  clearColorsEventBuffer,
  eventsToCsv,
  downloadCsv,
  type LocalEvent,
} from "@/lib/colors-analytics";
import { getAnalyticsDiagnostic } from "@/lib/analytics";
import { readCopyAttempts, clearCopyAttempts } from "@/components/app/CoreCopyGuard";

export const Route = createFileRoute("/colors/painel")({
  head: () => ({
    meta: [
      { title: "Painel de conversão — Colors Saúde" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Painel interno de eventos de conversão do site Colors Saúde." },
    ],
  }),
  component: PainelPage,
});

const TRACKED = [
  "cta_click",
  "checkout_click",
  "whatsapp_click",
  "ebook_download",
  "lead_submit",
] as const;

const LABELS: Record<(typeof TRACKED)[number], string> = {
  cta_click: "Cliques em CTA",
  checkout_click: "Cliques em checkout",
  whatsapp_click: "Cliques no WhatsApp",
  ebook_download: "Downloads de e-book",
  lead_submit: "Envios de lead",
};

const PERIODS = [
  { id: "24h", label: "24h", ms: 24 * 3600 * 1000 },
  { id: "7d", label: "7 dias", ms: 7 * 24 * 3600 * 1000 },
  { id: "30d", label: "30 dias", ms: 30 * 24 * 3600 * 1000 },
  { id: "all", label: "Tudo", ms: Number.POSITIVE_INFINITY },
] as const;

type PeriodId = (typeof PERIODS)[number]["id"];

function filterByPeriod(events: LocalEvent[], period: PeriodId): LocalEvent[] {
  const now = Date.now();
  const spec = PERIODS.find((p) => p.id === period)!;
  return events.filter((e) => now - e.ts <= spec.ms);
}

function PainelPage() {
  const [tick, setTick] = useState(0);
  const [period, setPeriod] = useState<PeriodId>("7d");
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3000);
    return () => window.clearInterval(id);
  }, []);

  const allEvents = useMemo(() => readColorsEventBuffer(), [tick]);
  const events = useMemo(() => filterByPeriod(allEvents, period), [allEvents, period]);
  const attempts = useMemo(() => readCopyAttempts(), [tick]);
  const diag = useMemo(() => getAnalyticsDiagnostic(), [tick]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.name] = (c[e.name] ?? 0) + 1;
    return c;
  }, [events]);

  // Funil por sessão: uma sessão conta 1× para cada etapa que atingiu.
  const funnel = useMemo(() => {
    const bySession = new Map<string, Set<string>>();
    for (const e of events) {
      if (!bySession.has(e.session_id)) bySession.set(e.session_id, new Set());
      bySession.get(e.session_id)!.add(e.name);
    }
    let cta = 0, co = 0, lead = 0, wa = 0;
    for (const set of bySession.values()) {
      if (set.has("cta_click")) cta++;
      if (set.has("checkout_click")) co++;
      if (set.has("lead_submit")) lead++;
      if (set.has("whatsapp_click")) wa++;
    }
    const rateCoCta = cta > 0 ? Math.round((co / cta) * 1000) / 10 : 0;
    const rateLeadCta = cta > 0 ? Math.round((lead / cta) * 1000) / 10 : 0;
    return { sessions: bySession.size, cta, co, lead, wa, rateCoCta, rateLeadCta };
  }, [events]);

  function handleExport() {
    const csv = eventsToCsv(events);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`colors-eventos-${period}-${stamp}.csv`, csv);
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400">Colors Saúde</p>
            <h1 className="text-3xl font-bold">Painel de conversão</h1>
            <p className="mt-1 text-sm text-white/60">
              {events.length} eventos no período · buffer local (últimos 500). Consolidação
              multiusuário fica no GA4 (property <code data-allow-copy>{diag.ga_id || "—"}</code>).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/colors" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">← Site</Link>
            <Link to="/colors/super-green-black-kpi" className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20">
              KPIs Super Green Black
            </Link>
            <button onClick={handleExport} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Exportar CSV
            </button>
            <button
              onClick={() => { clearColorsEventBuffer(); clearCopyAttempts(); setTick((t) => t + 1); }}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Limpar buffer
            </button>
          </div>
        </div>

        {/* Filtro de período */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <span className="px-2 text-xs uppercase tracking-widest text-white/50">Período</span>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={
                "rounded-full px-4 py-1.5 text-sm transition " +
                (period === p.id
                  ? "bg-emerald-500 text-black font-semibold"
                  : "border border-white/15 text-white/70 hover:bg-white/10")
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Diagnóstico de consentimento / GA4 */}
        <div
          className={
            "mb-6 rounded-2xl border p-6 " +
            (diag.events_will_reach_ga4
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-amber-500/40 bg-amber-500/5")
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {diag.events_will_reach_ga4
                  ? "✅ Eventos chegam ao GA4"
                  : "⚠️ Eventos NÃO estão sendo enviados ao GA4"}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Diagnóstico ao vivo do estado de analytics neste dispositivo.
              </p>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-mono" data-allow-copy>
              session {diag.session_id.slice(0, 12)}…
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <DiagRow label="Measurement ID" value={diag.ga_id || "— (defina VITE_GA4_MEASUREMENT_ID)"} ok={Boolean(diag.ga_id)} />
            <DiagRow label="gtag.js injetado" value={diag.ga_script_injected ? "sim" : "não"} ok={diag.ga_script_injected} />
            <DiagRow label="window.gtag pronto" value={diag.gtag_ready ? "sim" : "não"} ok={diag.gtag_ready} />
            <DiagRow
              label="Consentimento LGPD"
              value={diag.consent ? `analytics=${diag.consent.analytics ? "on" : "off"} · marketing=${diag.consent.marketing ? "on" : "off"}` : "não decidido"}
              ok={Boolean(diag.consent?.analytics)}
            />
            <DiagRow label="Visitor ID" value={diag.visitor_id} ok mono />
            <DiagRow label="Initialized" value={String(diag.initialized)} ok={diag.initialized} />
          </div>

          {diag.blocking_reasons.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-black/30 p-4">
              <p className="text-sm font-semibold text-amber-300">Por que os eventos não aparecem no GA4:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-white/80">
                {diag.blocking_reasons.map((r) => (<li key={r}>{r}</li>))}
              </ul>
              <p className="mt-3 text-xs text-white/50">
                Solução mais comum: abrir o banner LGPD (rodapé → "Preferências de cookies") e ativar
                a categoria <strong>Analytics</strong>. Depois recarregue o /colors/painel.
              </p>
            </div>
          )}
        </div>

        {/* Contadores */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TRACKED.map((k) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-widest text-white/60">{LABELS[k]}</p>
              <p className="mt-2 text-4xl font-bold">{counts[k] ?? 0}</p>
              <p className="mt-1 text-xs text-white/40">evento <code>{k}</code></p>
            </div>
          ))}
        </div>

        {/* Funil por sessão */}
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Funil por sessão · CTA → Checkout → Lead</h2>
            <span className="text-xs text-white/50">{funnel.sessions} sessões únicas no período</span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-5">
            <Metric label="Sessões" value={funnel.sessions} />
            <Metric label="→ CTA" value={funnel.cta} />
            <Metric label="→ Checkout" value={funnel.co} />
            <Metric label="→ Lead" value={funnel.lead} />
            <Metric label="Conversão CTA→CO" value={`${funnel.rateCoCta}%`} />
          </div>
          <p className="mt-3 text-xs text-white/50">
            Cada sessão conta 1× por etapa. <code>session_id</code> e <code>visitor_id</code> são
            enviados em todo evento GA4 — permitem replicar este funil no GA4 → Explorar → Funil.
          </p>
        </div>

        {/* Últimos eventos */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Últimos eventos</h2>
          <div className="mt-3 max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Sessão</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Parâmetros</th>
                </tr>
              </thead>
              <tbody>
                {events.slice().reverse().map((e, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3 text-white/60">{new Date(e.ts).toLocaleTimeString()}</td>
                    <td className="p-3 font-mono text-white/50">{e.session_id.slice(0, 10)}</td>
                    <td className="p-3 font-mono text-emerald-300">{e.name}</td>
                    <td className="p-3 font-mono text-white/70" data-allow-copy>{JSON.stringify(e.params)}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-white/40">
                    Nenhum evento no período. Navegue pelo site, clique em CTAs / WhatsApp / checkout
                    e volte aqui.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tentativas de cópia */}
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold">🛡️ Tentativas de cópia detectadas</h2>
          <p className="mt-1 text-xs text-white/60">
            Registradas pelo CopyGuard do core Impulsionando. Também disparam <code>copy_attempt</code> no GA4.
          </p>
          <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Host</th>
                  <th className="p-3">Path</th>
                  <th className="p-3">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice().reverse().map((a, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3 text-white/60">{new Date(Number(a.ts)).toLocaleString()}</td>
                    <td className="p-3 font-mono text-red-300">{String(a.kind)}</td>
                    <td className="p-3 font-mono text-white/70">{String(a.host)}</td>
                    <td className="p-3 font-mono text-white/70">{String(a.path)}</td>
                    <td className="p-3 text-white/50 truncate max-w-[280px]" title={String(a.ua)}>{String(a.ua).slice(0, 60)}</td>
                  </tr>
                ))}
                {attempts.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-white/40">
                    Nenhuma tentativa registrada neste dispositivo.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <h2 className="text-lg font-semibold text-white">Como configurar o funil no GA4</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>GA4 → <b>Admin</b> → <b>Eventos</b>: confirme <code>cta_click</code>, <code>checkout_click</code>, <code>whatsapp_click</code>, <code>ebook_download</code>, <code>lead_submit</code> (até 24h após o 1º disparo).</li>
            <li>Marque <code>checkout_click</code> e <code>lead_submit</code> como <b>Evento principal</b>.</li>
            <li><b>Admin → Dimensões personalizadas</b>: crie <code>session_id</code> e <code>visitor_id</code> (escopo: evento) — enviados em todo evento.</li>
            <li><b>Explorar → Exploração de funil</b>: <span className="font-mono">page_view (/colors/super-green-black) → cta_click → checkout_click → lead_submit</span>.</li>
            <li>Dimensão secundária: <code>utm_campaign</code> (rotulado por página: colors_home, super_green_black, produto_{`{slug}`}, linha_{`{brand}`}).</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-widest text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DiagRow({ label, value, ok, mono }: { label: string; value: string; ok?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-white/60">{label}</span>
      <span className={(mono ? "font-mono " : "") + (ok ? "text-emerald-300" : "text-amber-300")} data-allow-copy>
        {value}
      </span>
    </div>
  );
}
