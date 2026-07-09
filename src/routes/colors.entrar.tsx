import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import AuthShell from "@/components/colors/AuthShell";

export const Route = createFileRoute("/colors/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Colors Saúde" },
      { name: "description", content: "Acesse sua conta Colors Saúde para acompanhar pedidos e rastreios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !pass) { setErr("Preencha e-mail e senha."); return; }
    setLoading(true);
    // MOCK — Codex plugará supabase.auth.signInWithPassword aqui.
    setTimeout(() => navigate({ to: "/colors/minha-conta" }), 700);
  }

  return (
    <AuthShell
      title="Bem-vinda de volta 👋"
      subtitle="Acesse sua conta Colors para acompanhar pedidos e rastreios."
      footer={
        <>Ainda não tem conta? <Link to="/colors/criar-conta" className="font-semibold text-emerald-300 hover:text-emerald-200">Criar conta grátis</Link></>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail">
          <input
            type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls} placeholder="voce@email.com"
          />
        </Field>
        <Field label="Senha" trailing={
          <Link to="/colors/recuperar" className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">Esqueci a senha</Link>
        }>
          <div className="relative">
            <input
              type={show ? "text" : "password"} autoComplete="current-password" required
              value={pass} onChange={(e) => setPass(e.target.value)}
              className={inputCls + " pr-11"} placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {err && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

        <button type="submit" disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3 text-sm font-black text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {loading ? "Entrando..." : "Entrar na minha conta"}
        </button>

        <p className="text-center text-[11px] text-white/40">
          Ao continuar, você concorda com os Termos e a Política de Privacidade da Colors Saúde.
        </p>
      </form>
    </AuthShell>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";

export function Field({ label, children, trailing }: { label: string; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/60">
        {label} {trailing}
      </span>
      {children}
    </label>
  );
}
