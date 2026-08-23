import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { CpMark } from "./CpBrand";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "impulsionando:cp-discovery-dismissed-at:v2";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const COPIES = [
  {
    eyebrow: "Assunto confidencial?",
    title: "Tem conversas que não deveriam deixar rastros.",
    body: "CP — Chat Privado. Entrada controlada, identidade discreta, retenção configurável e uma arquitetura desenhada para reduzir exposição desde o início.",
  },
  {
    eyebrow: "Privacidade não começa no botão apagar",
    title: "Só vocês precisam saber.",
    body: "Crie uma conversa privada para assuntos pessoais, profissionais ou estratégicos com participantes autorizados e regras claras de permanência.",
  },
  {
    eyebrow: "Conversa importante. Canal certo.",
    title: "O que é confidencial deve continuar confidencial.",
    body: "Use o CP quando a conversa exige mais controle sobre quem entra, como se identifica e por quanto tempo o conteúdo permanece disponível.",
  },
  {
    eyebrow: "CP | Segurança e Privacidade",
    title: "Converse. Resolva. Encerre.",
    body: "Um ambiente privado do Ecossistema Impulsionando para quem precisa conversar com menos exposição e mais controle.",
  },
] as const;

export function CpDiscoveryPopup() {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState(0);

  const copy = useMemo(() => COPIES[variant % COPIES.length], [variant]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) || "0");
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;

    setVariant(Math.floor(Math.random() * COPIES.length));
    const delay = 6500 + Math.floor(Math.random() * 9000);
    const timer = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!open) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 z-[80] w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950 text-white shadow-2xl"
      aria-label="Conheça o CP — Chat Privado"
      role="dialog"
      aria-modal="false"
    >
      <div className="relative p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(148,163,184,0.16),transparent_38%),radial-gradient(circle_at_95%_100%,rgba(59,130,246,0.16),transparent_36%)]" />
        <button onClick={close} className="absolute right-3 top-3 z-10 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        <div className="relative">
          <CpMark className="[&_*]:text-white" compact />
          <div className="mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
            <LockKeyhole className="h-4 w-4" /> {copy.eyebrow}
          </div>
          <h2 className="mt-3 pr-5 text-2xl font-black leading-tight">{copy.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{copy.body}</p>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>A privacidade do CP é apresentada com transparência: prometemos somente controles que a arquitetura efetivamente consegue garantir.</span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100" onClick={close}>
              <Link to="/cp">Quero conhecer o CP <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={close}>Agora não</Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
