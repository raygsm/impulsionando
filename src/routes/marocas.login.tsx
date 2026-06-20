import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, LifeBuoy, MessageCircle, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/marocas/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Marocas" },
      { name: "description", content: "Acesse o portal do proprietário Marocas e acompanhe seu apartamento em tempo real." },
    ],
  }),
  component: MarocasLoginPage,
});

const BACKGROUND_IMG = "https://images.unsplash.com/photo-1505839673365-e3971f8d9184?w=1920&auto=format&fit=crop";
const WHATSAPP_URL = "https://wa.me/5521999999999?text=Ol%C3%A1%20Marocas%2C%20preciso%20de%20ajuda%20com%20login";

function MarocasLoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrar com Supabase auth quando o portal do proprietário estiver ativo.
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background image with optional video fallback */}
      <div className="absolute inset-0 -z-10">
        <img src={BACKGROUND_IMG} alt="Rio de Janeiro" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/65 to-slate-900/45" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 text-white">
        <Link to="/marocas" className="flex items-center gap-2 font-bold text-xl">
          <Building2 className="h-6 w-6" /> Marocas
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/marocas/planos" className="hover:underline">Planos</Link>
          <Link to="/marocas/assistente" className="hover:underline">Assistente</Link>
        </nav>
      </header>

      <section className="relative z-10 container mx-auto px-6 py-12 grid lg:grid-cols-2 gap-10 items-center min-h-[calc(100vh-80px)]">
        <div className="text-white max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Portal do Proprietário</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3 leading-tight">
            Bem-vindo de volta.<br />Sua estadia continua nas melhores mãos.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Acompanhe ocupação, vistorias, repasses PIX e o diário operacional do seu apartamento
            — tudo em tempo real, direto da Zona Sul do Rio.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/20 transition"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Link
              to="/marocas/assistente"
              className="flex items-center justify-center gap-2 rounded-lg bg-white/10 backdrop-blur border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/20 transition"
            >
              <LifeBuoy className="h-4 w-4" /> Suporte
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto rounded-2xl bg-white/95 backdrop-blur shadow-2xl border p-8">
          <h2 className="font-bold text-xl">Entrar no portal</h2>
          <p className="text-sm text-muted-foreground mt-1">Use seu e-mail cadastrado.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">E-mail</span>
              <input
                type="email"
                required
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
              <a href="#" className="text-primary hover:underline">Esqueci a senha</a>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 hover:opacity-90 transition"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm">
            <span className="text-muted-foreground">Ainda não é proprietário Marocas? </span>
            <Link to="/marocas/planos" className="text-primary font-semibold hover:underline">
              Conhecer planos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
