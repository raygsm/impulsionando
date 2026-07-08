export default function DepoimentosSection() {
  const items = [
    { name: "Camila R.", brand: "Green", text: "Perdi 8kg em 60 dias com o Super Green Black. Nunca me senti tão bem comigo mesma." },
    { name: "Rafael M.", brand: "Blue", text: "O Mesa no Pau devolveu minha confiança. Recomendo de olhos fechados." },
    { name: "Juliana T.", brand: "Yellow", text: "Meu filho ama o Bam Bam Bam. Finalmente uma vitamina que ele pede pra tomar!" },
  ];
  return (
    <section className="border-t border-white/10 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Histórias reais</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Transformando vidas todos os dias.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((d) => (
            <figure key={d.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <blockquote className="text-white/80">"{d.text}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 font-bold text-black" aria-hidden>{d.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-white/50">Cliente {d.brand}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
