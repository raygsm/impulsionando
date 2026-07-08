import { useState } from "react";
import { colorsEvents } from "@/lib/colors-analytics";

export default function EbooksSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <section className="border-y border-white/10 bg-gradient-to-br from-emerald-950/60 via-[#0a0f0d] to-blue-950/40 py-20">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Presente pra você</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">Baixe nossos e-books de saúde.</h2>
          <p className="mt-4 text-lg text-white/70">
            Cadastre seu e-mail e receba 2 e-books incríveis com dicas práticas de bem-estar.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              colorsEvents.ebookDownload(email);
              window.location.href = `mailto:contato@colorssaude.com.br?subject=${encodeURIComponent("Quero receber os e-books")}&body=${encodeURIComponent(`E-mail: ${email}`)}`;
              setSent(true);
            }}
            className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row"
          >
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-emerald-400"
            />
            <button className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-black transition hover:bg-emerald-400">
              Receber presente
            </button>
          </form>
          {sent && <p className="mt-3 text-sm text-emerald-300">Perfeito! Vamos enviar seus e-books em instantes.</p>}
          <p className="mt-3 text-xs text-white/50">Ao enviar você aceita nossa política de privacidade.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 blur-2xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="text-6xl" aria-hidden>📚</div>
            <p className="mt-4 text-lg font-semibold">2 e-books exclusivos</p>
            <p className="mt-1 text-sm text-white/60">Direto na sua caixa de entrada.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
