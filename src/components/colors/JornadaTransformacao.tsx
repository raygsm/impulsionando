import { Calendar, Sparkles, TrendingUp, Trophy } from "lucide-react";

/**
 * Jornada semana-a-semana — comunicação segura (bem-estar, disciplina, apoio),
 * SEM antes/depois enganoso e SEM promessa de emagrecimento garantido.
 */
export default function JornadaTransformacao() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_100%,rgba(16,185,129,0.12),transparent_60%)]" />
      <div className="container relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Sua jornada</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">O que esperar em cada etapa.</h2>
          <p className="mt-4 text-white/70">
            Bem-estar não acontece do dia para a noite. O Super Green Black apoia sua rotina para que a disciplina vire resultado consistente.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <li key={s.title} className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                Semana {i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3-4" : "5+"}
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/65">{s.desc}</p>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-white/45">
          * Resultados individuais variam conforme rotina, alimentação e organismo. Suplementos não substituem tratamento médico.
        </p>
      </div>
    </section>
  );
}

const STAGES = [
  { icon: Sparkles, title: "Mais energia e foco", desc: "Você sente disposição para retomar a rotina e criar consistência." },
  { icon: Calendar, title: "Rotina no ritmo", desc: "Menos compulsão, mais controle. O hábito começa a ficar leve." },
  { icon: TrendingUp, title: "Mudanças visíveis", desc: "O espelho e a balança começam a acompanhar sua disciplina." },
  { icon: Trophy, title: "Nova versão", desc: "Você mantém o resultado com uma rotina que finalmente cabe na vida real." },
] as const;
