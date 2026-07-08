import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { formatBRL } from "@/data/garrido-imoveis";

export const Route = createFileRoute("/garrido/financiamento")({
  head: () => ({
    meta: [
      { title: "Simulador de financiamento imobiliário — Garrido" },
      { name: "description", content: "Simule seu financiamento imobiliário na Garrido. CEF, Itaú, Bradesco, Santander. Cálculo instantâneo pela Tabela SAC." },
      { property: "og:title", content: "Simulador de financiamento — Imobiliária Garrido" },
      { property: "og:description", content: "Simule seu financiamento imobiliário na hora, sem cadastro." },
    ],
  }),
  component: FinanciamentoPage,
});

function FinanciamentoPage() {
  const valorId = useId(), entradaId = useId(), prazoId = useId(), jurosId = useId();
  const [valor, setValor] = useState<number>(800_000);
  const [entrada, setEntrada] = useState<number>(160_000);
  const [prazo, setPrazo] = useState<number>(360);
  const [juros, setJuros] = useState<number>(10.5); // anual

  const sim = useMemo(() => {
    const financiado = Math.max(0, valor - entrada);
    const i = (juros / 100) / 12; // mensal
    const n = prazo;
    // SAC: amortização constante = P/n
    const amortizacao = financiado / n;
    const primeiraParcela = amortizacao + (financiado * i);
    const ultimaParcela = amortizacao + (amortizacao * i);
    const totalJuros = Array.from({ length: n }, (_, k) => (financiado - amortizacao * k) * i).reduce((a, b) => a + b, 0);
    const totalPago = financiado + totalJuros;
    return { financiado, primeiraParcela, ultimaParcela, totalJuros, totalPago };
  }, [valor, entrada, prazo, juros]);

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-[1fr_1.1fr] gap-8">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">Financiamento</div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[color:var(--garrido-ink)] mt-2">Simule seu financiamento agora</h1>
          <p className="mt-3 text-slate-600">
            Cálculo instantâneo pela Tabela SAC. Trabalhamos com os principais bancos e correspondentes:
            CEF, Itaú, Bradesco, Santander e portabilidade.
          </p>

          <form className="mt-6 space-y-4 bg-white p-5 rounded-xl border border-black/5 shadow-sm">
            <Slider id={valorId} label="Valor do imóvel" value={valor} min={100_000} max={10_000_000} step={10_000} onChange={setValor} format={formatBRL} />
            <Slider id={entradaId} label="Entrada" value={entrada} min={0} max={valor} step={5_000} onChange={setEntrada} format={formatBRL} />
            <Slider id={prazoId} label="Prazo" value={prazo} min={60} max={420} step={12} onChange={setPrazo} format={(v) => `${v} meses (${Math.round(v/12)} anos)`} />
            <Slider id={jurosId} label="Taxa anual" value={juros} min={5} max={16} step={0.1} onChange={setJuros} format={(v) => `${v.toFixed(1)}% a.a.`} />
          </form>
        </div>

        <div>
          <div className="rounded-2xl bg-[color:var(--garrido-ink)] text-white p-6 md:p-8">
            <div className="flex items-center gap-2 text-[color:var(--garrido-gold)] text-xs uppercase tracking-widest font-bold">
              <Calculator className="h-4 w-4" /> Resultado da simulação
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mt-2">{formatBRL(sim.primeiraParcela)}/mês</h2>
            <p className="text-white/70 text-sm mt-1">Primeira parcela (SAC) — vai reduzindo ao longo do prazo.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <ResultBox label="Valor financiado" value={formatBRL(sim.financiado)} />
              <ResultBox label="Última parcela" value={formatBRL(sim.ultimaParcela)} />
              <ResultBox label="Total de juros" value={formatBRL(sim.totalJuros)} />
              <ResultBox label="Total pago (banco)" value={formatBRL(sim.totalPago)} />
            </div>
            <Link to="/garrido/contato" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold px-5 py-2.5 hover:brightness-110">
              Falar com correspondente
            </Link>
          </div>

          <div className="mt-4 rounded-xl bg-white p-4 border border-black/5 text-xs text-slate-600 flex gap-2">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" aria-hidden />
            <p>
              Simulação estimativa. Taxas reais dependem de análise de crédito, relacionamento
              bancário e uso de FGTS. Nossa equipe pode buscar a melhor condição em todos os bancos.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({ id, label, value, min, max, step, onChange, format }: {
  id: string; label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
        <span className="text-sm font-bold text-[color:var(--garrido-ink)]">{format(value)}</span>
      </div>
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-[color:var(--garrido-gold)]"
      />
      <input
        aria-label={`${label} (valor exato)`}
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded border border-black/10 px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/60">{label}</div>
      <div className="font-bold text-white mt-1">{value}</div>
    </div>
  );
}
