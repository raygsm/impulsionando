import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole, X, ArrowRight } from "lucide-react";
import { CpMark } from "./CpBrand";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "impulsionando:cp-discovery-dismissed:v1";

export function CpDiscoveryPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    const timer = window.setTimeout(() => setOpen(true), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!open) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-[80] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950 text-white shadow-2xl" aria-label="Conheça o CP — Chat Privado">
      <div className="relative p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(148,163,184,0.14),transparent_38%)]" />
        <button onClick={close} className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fechar"><X className="h-4 w-4" /></button>
        <div className="relative">
          <CpMark className="[&_*]:text-white" compact />
          <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400"><LockKeyhole className="h-4 w-4" /> Novo produto de privacidade</div>
          <h2 className="mt-3 text-xl font-black leading-tight">A segurança das suas conversas realmente começa aqui.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">CP — Chat Privado. Só por convite, identidade discreta, retenção configurável e arquitetura projetada para que o provedor não leia o conteúdo.</p>
          <div className="mt-5 flex gap-2">
            <Button asChild className="flex-1 bg-white text-slate-950 hover:bg-slate-100" onClick={close}><Link to="/cp">Conhecer o CP <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={close}>Agora não</Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
