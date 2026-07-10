import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Home as HomeIcon, LayoutDashboard, Eye, EyeOff } from "lucide-react";
import { MAROCAS_IMAGENS } from "@/components/marocas/marocasContent";

export const Route = createFileRoute("/marocas/login")({
  head: () => ({
    meta: [
      { title: "Acessar painel — Marocas" },
      { name: "description", content: "Entre no painel Marocas: anfitrião, proprietário, hóspede ou prestador." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarocasLoginPage,
});

function MarocasLoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [perfil, setPerfil] = useState<"anfitriao" | "hospede" | "prestador">("anfitriao");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO Codex: integrar com auth do core Impulsionando (Supabase).
  };

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={MAROCAS_IMAGENS.heroApto} alt="Ambiente Marocas" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/65 to-slate-900/45" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 text-white">
        <Link to="/marocas" className="flex items-center gap-2 font-bold text-xl">
          <HomeIcon className="h-6 w-6" /> Marocas
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/marocas/cadastrar-imovel" className="hover:underline">Cadastrar imóvel</Link>
          <Link to="/marocas/planos" className="hover:underline">Planos</Link>
        </nav>
      </header>

      <section className="relative z-10 container mx-auto px-6 py-8 grid lg:grid-cols-2 gap-10 items-center min-h-[calc(100dvh-96px)]">
        <div className="text-white max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Painel Marocas</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3 leading-tight">
            Seu imóvel.<br />Sua operação.<br />Sob controle.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Painel unificado para anfitriões, hóspedes e prestadores. Reservas, limpezas, manutenções, financeiro e comunicação em um só lugar.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { id: "anfitriao", label: "Anfitrião" },
              { id: "hospede", label: "Hóspede" },
              { id: "prestador", label: "Prestador" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerfil(p.id as any)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  perfil === p.id
                    ? "bg-white text-slate-900 border-white"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md mx-auto rounded-2xl bg-white/95 backdrop-blur shadow-2xl border p-8">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <LayoutDashboard className="h-4 w-4" /> Acessar como {perfil}
          </div>
          <h2 className="font-bold text-xl mt-1">Entrar no painel</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use o e-mail cadastrado no seu contrato ou reserva.
          </p>

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
            <span className="text-muted-foreground">Ainda não é cliente Marocas? </span>
            <Link to="/marocas/cadastrar-imovel" className="text-primary font-semibold hover:underline">
              Cadastrar meu imóvel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
