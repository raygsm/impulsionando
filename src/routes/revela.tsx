import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, GraduationCap, Heart, LineChart, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/revela")({
  head: () => ({
    meta: [
      { title: "REVELA — Potencial além da nota e do currículo" },
      {
        name: "description",
        content:
          "REVELA é uma iniciativa da Impulsionando que conecta escuta, observação, experiências, competências demonstradas e oportunidades reais sem rotular trajetórias.",
      },
    ],
  }),
  component: RevelaLanding,
});

const pillars = [
  { icon: Heart, title: "Escutar", text: "Perguntas mensais e trimestrais acompanham interesses, bem-estar, curiosidades e mudanças sem rotular." },
  { icon: Users, title: "Observar", text: "Professores e comitês registram evidências que uma nota isolada não consegue mostrar." },
  { icon: Sparkles, title: "Experimentar", text: "Trilhas e experiências transformam curiosidade em descoberta real antes de qualquer decisão definitiva." },
  { icon: LineChart, title: "Evoluir", text: "Indicadores longitudinais comparam a pessoa com ela mesma e mostram mudanças ao longo do tempo." },
  { icon: Building2, title: "Provar", text: "Empresas podem propor desafios práticos e descobrir capacidade demonstrada além do currículo." },
  { icon: GraduationCap, title: "Conectar", text: "Escola, aluno e oportunidades se encontram com consentimento, explicabilidade e participação humana." },
];

export function RevelaLanding() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] text-[#17231c]">
      <section className="mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-center px-6 py-20 lg:px-10">
        <div className="mb-8 inline-flex w-fit items-center rounded-full border border-[#244c36]/20 bg-white/60 px-4 py-2 text-sm font-semibold tracking-wide text-[#244c36]">REVELA · uma iniciativa Impulsionando</div>
        <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-8xl">Todo talento merece a oportunidade de aparecer.</h1>
        <p className="mt-8 max-w-3xl text-lg leading-8 text-[#44534a] sm:text-xl">Ajudamos escolas a conhecer pessoas além das notas e empresas a reconhecer competências além dos currículos. Escutar, experimentar, desenvolver e provar — sem decidir o futuro de ninguém.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#como-funciona" className="inline-flex items-center gap-2 rounded-full bg-[#173e2a] px-6 py-3 font-semibold text-white">Conheça o REVELA <ArrowRight size={18}/></a>
          <Link to="/auth" className="inline-flex items-center rounded-full border border-[#173e2a]/20 bg-white px-6 py-3 font-semibold text-[#173e2a]">Entrar</Link>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-[#173e2a]/10 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-2 lg:px-10">
          <div><span className="text-sm font-bold uppercase tracking-[.18em] text-[#52705e]">Na escola</span><h2 className="mt-3 text-4xl font-semibold tracking-tight">Você é mais do que sua nota.</h2><p className="mt-4 max-w-xl leading-7 text-[#526057]">O perfil é vivo: combina autoescuta, observações de diferentes professores, experiências e evidências. Recomenda explorar; nunca sentencia vocação.</p></div>
          <div><span className="text-sm font-bold uppercase tracking-[.18em] text-[#52705e]">No trabalho</span><h2 className="mt-3 text-4xl font-semibold tracking-tight">Você é mais do que seu currículo.</h2><p className="mt-4 max-w-xl leading-7 text-[#526057]">Oportunidades descrevem problemas reais. Desafios práticos podem demonstrar capacidade e velocidade de aprendizagem, inclusive quando falta a experiência histórica tradicional.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <p className="max-w-3xl text-2xl leading-10">O REVELA não existe para dizer a uma pessoa quem ela é. Existe para criar oportunidades suficientes para que ela possa <strong>descobrir, desenvolver e demonstrar</strong> seu potencial.</p>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{pillars.map(({icon:Icon,title,text}) => <article key={title} className="rounded-3xl border border-[#173e2a]/10 bg-white p-7"><Icon className="mb-7 text-[#2e6746]"/><h3 className="text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-[#59665e]">{text}</p></article>)}</div>
      </section>

      <section className="bg-[#173e2a] text-white"><div className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-white/60">Princípio</p><blockquote className="mt-5 max-w-5xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">A escola conhece a nota. O REVELA ajuda a escola a conhecer a pessoa.</blockquote><p className="mt-8 text-white/70">Descubra. Experimente. Desenvolva. Prove. Revele.</p></div></section>
    </main>
  );
}
