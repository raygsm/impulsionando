/**
 * /colors/painel — Painel front-end de métricas de conversão do site Colors.
 * Lê o buffer local de eventos gravado pelo wrapper `colorsEvents` (últimos
 * 200 eventos disparados neste dispositivo) e apresenta contagens agregadas.
 *
 * Para métricas reais consolidadas de todos os visitantes, use o GA4
 * (property G-TGG4HG3JDJ) — este painel é um checagem operacional rápida
 * para validar que os eventos estão realmente saindo após o consentimento.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  readColorsEventBuffer,
  clearColorsEventBuffer,
} from "@/lib/colors-analytics";

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

function PainelPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 3000);
    return () => window.clearInterval(id);
  }, []);

  const events = useMemo(() => readColorsEventBuffer(), [tick]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.name] = (c[e.name] ?? 0) + 1;
    return c;
  }, [events]);

  const funnel = useMemo(() => {
    const cta = counts["cta_click"] ?? 0;
    const co = counts["checkout_click"] ?? 0;
    const rate = cta > 0 ? Math.round((co / cta) * 1000) / 10 : 0;
    return { cta, co, rate };
  }, [counts]);

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400">Colors Saúde</p>
            <h1 className="text-3xl font-bold">Painel de conversão</h1>
            <p className="mt-1 text-sm text-white/60">
              Últimos {events.length} eventos disparados neste dispositivo após o consentimento.
              Métricas agregadas de todos os visitantes ficam no GA4 (property <code>G-TGG4HG3JDJ</code>).
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/colors"
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Voltar ao site
            </Link>
            <button
              onClick={() => { clearColorsEventBuffer(); setTick((t) => t + 1); }}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Limpar buffer
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {TRACKED.map((k) => (
            <div key={k} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-widest text-white/60">{LABELS[k]}</p>
              <p className="mt-2 text-4xl font-bold">{counts[k] ?? 0}</p>
              <p className="mt-1 text-xs text-white/40">evento <code>{k}</code></p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="text-lg font-semibold">Funil CTA → Checkout (Super Green Black)</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Metric label="Cliques em CTA" value={funnel.cta} />
            <Metric label="Cliques em checkout" value={funnel.co} />
            <Metric label="Conversão local" value={`${funnel.rate}%`} />
          </div>
          <p className="mt-3 text-xs text-white/50">
            Valores consolidados vêm do GA4 → Explorar → Exploração de funil, na sequência
            <code className="mx-1">cta_click</code> →
            <code className="mx-1">checkout_click</code> filtrando <code>product = "Super Green Black"</code>.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Últimos eventos</h2>
          <div className="mt-3 max-h-96 overflow-auto rounded-xl border border-white/10 bg-black/40">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-black/70 uppercase tracking-widest text-white/50">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Evento</th>
                  <th className="p-3">Parâmetros</th>
                </tr>
              </thead>
              <tbody>
                {events.slice().reverse().map((e, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3 text-white/60">{new Date(e.ts).toLocaleTimeString()}</td>
                    <td className="p-3 font-mono text-emerald-300">{e.name}</td>
                    <td className="p-3 font-mono text-white/70">{JSON.stringify(e.params)}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr><td colSpan={3} className="p-6 text-center text-white/40">
                    Nenhum evento capturado. Navegue pelo site, clique em CTAs / WhatsApp / checkout
                    e volte aqui.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <h2 className="text-lg font-semibold text-white">Como configurar o funil no GA4</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>GA4 → <b>Admin</b> → <b>Eventos</b>: confirme que <code>cta_click</code>, <code>checkout_click</code>, <code>whatsapp_click</code>, <code>ebook_download</code> e <code>lead_submit</code> aparecem (podem levar até 24h após o 1º disparo).</li>
            <li>Marque <code>checkout_click</code> e <code>lead_submit</code> como <b>Evento principal</b> (conversão).</li>
            <li>Vá em <b>Explorar</b> → <b>Exploração de funil</b> e crie os passos:
              <span className="ml-1 font-mono">page_view (/colors/super-green-black) → cta_click → checkout_click</span>.
            </li>
            <li>Filtro do funil: <code>product = "Super Green Black"</code>.</li>
            <li>Dimensão secundária: <code>utm_campaign</code> — os CTAs são automaticamente rotulados por página (colors_home, super_green_black, produto_{`{slug}`}, linha_{`{brand}`}).</li>
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
