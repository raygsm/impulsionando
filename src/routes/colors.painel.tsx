/**
 * /colors/painel — Painel FRONT-END de conversão + auditoria + segurança.
 *
 *  - Contadores por evento e funil por sessão
 *  - Diagnóstico de consentimento LGPD / GA4
 *  - Diagnóstico rápido: ping sintético no gtag e resumo em 1 tela
 *  - Notificação em tempo real de tentativas de cópia (toast)
 *  - Import de CSV do GA4 e comparação com o buffer local por utm_campaign
 *  - Relatório semanal agregado em CSV
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  readColorsEventBuffer,
  clearColorsEventBuffer,
  eventsToCsv,
  downloadCsv,
  type LocalEvent,
} from "@/lib/colors-analytics";
import { getAnalyticsDiagnostic } from "@/lib/analytics";
import { readCopyAttempts, clearCopyAttempts } from "@/components/app/CoreCopyGuard";
import {
  pingGa4,
  parseGa4Csv,
  aggregateByCampaign,
  aggregateWeekly,
  weeklyToCsv,
  compareLocalVsGa4,
  readPingHistory,
  clearPingHistory,
  readLegacyHits,
  clearLegacyHits,
  buildCombinedFunnelLegacyCsv,
  buildSimulatedConsolidation,
  type Ga4PingResult,
  type Ga4CsvRow,
  type CompareRow,
  type PingHistoryEntry,
} from "@/lib/painel-audit";

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
  const [ping, setPing] = useState<Ga4PingResult | null>(null);
  const [pinging, setPinging] = useState(false);
  const [gaCsv, setGaCsv] = useState<Ga4CsvRow[] | null>(null);
  const [gaCsvName, setGaCsvName] = useState<string>("");
  const [hostFilter, setHostFilter] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3000);
    return () => window.clearInterval(id);
  }, []);

  // Rate-limit / agregação de toasts para tentativas de cópia:
  //  - máximo 1 toast a cada 1500ms
  //  - se estourar, agrega e mostra 1 resumo com N eventos no fim da rajada
  useEffect(() => {
    let lastToastAt = 0;
    let pending: Array<Record<string, unknown>> = [];
    let flushTimer: number | null = null;
    const WINDOW = 1500;
    const flush = () => {
      flushTimer = null;
      if (pending.length === 0) return;
      const first = pending[0];
      if (pending.length === 1) {
        toast.error(`🛡️ Cópia detectada: ${first.kind}`, {
          description: `${first.host} · ${first.path} · ${new Date(Number(first.ts)).toLocaleTimeString()}`,
          duration: 8000,
        });
      } else {
        const kinds = new Set(pending.map((p) => String(p.kind)));
        toast.error(`🛡️ ${pending.length} tentativas de cópia em ${(WINDOW / 1000).toFixed(1)}s`, {
          description: `${first.host} · tipos: ${Array.from(kinds).join(", ")}`,
          duration: 10000,
        });
      }
      pending = [];
      lastToastAt = Date.now();
    };
    const onAttempt = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as Record<string, unknown> | undefined;
      if (!detail) return;
      pending.push(detail);
      setTick((t) => t + 1);
      const since = Date.now() - lastToastAt;
      if (since >= WINDOW && pending.length === 1) {
        flush();
      } else if (flushTimer === null) {
        flushTimer = window.setTimeout(flush, WINDOW);
      }
    };
    window.addEventListener("imp:copy-attempt", onAttempt as EventListener);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("imp-security");
      bc.onmessage = (m) => {
        if (m.data?.type === "copy_attempt") {
          onAttempt(new CustomEvent("imp:copy-attempt", { detail: m.data.entry }));
        }
      };
    } catch { /* noop */ }
    return () => {
      window.removeEventListener("imp:copy-attempt", onAttempt as EventListener);
      if (flushTimer !== null) window.clearTimeout(flushTimer);
      bc?.close();
    };
  }, []);

  const allEvents = useMemo(() => readColorsEventBuffer(), [tick]);
  const events = useMemo(() => filterByPeriod(allEvents, period), [allEvents, period]);
  const attempts = useMemo(() => readCopyAttempts(), [tick]);
  const diag = useMemo(() => getAnalyticsDiagnostic(), [tick]);
  const local = useMemo(() => aggregateByCampaign(events), [events]);
  const weekly = useMemo(() => aggregateWeekly(events), [events]);
  const pingHistory = useMemo(() => readPingHistory(), [tick]);
  const legacyHits = useMemo(() => readLegacyHits(), [tick]);
  const availableHosts = useMemo(() => {
    const s = new Set<string>();
    if (typeof window !== "undefined") s.add(window.location.hostname);
    for (const h of legacyHits) { s.add(h.from_host); s.add(h.to_host); }
    return Array.from(s).filter(Boolean).sort();
  }, [legacyHits, tick]);
  const simulated = useMemo(
    () => buildSimulatedConsolidation(events, legacyHits),
    [events, legacyHits],
  );
  const compare = useMemo<CompareRow[]>(
    () => (gaCsv ? compareLocalVsGa4(local, gaCsv) : []),
    [local, gaCsv],
  );

  // Filtros do histórico de ping.
  const [pingFilter, setPingFilter] = useState<{ q: string; onlyFail: boolean }>({ q: "", onlyFail: false });
  const filteredPings = useMemo(() => {
    const q = pingFilter.q.trim().toLowerCase();
    return pingHistory
      .slice()
      .reverse()
      .filter((p) => {
        if (pingFilter.onlyFail && p.ok) return false;
        if (!q) return true;
        const hay = `${p.host} ${p.path} ${p.message} ${p.ping_id} ${p.details.join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
  }, [pingHistory, pingFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.name] = (c[e.name] ?? 0) + 1;
    return c;
  }, [events]);

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
  function handleExportWeekly() {
    const csv = weeklyToCsv(weekly);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`colors-relatorio-semanal-${stamp}.csv`, csv);
  }
  function handleExportCombined() {
    const spec = PERIODS.find((p) => p.id === period)!;
    const periodStart = spec.ms === Number.POSITIVE_INFINITY ? 0 : Date.now() - spec.ms;
    const { csv, count } = buildCombinedFunnelLegacyCsv({
      events: allEvents,
      hits: legacyHits,
      hostFilter,
      periodStart,
    });
    if (count === 0) {
      toast.warning("Nada para exportar no filtro atual");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const hostTag = hostFilter ? hostFilter.replace(/[^a-z0-9]+/gi, "-") : "todos";
    downloadCsv(`colors-funil-legado-${period}-${hostTag}-${stamp}.csv`, csv);
    toast.success(`Exportado ${count} registros`);
  }
  async function runPing() {
    setPinging(true);
    try {
      const r = await pingGa4();
      setPing(r);
      if (r.ok) toast.success("Ping GA4 recebido"); else toast.warning("Ping GA4 não confirmado");
    } finally { setPinging(false); }
  }
  async function handleCsvFile(file: File) {
    const text = await file.text();
    const rows = parseGa4Csv(text);
    if (rows.length === 0) {
      toast.error("Não consegui reconhecer o CSV do GA4", {
        description: "Exporte pela Exploração > Formato Tabela com colunas utm_campaign, Sessões e Conversões.",
      });
      return;
    }
    setGaCsv(rows);
    setGaCsvName(file.name);
    toast.success(`Importadas ${rows.length} campanhas do GA4`);
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
              Exportar eventos
            </button>
            <button onClick={handleExportWeekly} className="rounded-full bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Relatório semanal CSV
            </button>
            <div className="flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 pl-3 text-sm text-fuchsia-100">
              <span className="text-xs uppercase tracking-widest text-fuchsia-200/70">Host</span>
              <select
                value={hostFilter}
                onChange={(e) => setHostFilter(e.target.value)}
                className="bg-transparent px-2 py-2 text-sm outline-none"
                title="Filtra o export combinado por host"
              >
                <option value="" className="text-black">todos</option>
                {availableHosts.map((h) => (
                  <option key={h} value={h} className="text-black">{h}</option>
                ))}
              </select>
              <button
                onClick={handleExportCombined}
                className="rounded-full bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-black hover:bg-fuchsia-400"
              >
                Funil + legado (CSV)
              </button>
            </div>
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

        {/* Diagnóstico rápido — ping gtag */}
        <div className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-500/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">⚡ Diagnóstico rápido do GA4</h2>
              <p className="mt-1 text-sm text-white/70">
                Dispara um evento sintético <code>painel_ping</code> e resume em 1 tela por que
                pode não chegar ao GA4 (consentimento, adblock, gtag ausente, hit bloqueado).
              </p>
            </div>
            <button
              onClick={runPing}
              disabled={pinging}
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-black hover:bg-sky-400 disabled:opacity-60"
            >
              {pinging ? "Testando…" : "Rodar ping agora"}
            </button>
          </div>
          {ping && (
            <div className={"mt-4 rounded-xl border p-4 " + (ping.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10")}>
              <p className="text-sm font-semibold">{ping.ok ? "✅ GA4 confirmou o hit" : "⚠️ Ping enviado, mas não chegou ao GA4"}</p>
              <p className="mt-1 text-sm text-white/80">{ping.message}</p>
              <ul className="mt-3 grid gap-1 text-xs text-white/70 sm:grid-cols-2">
                {ping.details.map((d) => (<li key={d}>• {d}</li>))}
              </ul>
              <p className="mt-3 text-[11px] text-white/50">
                ping_id: <code data-allow-copy>{ping.ping_id}</code> — cole em <b>GA4 → Tempo real → Contagem de eventos por parâmetro</b> para confirmar.
              </p>
            </div>
          )}
        </div>

        {/* Histórico dos pings de diagnóstico — persistente + filtros */}
        <div className="mb-6 rounded-2xl border border-sky-500/20 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">🕒 Histórico de diagnósticos</h2>
              <p className="mt-1 text-xs text-white/60">
                {pingHistory.length} execuções armazenadas localmente (máx. 200). Sobrevivem a
                reload; filtre por host, motivo ou <code>ping_id</code>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={pingFilter.q}
                onChange={(e) => setPingFilter((s) => ({ ...s, q: e.target.value }))}
                placeholder="Buscar host, path, motivo…"
                className="rounded-full border border-white/15 bg-black/50 px-4 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={pingFilter.onlyFail}
                  onChange={(e) => setPingFilter((s) => ({ ...s, onlyFail: e.target.checked }))}
                  className="accent-amber-500"
                />
                só falhas
              </label>
              <button
                onClick={() => { clearPingHistory(); setTick((t) => t + 1); toast.success("Histórico limpo"); }}
                className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10"
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Quando</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Host</th>
                  <th className="p-3">Path</th>
                  <th className="p-3">Motivo</th>
                  <th className="p-3">ping_id</th>
                </tr>
              </thead>
              <tbody>
                {filteredPings.map((p: PingHistoryEntry, i) => (
                  <tr key={p.ping_id + i} className="border-t border-white/5">
                    <td className="p-3 text-white/60">{new Date(p.ts).toLocaleString()}</td>
                    <td className={"p-3 font-mono " + (p.ok ? "text-emerald-300" : "text-amber-300")}>
                      {p.ok ? "OK" : "FAIL"}
                    </td>
                    <td className="p-3 font-mono text-white/70">{p.host}</td>
                    <td className="p-3 font-mono text-white/70">{p.path}</td>
                    <td className="p-3 text-white/80">{p.message}</td>
                    <td className="p-3 font-mono text-white/50" data-allow-copy>{p.ping_id}</td>
                  </tr>
                ))}
                {filteredPings.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-white/40">
                    {pingHistory.length === 0 ? "Nenhum diagnóstico ainda. Rode o ping acima." : "Nenhum resultado com esse filtro."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registro de acessos ao subdomínio legado colorssaude */}
        <div className="mb-6 rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">🔀 Acessos ao subdomínio legado</h2>
              <p className="mt-1 text-xs text-white/60">
                Toda visita a <code>colorssaude.impulsionando.com.br</code> é redirecionada para
                <code> colors.impulsionando.com.br</code> e logada aqui (path/query/hash preservados).
                Também dispara <code>legacy_subdomain_hit</code> no GA4.
              </p>
            </div>
            <button
              onClick={() => { clearLegacyHits(); setTick((t) => t + 1); }}
              className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10"
            >
              Limpar log
            </button>
          </div>
          <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Quando</th>
                  <th className="p-3">De</th>
                  <th className="p-3">Para</th>
                  <th className="p-3">Path + query</th>
                  <th className="p-3">UA</th>
                </tr>
              </thead>
              <tbody>
                {legacyHits.slice().reverse().map((h, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3 text-white/60">{new Date(h.ts).toLocaleString()}</td>
                    <td className="p-3 font-mono text-amber-200">{h.from_host}</td>
                    <td className="p-3 font-mono text-emerald-200">{h.to_host}</td>
                    <td className="p-3 font-mono text-white/70">{h.path}{h.search}{h.hash}</td>
                    <td className="p-3 text-white/40 truncate max-w-[220px]" title={h.ua}>{h.ua.slice(0, 60)}</td>
                  </tr>
                ))}
                {legacyHits.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-white/40">
                    Nenhum acesso ao subdomínio legado registrado neste dispositivo.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consolidação (SIMULADA — placeholder até o backend ser destravado) */}
        <div className="mb-6 rounded-2xl border border-dashed border-amber-400/40 bg-amber-500/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">🧪 Consolidação por tenant e host (simulada)</h2>
              <p className="mt-1 text-xs text-white/60">
                Prévia visual do que virá quando os endpoints server-side existirem.
                <strong className="text-amber-200"> Hoje é 100% localStorage deste navegador</strong> —
                não há persistência no Supabase, então é uma amostra por dispositivo.
                Fonte: <code data-allow-copy>{simulated.source}</code> · gerado em
                <code> {new Date(simulated.generated_at).toLocaleTimeString()}</code>.
              </p>
            </div>
            <span className="rounded-full border border-amber-300/40 px-3 py-1 text-[11px] uppercase tracking-widest text-amber-200">
              placeholder
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">Funil por tenant (mock)</p>
              <table className="mt-2 w-full text-left text-xs">
                <thead className="text-white/50">
                  <tr>
                    <th className="py-1">tenant</th>
                    <th className="py-1">sessões</th>
                    <th className="py-1">CTA</th>
                    <th className="py-1">checkout</th>
                    <th className="py-1">lead</th>
                    <th className="py-1">conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {simulated.tenants.map((t) => (
                    <tr key={t.tenant} className="border-t border-white/5">
                      <td className="py-1 font-mono text-emerald-200">{t.tenant}</td>
                      <td className="py-1">{t.sessions}</td>
                      <td className="py-1">{t.cta_click}</td>
                      <td className="py-1">{t.checkout_click}</td>
                      <td className="py-1">{t.lead_submit}</td>
                      <td className="py-1 text-emerald-300">{t.conversion_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">Legacy hits por host (mock)</p>
              <table className="mt-2 w-full text-left text-xs">
                <thead className="text-white/50">
                  <tr>
                    <th className="py-1">host</th>
                    <th className="py-1">hits</th>
                    <th className="py-1">último</th>
                  </tr>
                </thead>
                <tbody>
                  {simulated.legacy_by_host.length === 0 && (
                    <tr><td colSpan={3} className="py-3 text-center text-white/40">Sem hits neste dispositivo.</td></tr>
                  )}
                  {simulated.legacy_by_host.map((r) => (
                    <tr key={r.host} className="border-t border-white/5">
                      <td className="py-1 font-mono text-amber-200">{r.host}</td>
                      <td className="py-1">{r.hits}</td>
                      <td className="py-1 text-white/60">{new Date(r.last_hit).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-amber-400/30 bg-black/40 p-3 text-[11px] text-amber-100/80">
            Para consolidar entre navegadores e dispositivos preciso destravar o
            backend (<code>mem://core/frontend-only-lock</code>) e liberar: migration
            <code> painel_funnel_events</code> com RLS por tenant, <code>createServerFn</code>
            de ingest autenticado e rota pública <code>/api/public/painel/legacy-hit</code>
            para os hits do subdomínio legado. Me confirme "pode destravar o backend"
            e eu abro a migration + endpoints na próxima rodada.
          </p>
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
        </div>

        {/* Import GA4 CSV & comparação */}
        <div className="mt-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">📥 Importar CSV do GA4 e comparar</h2>
              <p className="mt-1 text-sm text-white/70">
                No GA4 → <b>Explorar</b> → nova exploração, dimensão <code>utm_campaign</code>,
                métricas <b>Sessões</b> + <b>Conversões</b>, exporte como CSV e envie aqui.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }}
              />
              <button onClick={() => fileRef.current?.click()} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-black hover:bg-indigo-400">
                Selecionar CSV GA4
              </button>
              {gaCsv && (
                <button onClick={() => { setGaCsv(null); setGaCsvName(""); }} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                  Limpar
                </button>
              )}
            </div>
          </div>
          {gaCsv && (
            <p className="mt-2 text-xs text-white/50">
              Arquivo: <code data-allow-copy>{gaCsvName}</code> · {gaCsv.length} campanhas importadas
            </p>
          )}
          <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">utm_campaign</th>
                  <th className="p-3">Sessões (local)</th>
                  <th className="p-3">Sessões (GA4)</th>
                  <th className="p-3">Checkout local</th>
                  <th className="p-3">Conv. GA4</th>
                  <th className="p-3">Taxa local</th>
                  <th className="p-3">Taxa GA4</th>
                  <th className="p-3">Δ sessões</th>
                </tr>
              </thead>
              <tbody>
                {compare.map((r) => (
                  <tr key={r.utm_campaign} className="border-t border-white/5">
                    <td className="p-3 font-mono text-indigo-200" data-allow-copy>{r.utm_campaign}</td>
                    <td className="p-3">{r.local_sessions}</td>
                    <td className="p-3">{r.ga_sessions}</td>
                    <td className="p-3">{r.local_checkout}</td>
                    <td className="p-3">{r.ga_conversions}</td>
                    <td className="p-3">{r.local_rate}%</td>
                    <td className="p-3">{r.ga_rate}%</td>
                    <td className={"p-3 " + (r.delta_sessions === 0 ? "text-white/40" : r.delta_sessions > 0 ? "text-emerald-300" : "text-amber-300")}>
                      {r.delta_sessions > 0 ? "+" : ""}{r.delta_sessions}
                    </td>
                  </tr>
                ))}
                {compare.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-white/40">
                    {gaCsv ? "Nenhuma campanha em comum ainda." : "Importe um CSV do GA4 para comparar taxas de conversão por campanha."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Relatório semanal */}
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">📈 Relatório semanal por origem/utm_campaign</h2>
              <p className="mt-1 text-sm text-white/60">
                Agregação automática do buffer local por semana ISO. Baixe em CSV para auditar
                tendências sem filtrar manualmente no GA4.
              </p>
            </div>
            <button onClick={handleExportWeekly} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Baixar CSV semanal
            </button>
          </div>
          <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Semana</th>
                  <th className="p-3">utm_campaign</th>
                  <th className="p-3">Sessões</th>
                  <th className="p-3">CTA</th>
                  <th className="p-3">Checkout</th>
                  <th className="p-3">Lead</th>
                  <th className="p-3">Conv. %</th>
                </tr>
              </thead>
              <tbody>
                {weekly.map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3 font-mono text-white/70">{r.week}</td>
                    <td className="p-3 font-mono text-emerald-200" data-allow-copy>{r.utm_campaign}</td>
                    <td className="p-3">{r.sessions}</td>
                    <td className="p-3">{r.cta_click}</td>
                    <td className="p-3">{r.checkout_click}</td>
                    <td className="p-3">{r.lead_submit}</td>
                    <td className="p-3">{r.conversion_rate}%</td>
                  </tr>
                ))}
                {weekly.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-white/40">Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
                    Nenhum evento no período. Navegue pelo site, clique em CTAs / WhatsApp / checkout e volte aqui.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tentativas de cópia — com toast em tempo real */}
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold">🛡️ Tentativas de cópia detectadas</h2>
          <p className="mt-1 text-xs text-white/60">
            Toast em tempo real (mesma aba + entre abas). Também logadas no GA4 como
            <code> copy_attempt</code>.
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
            <li><b>Admin → Dimensões personalizadas</b>: crie <code>session_id</code> e <code>visitor_id</code> (escopo: evento).</li>
            <li><b>Explorar → Funil</b>: <span className="font-mono">page_view → cta_click → checkout_click → lead_submit</span>.</li>
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
