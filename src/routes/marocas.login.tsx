import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UtensilsCrossed, ClipboardList, Eye, EyeOff, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/marocas/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Marocas" },
      { name: "description", content: "Acesse sua conta Marocas para acompanhar pedidos, reservas e repetir favoritos em 1 clique." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarocasLoginPage,
});

const BACKGROUND_IMG = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&auto=format&fit=crop";

function MarocasLoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO Codex: integrar com Supabase auth.
  };

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={BACKGROUND_IMG} alt="Ambiente Marocas" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/65 to-slate-900/45" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 text-white">
        <Link to="/marocas" className="flex items-center gap-2 font-bold text-xl">
          <UtensilsCrossed className="h-6 w-6" /> Marocas
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/marocas/cardapio" className="hover:underline">Cardápio</Link>
          <Link to="/marocas/reservas" className="hover:underline">Reservas</Link>
        </nav>
      </header>

      <section className="relative z-10 container mx-auto px-6 py-8 grid lg:grid-cols-2 gap-10 items-center min-h-[calc(100dvh-96px)]">
        <div className="text-white max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Área do cliente</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3 leading-tight">
            Sua mesa. Seu pedido.<br />Sua história com a Marocas.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Repita favoritos com 1 clique, acompanhe entregas em tempo real, controle suas reservas e ganhe benefícios exclusivos de cliente recorrente.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            <Link to="/marocas/pedidos" className="flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/20 transition">
              <ClipboardList className="h-4 w-4" /> Meus pedidos
            </Link>
            <Link to="/marocas/assistente" className="flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/20 transition">
              <LifeBuoy className="h-4 w-4" /> Assistente
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto rounded-2xl bg-white/95 backdrop-blur shadow-2xl border p-8">
          <h2 className="font-bold text-xl">Entrar</h2>
          <p className="text-sm text-muted-foreground mt-1">Use o e-mail do seu último pedido.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">E-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="voce@email.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Senha</span>
              <div className="mt-1 relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Lembrar de mim
              </label>
              <Link to="/reset-password" className="text-primary hover:underline">Esqueci a senha</Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 hover:opacity-90 transition"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm">
            <span className="text-muted-foreground">Ainda não tem conta? </span>
            <Link to="/marocas/cardapio" className="text-primary font-semibold hover:underline">
              Fazer pedido como visitante
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
