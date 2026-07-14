import { useBrand } from "./BrandThemeProvider";

export function BrandAbout() {
  const b = useBrand();
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: b.hero.imageGradient }} aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-20" style={{ color: b.palette.primaryFg }}>
          <div className="text-xs uppercase tracking-wider opacity-80">Sobre a {b.companyName}</div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: b.typography.heading }}>
            Uma empresa construída para durar
          </h1>
          <p className="mt-4 text-lg opacity-90">{b.about.mission}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <div className="prose max-w-none" style={{ color: b.palette.ink }}>
          <p className="text-lg leading-relaxed">{b.about.story}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
          Nossos valores
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {b.about.values.map((v) => (
            <div key={v.title} className="rounded-2xl p-6 border" style={{ background: "#fff", borderColor: `${b.palette.ink}12` }}>
              <div className="h-1 w-10 rounded-full mb-4" style={{ background: b.palette.accent }} />
              <h3 className="font-semibold" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>{v.title}</h3>
              <p className="mt-2 text-sm" style={{ color: b.palette.muted }}>{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: b.typography.heading, color: b.palette.ink }}>
          O time
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {b.about.team.map((m) => (
            <div key={m.name} className="rounded-2xl overflow-hidden border" style={{ background: "#fff", borderColor: `${b.palette.ink}10` }}>
              <div
                className="aspect-square grid place-items-center text-5xl font-bold"
                style={{ background: `linear-gradient(135deg, ${m.accent}, ${b.palette.accent})`, color: "#fff", fontFamily: b.typography.heading }}
              >
                {m.initials}
              </div>
              <div className="p-4">
                <h3 className="font-semibold" style={{ color: b.palette.ink, fontFamily: b.typography.heading }}>{m.name}</h3>
                <div className="text-xs mt-1" style={{ color: b.palette.primary }}>{m.role}</div>
                <p className="mt-2 text-sm" style={{ color: b.palette.muted }}>{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
