import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

/**
 * AuthShell — layout premium compartilhado por Entrar / Criar conta / Recuperar.
 * Frontend-only. Nenhuma chamada a Supabase/Auth aqui.
 */
export default function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Lado visual */}
        <aside className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_20%,rgba(16,185,129,0.45),transparent_55%),radial-gradient(800px_circle_at_80%_80%,rgba(163,230,53,0.28),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,10,8,0.9))]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <Link to="/colors" className="inline-flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
              <span className="text-xl font-black tracking-tight">colors<span className="text-emerald-400">.</span></span>
            </Link>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Colors Saúde</p>
              <h2 className="mt-4 max-w-md text-4xl font-black leading-tight">
                Sua conta, seus pedidos e seus rastreios{" "}
                <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">num só lugar.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm text-white/70">
                Acesse seu histórico, acompanhe entregas Correios/Melhor Envio e recompre em 1 clique.
              </p>
              <ul className="mt-6 grid max-w-md gap-2 text-sm text-white/80">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Canais oficiais Colors Saúde</li>
                <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-400" /> Ambiente PCI-DSS · dados protegidos</li>
              </ul>
            </div>

            <p className="text-xs text-white/40">© Colors Saúde — Grupo Impulsionando</p>
          </div>
        </aside>

        {/* Formulário */}
        <main className="flex flex-col">
          <div className="border-b border-white/10 px-6 py-4 lg:hidden">
            <Link to="/colors" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Voltar à Colors
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-black">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
              <div className="mt-8">{children}</div>
              {footer && <div className="mt-6 text-center text-sm text-white/60">{footer}</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
