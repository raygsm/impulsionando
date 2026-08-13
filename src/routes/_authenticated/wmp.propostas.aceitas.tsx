import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { listWmpProposals } from '@/lib/wmp/proposals.functions'

export const Route = createFileRoute('/_authenticated/wmp/propostas/aceitas')({ component: Page })

function Page() {
  const [rows,setRows] = useState<any[]>([])
  useEffect(() => { listWmpProposals({data:{}}).then((r:any) => setRows((r ?? []).filter((x:any) => ['ACCEPTED','SIGNED','WON'].includes(x.status)))) },[])
  return <div className="mx-auto max-w-7xl p-6 space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-semibold">Propostas aceitas</h1><p className="text-sm text-muted-foreground">Aceitas, assinadas e fechadas como ganho.</p></div><a href="/wmp/propostas/nova" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Nova proposta</a></div>
    <div className="rounded-xl border bg-card">{rows.map((r:any)=><a key={r.id} href={`/wmp/propostas/${r.id}`} className="grid grid-cols-[1.2fr_2fr_1fr] gap-4 border-b px-5 py-4 text-sm last:border-0"><span className="font-mono text-xs">{r.proposal_number}</span><span>{r.title}</span><span>{r.status}</span></a>)}</div>
  </div>
}
