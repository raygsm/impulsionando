import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { CalendarDays, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export const Route = createFileRoute('/_authenticated/wmp/agenda')({ component: WmpAgendaPage })

async function wmpTenantId(context: any) {
  const { data, error } = await context.supabase.from('communication_tenants').select('id').eq('slug','wmp').eq('active',true).single()
  if (error) throw error
  return data.id as string
}

const listAgenda = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const tenantId = await wmpTenantId(context)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const { data, error } = await context.supabase.from('wmp_whereabouts_entries')
    .select('id,event_date,venue_name,venue_address,start_time,end_time,status,published_at,confirmed_at,source')
    .eq('tenant_id',tenantId).gte('event_date',today).neq('status','ARCHIVED')
    .order('event_date',{ascending:true}).order('start_time',{ascending:true})
  if (error) throw error
  return data ?? []
})

const saveAgenda = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d:{id?:string;event_date:string;venue_name:string;venue_address:string;start_time:string;end_time?:string})=>z.object({
    id:z.string().uuid().optional(),event_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),venue_name:z.string().trim().min(2).max(160),venue_address:z.string().trim().min(5).max(300),start_time:z.string().regex(/^\d{2}:\d{2}$/),end_time:z.string().regex(/^\d{2}:\d{2}$/).optional()
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tenantId = await wmpTenantId(context); const now=new Date().toISOString()
    const payload={tenant_id:tenantId,event_date:data.event_date,venue_name:data.venue_name,venue_address:data.venue_address,start_time:data.start_time,end_time:data.end_time||null,timezone:'America/Sao_Paulo',status:'PUBLISHED',source:'wagner_agenda',published_at:now,updated_at:now}
    if(data.id){const {error}=await context.supabase.from('wmp_whereabouts_entries').update(payload).eq('tenant_id',tenantId).eq('id',data.id);if(error)throw error;return {id:data.id}}
    const {data:row,error}=await context.supabase.from('wmp_whereabouts_entries').insert(payload).select('id').single();if(error)throw error;return row
  })

const cancelAgenda = createServerFn({method:'POST'}).middleware([requireSupabaseAuth])
  .inputValidator((d:{id:string})=>z.object({id:z.string().uuid()}).parse(d))
  .handler(async({data,context})=>{const tenantId=await wmpTenantId(context);const {error}=await context.supabase.from('wmp_whereabouts_entries').update({status:'CANCELLED',updated_at:new Date().toISOString()}).eq('tenant_id',tenantId).eq('id',data.id);if(error)throw error;return {ok:true}})

type Row={id:string;event_date:string;venue_name:string;venue_address:string;start_time:string;end_time:string|null;status:string;confirmed_at:string|null}

function WmpAgendaPage(){
 const [rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[editing,setEditing]=useState<Row|null>(null),[error,setError]=useState('')
 const [date,setDate]=useState(''),[venue,setVenue]=useState(''),[address,setAddress]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState('')
 async function load(){setLoading(true);setError('');try{setRows(await listAgenda({data:{}}) as Row[])}catch(e:any){setError(e?.message??'Falha ao carregar agenda.')}finally{setLoading(false)}}
 useEffect(()=>{void load()},[])
 function clear(){setEditing(null);setDate('');setVenue('');setAddress('');setStart('');setEnd('')}
 function edit(r:Row){setEditing(r);setDate(r.event_date);setVenue(r.venue_name);setAddress(r.venue_address);setStart(String(r.start_time).slice(0,5));setEnd(r.end_time?String(r.end_time).slice(0,5):'')}
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{await saveAgenda({data:{id:editing?.id,event_date:date,venue_name:venue,venue_address:address,start_time:start,end_time:end||undefined}});clear();await load()}catch(x:any){setError(x?.message??'Falha ao salvar.')}finally{setBusy(false)}}
 return <main className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
  <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p><h1 className="text-3xl font-semibold tracking-tight">Agenda Wagner Miller</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Cadastre apresentações futuras. Elas alimentam automaticamente o Onde Estou e servem de base para a confirmação diária do Milito.</p></div><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"><RefreshCw className="size-4"/>Atualizar</button></header>
  <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
   <form onSubmit={submit} className="h-fit rounded-xl border bg-card p-5 space-y-4"><div className="flex items-center gap-2"><Plus className="size-5"/><h2 className="font-semibold">{editing?'Editar evento':'Novo evento futuro'}</h2></div>
    <label className="block"><span className="text-sm font-medium">Data *</span><input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2"/></label>
    <label className="block"><span className="text-sm font-medium">Local *</span><input required value={venue} onChange={e=>setVenue(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2"/></label>
    <label className="block"><span className="text-sm font-medium">Endereço *</span><input required value={address} onChange={e=>setAddress(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2"/></label>
    <div className="grid grid-cols-2 gap-3"><label><span className="text-sm font-medium">Início *</span><input required type="time" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2"/></label><label><span className="text-sm font-medium">Fim</span><input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2"/></label></div>
    <div className="flex gap-2"><button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">{busy?'Salvando...':editing?'Salvar alteração':'Adicionar à agenda'}</button>{editing&&<button type="button" onClick={clear} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>}</div>
   </form>
   <div className="rounded-xl border bg-card"><div className="border-b p-4"><h2 className="font-semibold">Próximas apresentações</h2><p className="text-xs text-muted-foreground">O Milito validará cada dia antes ou no próprio dia por e-mail.</p></div>
    {loading?<div className="p-8 text-sm text-muted-foreground">Carregando agenda...</div>:rows.length===0?<div className="p-10 text-center"><CalendarDays className="mx-auto size-10 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">Nenhum evento futuro cadastrado.</p></div>:<div className="divide-y">{rows.map(r=><div key={r.id} className="grid gap-3 p-4 md:grid-cols-[110px_1.3fr_1.7fr_110px_auto]"><div><b>{new Date(`${r.event_date}T12:00:00-03:00`).toLocaleDateString('pt-BR')}</b><div className="text-xs text-muted-foreground">{String(r.start_time).slice(0,5)}{r.end_time?`–${String(r.end_time).slice(0,5)}`:''}</div></div><div><b>{r.venue_name}</b><div className="text-xs text-muted-foreground">{r.confirmed_at?'Confirmado':'A confirmar'}</div></div><div className="text-sm text-muted-foreground">{r.venue_address}</div><div className="text-xs">{r.status}</div><div className="flex gap-2"><button onClick={()=>edit(r)} className="rounded border px-2 py-1 text-xs">Editar</button><button onClick={()=>void cancelAgenda({data:{id:r.id}}).then(load)} className="rounded border px-2 py-1 text-xs"><Trash2 className="size-3"/></button></div></div>)}</div>}
   </div>
  </section>{error&&<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">{error}</div>}
 </main>
}
