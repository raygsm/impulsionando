import { createFileRoute, Link } from "@tanstack/react-router";
import { ColorsMark } from "@/components/brand/BrandMarks";

export const Route = createFileRoute("/colors/$brand")({
  head: () => ({
    meta: [
      { title: "Colors Saúde — Portfólio oficial" },
      { name: "robots", content: "noindex,follow" },
      { name: "description", content: "O portfólio Colors Saúde agora é apresentado de forma unificada. Conheça produtos, atendimento, eventos e canais oficiais." },
    ],
    links: [{ rel: "canonical", href: "https://colors.impulsionando.com.br/colors" }],
  }),
  component: LegacyBrandRedirect,
});

function LegacyBrandRedirect() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08110d] px-6 text-white">
      <section className="max-w-xl rounded-3xl border border-emerald-400/20 bg-white/[0.04] p-8 text-center shadow-2xl">
        <ColorsMark size={56} className="mx-auto" />
        <h1 className="mt-5 text-3xl font-black">Uma só Colors Saúde.</h1>
        <p className="mt-3 text-white/85">As antigas divisões de linha deixaram de organizar a experiência pública. Todo o portfólio, suporte, agenda, eventos e canais oficiais agora estão reunidos na Colors.</p>
        <Link to="/colors" className="mt-6 inline-flex rounded-full bg-emerald-400 px-6 py-3 font-bold text-black hover:bg-emerald-300">Ir para Colors Saúde</Link>
      </section>
    </main>
  );
}
