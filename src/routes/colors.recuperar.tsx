import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/colors/AuthShell";
import { Field, inputCls } from "@/routes/colors.entrar";

export const Route = createFileRoute("/colors/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Colors Saúde" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // MOCK — Codex plugará supabase.auth.resetPasswordForEmail aqui.
    setTimeout(() => { setLoading(false); setSent(true); }, 600);
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviaremos um link seguro para o seu e-mail."
      footer={<Link to="/colors/entrar" className="font-semibold text-emerald-300 hover:text-emerald-200">Voltar para entrar</Link>}
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-black">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Verifique seu e-mail</h2>
          <p className="mt-2 text-sm text-white/70">
            Se existir uma conta associada a <strong className="text-white">{email}</strong>, enviamos as instruções nos próximos minutos.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="E-mail cadastrado">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="voce@email.com" />
          </Field>
          <button type="submit" disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3 text-sm font-black text-black shadow-lg shadow-emerald-500/40 transition hover:scale-[1.01] disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
