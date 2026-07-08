/**
 * /colors/super-green-black-kpi — Página dedicada ao Super Green Black
 * com KPIs em tempo real (buffer local) e todos os links de checkout /
 * WhatsApp já com UTMs aplicadas.
 *
 * Complementar ao /colors/painel (que é geral) e à landing agressiva
 * /colors/super-green-black. Rota noindex — uso operacional.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { productBySlug } from "@/data/colors-products";
import {
  readColorsEventBuffer,
  colorsEvents,
  eventsToCsv,
  downloadCsv,
} from "@/lib/colors-analytics";
import { withColorsUtm } from "@/lib/utm";

export const Route = createFileRoute("/colors/super-green-black-kpi")({
  head: () => ({
    meta: [
      { title: "KPIs Super Green Black — Colors Saúde" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Painel dedicado de KPIs em tempo real do Super Green Black." },
    ],
  }),
  component: SgbKpiPage,
});

const CAMPAIGN = "super_green_black_kpi";

function SgbKpiPage() {
  const product = productBySlug("super-green-black");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2000);
    return () => window.clearInterval(id);
  }, []);

  const events = useMemo(() => readColorsEventBuffer(), [tick]);

  const sgbEvents = useMemo(
    () => events.filter((e) => {
      const p = e.params;
      return (
        (typeof p.product === "string" && p.product.toLowerCase().includes("super green")) ||
        (typeof p.target === "string" && p.target.includes("super-green-black")) ||
        (typeof p.href === "string" && p.href.includes("super-green-black"))
      );
    }),
    [events],
  );

  const counts = useMemo(() => {
    const c = { cta_click: 0, checkout_click: 0, whatsapp_click: 0, ebook_download: 0, lead_submit: 0 } as Record<string, number>;
    for (const e of sgbEvents) c[e.name] = (c[e.name] ?? 0) + 1;
    return c;
  }, [sgbEvents]);

  const funnel = useMemo(() => {
    const bySession = new Map<string, Set<string>>();
    for (const e of sgbEvents) {
      if (!bySession.has(e.session_id)) bySession.set(e.session_id, new Set());
      bySession.get(e.session_id)!.add(e.name);
    }
    let cta = 0, co = 0, lead = 0;
    for (const set of bySession.values()) {
      if (set.has("cta_click")) cta++;
      if (set.has("checkout_click")) co++;
      if (set.has("lead_submit")) lead++;
    }
    return {
      sessions: bySession.size,
      cta, co, lead,
      rateCoCta: cta ? Math.round((co / cta) * 1000) / 10 : 0,
      rateLeadCo: co ? Math.round((lead / co) * 1000) / 10 : 0,
    };
  }, [sgbEvents]);

  function handleExport() {
    const csv = eventsToCsv(sgbEvents);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadCsv(`sgb-eventos-${stamp}.csv`, csv);
  }

  if (!product) {
    return <div className="min-h-screen bg-black text-white p-8">Produto não encontrado.</div>;
  }

  const waHref = withColorsUtm(
    "https://wa.me/5511934567890?text=" + encodeURIComponent("Olá, quero saber mais sobre o Super Green Black"),
    CAMPAIGN,
    "kpi_page",
  );

  return (
    <div className="min-h-screen bg-[#050a08] text-white">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400">Super Green Black</p>
            <h1 className="text-3xl font-bold">KPIs em tempo real</h1>
            <p className="mt-1 text-sm text-white/60">
              Atualiza a cada 2s a partir do buffer local. Todos os links abaixo já
              carregam UTMs padronizadas para auditoria no GA4.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/colors/painel" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">← Painel geral</Link>
            <Link to="/colors/super-green-black" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Landing SGB</Link>
            <button onClick={handleExport} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
              Exportar CSV
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["cta_click", "CTA click"],
              ["checkout_click", "Checkout click"],
              ["whatsapp_click", "WhatsApp click"],
              ["ebook_download", "Ebook download"],
              ["lead_submit", "Lead submit"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-transparent p-5">
              <p className="text-xs uppercase tracking-widest text-emerald-300/80">{label}</p>
              <p className="mt-2 text-4xl font-black">{counts[k] ?? 0}</p>
              <p className="mt-1 text-xs text-white/60 font-mono">{k}</p>
            </div>
          ))}
        </div>

        {/* Funil */}
        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-6">
          <h2 className="text-lg font-semibold">Funil de conversão (por sessão)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-5">
            <Big label="Sessões" v={funnel.sessions} />
            <Big label="CTA" v={funnel.cta} />
            <Big label="Checkout" v={funnel.co} />
            <Big label="Lead" v={funnel.lead} />
            <Big label="Conv CTA→CO" v={`${funnel.rateCoCta}%`} highlight />
          </div>
        </div>

        {/* Links oficiais com UTMs */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Links oficiais com UTMs</h2>
          <p className="mt-1 text-xs text-white/50">
            Clique para abrir e disparar <code>checkout_click</code> / <code>whatsapp_click</code>.
            UTMs: <code>utm_source=colors_site · utm_medium=web · utm_campaign={CAMPAIGN}</code>.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {product.links.map((l, i) => {
              const href = withColorsUtm(l.href, CAMPAIGN, `checkout_${l.label.toLowerCase()}`);
              return (
                <a
                  key={l.href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  data-allow-copy
                  onClick={() => colorsEvents.checkoutClick(product.name, `kpi_${l.label}`, href)}
                  className={
                    "rounded-2xl px-5 py-4 font-bold transition hover:scale-[1.02] " +
                    (i === 0
                      ? "bg-gradient-to-br from-emerald-400 to-lime-400 text-black shadow-lg shadow-emerald-500/40"
                      : "border border-white/20 bg-white/5 hover:bg-white/10")
                  }
                >
                  <div className="text-xs uppercase tracking-widest opacity-70">Checkout</div>
                  <div className="mt-1 text-lg">{l.label}</div>
                </a>
              );
            })}
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            data-allow-copy
            onClick={() => colorsEvents.whatsappClick("sgb_kpi_page")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 font-semibold hover:bg-emerald-500"
          >
            💬 WhatsApp oficial (com UTM)
          </a>
        </div>

        {/* Últimos eventos SGB */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Últimos eventos Super Green Black</h2>
          <div className="mt-3 max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Sessão</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Params</th>
                </tr>
              </thead>
              <tbody>
                {sgbEvents.slice().reverse().slice(0, 100).map((e, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3 text-white/60">{new Date(e.ts).toLocaleTimeString()}</td>
                    <td className="p-3 font-mono text-white/50">{e.session_id.slice(0, 10)}</td>
                    <td className="p-3 font-mono text-emerald-300">{e.name}</td>
                    <td className="p-3 font-mono text-white/70" data-allow-copy>{JSON.stringify(e.params)}</td>
                  </tr>
                ))}
                {sgbEvents.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-white/60">
                    Sem eventos do SGB ainda. Abra a landing e clique nos CTAs.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Big({ label, v, highlight }: { label: string; v: string | number; highlight?: boolean }) {
  return (
    <div className={"rounded-xl border p-4 " + (highlight ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-black/30")}>
      <p className="text-xs uppercase tracking-widest text-white/60">{label}</p>
      <p className={"mt-2 text-3xl font-black " + (highlight ? "text-emerald-300" : "")}>{v}</p>
    </div>
  );
}
