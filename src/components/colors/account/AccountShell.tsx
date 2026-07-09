import { ReactNode } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Package, User, MapPin, LogOut, ShieldCheck, MessageCircle } from "lucide-react";
import { COLORS_MOCK_USER } from "@/data/colors-mock-account";
import { cn } from "@/lib/utils";

/**
 * AccountShell — layout da área do cliente Colors (mock).
 * O submenu abre em cada rota filha. Logout apenas visual (sem Supabase).
 */
const NAV = [
  { to: "/colors/minha-conta", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/colors/minha-conta/pedidos", label: "Meus pedidos", icon: Package },
  { to: "/colors/minha-conta/perfil", label: "Perfil e endereços", icon: User },
] as const;

export default function AccountShell({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  const active = (to: string, exact?: boolean) => exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050a08]/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/colors" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 font-black text-black">C</span>
            <span className="text-lg font-black tracking-tight">colors<span className="text-emerald-400">.</span></span>
          </Link>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="mr-1 inline h-3 w-3" /> Conta verificada
            </span>
            <span className="text-sm text-white/70">Olá, <strong className="text-white">{COLORS_MOCK_USER.firstName}</strong></span>
            <Link to="/colors/entrar" className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10">
              <LogOut className="mr-1 inline h-3 w-3" /> Sair
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  active(n.to, n.exact)
                    ? "bg-gradient-to-r from-emerald-500/20 to-lime-500/10 text-emerald-200 ring-1 ring-emerald-400/30"
                    : "text-white/70 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:block">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Precisa de ajuda?</p>
            <p className="mt-2 text-sm text-white/70">Nosso suporte humano responde em minutos.</p>
            <a
              href="https://wa.me/5521967862834"
              target="_blank" rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#20bd5a]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Falar no WhatsApp
            </a>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

export function AccountPageHeader({
  title, description, icon: Icon, action,
}: { title: string; description?: string; icon?: React.ComponentType<{ className?: string }>; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: import("@/data/colors-mock-account").ColorsOrderStatus }) {
  const map: Record<string, string> = {
    pending_payment: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    paid: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    preparing: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
    shipped: "bg-indigo-500/15 text-indigo-300 ring-indigo-400/30",
    in_transit: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
    out_for_delivery: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
    delivered: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    cancelled: "bg-red-500/15 text-red-300 ring-red-400/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1", map[status])}>
      {(status === "pending_payment" && "Aguardando pagamento")
        || (status === "paid" && "Pagamento aprovado")
        || (status === "preparing" && "Em separação")
        || (status === "shipped" && "Postado")
        || (status === "in_transit" && "Em trânsito")
        || (status === "out_for_delivery" && "Saiu para entrega")
        || (status === "delivered" && "Entregue")
        || "Cancelado"}
    </span>
  );
}
