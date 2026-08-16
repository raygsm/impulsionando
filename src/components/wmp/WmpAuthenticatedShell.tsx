import { Link, useNavigate } from '@tanstack/react-router'
import { KeyRound, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'

const NAV = [
  { label: 'Visão geral', to: '/dashboard' },
  { label: 'Agenda Wagner', to: '/wmp/agenda' },
  { label: 'Propostas', to: '/wmp/propostas' },
  { label: 'CRM e clientes', to: '/wmp/operacao?area=crm' },
  { label: 'Agenda e eventos', to: '/wmp/operacao?area=agenda' },
  { label: 'DJs e parceiros', to: '/wmp/operacao?area=djs' },
  { label: 'Equipamentos', to: '/wmp/operacao?area=equip' },
  { label: 'Financeiro', to: '/wmp/operacao?area=finance' },
  { label: 'Milito', to: '/wmp/operacao?area=millito' },
] as const

export function WmpAuthenticatedShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#f7f3fb] text-[#24112f]">
      <header className="sticky top-0 z-40 border-b border-[#decbe9] bg-[#2a1238] text-white shadow-sm">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9b66f]/50 bg-white/10 font-bold text-[#f4cf87]">W</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-[0.16em] text-[#f4cf87]">WMP</p>
              <p className="truncate text-xs text-white/70">Wagner Miller Produções</p>
            </div>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Gestão WMP">
            {NAV.map((item) => (
              <a key={item.label} href={item.to} className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">{item.label}</a>
            ))}
          </nav>
          <a href="/seguranca/senha" className="ml-auto hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white xl:inline-flex">
            <KeyRound className="mr-2 h-4 w-4" /> Alterar senha
          </a>
          <Button variant="ghost" size="sm" onClick={signOut} className="hidden text-white hover:bg-white/10 hover:text-white xl:inline-flex">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
          <Button variant="ghost" size="icon" className="ml-auto text-white hover:bg-white/10 hover:text-white xl:hidden" onClick={() => setOpen((v) => !v)} aria-label="Abrir menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {open && (
          <div className="border-t border-white/10 bg-[#2a1238] px-4 pb-4 xl:hidden">
            <nav className="mx-auto grid max-w-[1500px] gap-1 pt-3" aria-label="Gestão WMP móvel">
              {NAV.map((item) => (
                <a key={item.label} href={item.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">{item.label}</a>
              ))}
              <a href="/seguranca/senha" onClick={() => setOpen(false)} className="mt-2 flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
                <KeyRound className="mr-2 h-4 w-4" /> Alterar senha
              </a>
              <button type="button" onClick={signOut} className="flex items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#f4cf87] hover:bg-white/10">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </button>
            </nav>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  )
}
