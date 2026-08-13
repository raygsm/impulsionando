import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FileText, Plus, RefreshCw } from 'lucide-react'
import { listWmpProposals } from '@/lib/wmp/proposals.functions'

export const Route = createFileRoute('/_authenticated/wmp/propostas')({ component: WmpProposalsPage })

type ProposalRow = { id:string; proposal_number:string; status:string; current_version:number; title:string; commercial_summary:Record<string,unknown>; created_at:string }

function WmpProposalsPage() {
  const [rows,setRows]=useState<ProposalRow[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null)
  async function load(){setLoading(true);setError(null);try{setRows((await listWmpProposals({data:{}})??[]) as ProposalRow[])}catch(e:any){setError(e?.message??'Falha ao carregar propostas.')}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])
  return <div className="mx-auto max-w-7xl p-6 space-y-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p><h1 className="text-3xl font-semibold tracking-tight">Propostas</h1><p className="mt-1 text-sm text-muted-foreground">Propostas comerciais, contratos, versões e acompanhamento comercial.</p></div><div className="flex gap-2"><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"><RefreshCw className="size-4"/>Atualizar</button><a href="/wmp/propostas/nova" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"><Plus className="size-4"/>Nova proposta</a></div></header>
    <nav className="flex flex-wrap gap-2 text-sm"><a href="/wmp/propostas" className="rounded-md border bg-muted px-3 py-2">Todas</a><a href="/wmp/propostas/enviadas" className="rounded-md border px-3 py-2">Enviadas</a><a href="/wmp/propostas/aceitas" className="rounded-md border px-3 py-2">Aceitas</a></nav>
    {error&&<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">{error}</div>}
    <section className="rounded-xl border bg-card"><div className="grid grid-cols-[1.2fr_2fr_1fr_1fr] gap-4 border-b px-5 py-3 text-xs font-medium uppercase text-muted-foreground"><span>Número</span><span>Proposta</span><span>Status</span><span>Versão</span></div>{loading?<div className="p-8 text-sm text-muted-foreground">Carregando propostas...</div>:rows.length===0?<div className="flex flex-col items-center gap-3 p-12 text-center"><FileText className="size-10 text-muted-foreground"/><div><p className="font-medium">Nenhuma proposta encontrada</p><p className="text-sm text-muted-foreground">Crie a primeira proposta pelo novo motor WMP.</p></div></div>:rows.map(row=><a key={row.id} href={`/wmp/propostas/${row.id}`} className="grid grid-cols-[1.2fr_2fr_1fr_1fr] gap-4 border-b px-5 py-4 text-sm hover:bg-muted/40 last:border-0"><span className="font-mono text-xs">{row.proposal_number}</span><span className="font-medium">{row.title}</span><span>{row.status}</span><span>V{row.current_version}</span></a>)}</section>
  </div>
}
