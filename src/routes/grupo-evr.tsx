import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Activity, BarChart3, CalendarDays, Pill, ShieldCheck, Smartphone } from "lucide-react";

export const Route = createFileRoute("/grupo-evr")({
  head: () => ({
    meta: [
      { title: "Grupo EVR" },
      { name: "theme-color", content: "#163d31" },
      { name: "application-name", content: "Grupo EVR" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [{ rel: "manifest", href: "/grupo-evr.webmanifest" }],
  }),
  component: GrupoEvrLayout,
});

function GrupoEvrLayout() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const host = window.location.hostname.toLowerCase();
    const inGrupoEvr = host === "grupoevr.impulsionando.com.br" || window.location.pathname.startsWith("/grupo-evr");
    if (!inGrupoEvr) return;
    navigator.serviceWorker.register("/grupo-evr-sw.js", { scope: "/grupo-evr/" }).catch((error) => {
      console.error("[Grupo EVR] service worker registration failed", error);
    });
  }, []);

  return (
    <div data-tenant="grupo-evr" className="min-h-screen bg-[#f7f8f6] text-[#12231d]">
      <header className="sticky top-0 z-40 border-b border-[#dbe2dc] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
          <Link to="/grupo-evr" className="flex items-center gap-3" aria-label="Grupo EVR — início">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#163d31] text-white"><Activity className="h-5 w-5" /></span>
            <span><strong className="block text-lg tracking-[0.12em]">GRUPO EVR</strong><small className="block text-[10px] uppercase tracking-[0.18em] text-[#718078]">Saúde · ciência · gestão</small></span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            <Link to="/grupo-evr/empresas">Empresas</Link>
            <Link to="/grupo-evr/autoridades">Autoridades</Link>
            <Link to="/grupo-evr/operacao">Operação</Link>
            <Link to="/grupo-evr/minha-conta" className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4" /> Paciente</Link>
            <Link to="/grupo-evr/gestao" className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Gestão</Link>
          </nav>
          <Link to="/grupo-evr/agendar" className="rounded-xl bg-[#163d31] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f2e25]">Agendar</Link>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="border-t border-[#dbe2dc] bg-[#12231d] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-3 lg:px-8">
          <div><p className="font-semibold tracking-[0.12em]">GRUPO EVR</p><p className="mt-2 max-w-sm text-sm leading-6 text-white/70">Ecossistema integrado de saúde, atendimento, serviços e varejo farmacêutico com gestão orientada por dados.</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-white/55"><Link to="/grupo-evr/privacidade">Privacidade</Link><Link to="/grupo-evr/termos">Termos</Link><Link to="/grupo-evr/contato">Contato</Link></div></div>
          <div className="grid grid-cols-2 gap-3 text-sm text-white/80"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Agenda inteligente</span><span className="flex items-center gap-2"><Pill className="h-4 w-4" /> Ative-se Pharma</span><span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> BI executivo</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Governança</span></div>
          <div className="text-sm text-white/60 md:text-right">Grupo EVR · Powered by Impulsionando Tecnologia</div>
        </div>
      </footer>
    </div>
  );
}
