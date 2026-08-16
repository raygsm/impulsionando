import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Loader2, PackagePlus } from 'lucide-react'
import { listWmpEquipmentReferenceData, saveWmpEquipment } from '@/lib/wmp/equipment.functions'

export const Route = createFileRoute('/_authenticated/wmp/equipamentos/novo')({ component: WmpNewEquipmentPage })

type ReferenceData = { categories: any[]; manufacturers: any[]; models: any[] }
const toCents=(value:string)=>Math.round(Math.max(0,Number(value.replace(',','.'))||0)*100)

function WmpNewEquipmentPage(){
  const [refs,setRefs]=useState<ReferenceData>({categories:[],manufacturers:[],models:[]})
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [saved,setSaved]=useState<any>(null)
  const [form,setForm]=useState({code:'',category:'',name:'',manufacturer_id:'',model_id:'',quantity:'1',internal_cost:'0,00',commercial_value:'0,00',owner_type:'WMP',owner_name:'',status:'AVAILABLE'})

  useEffect(()=>{void listWmpEquipmentReferenceData({data:{}}).then((data:any)=>{setRefs(data);if(data.categories?.[0]?.code)setForm(f=>({...f,category:data.categories[0].code}))}).catch((e:any)=>setError(e?.message??'Falha ao carregar referências.')).finally(()=>setLoading(false))},[])
  const models=useMemo(()=>refs.models.filter((m:any)=>m.category===form.category&&(!form.manufacturer_id||m.manufacturer_id===form.manufacturer_id)),[refs.models,form.category,form.manufacturer_id])

  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError('');setSaved(null)
    try{
      const row:any=await saveWmpEquipment({data:{
        code:form.code.trim(),category:form.category,name:form.name.trim()||undefined,
        manufacturer_id:form.manufacturer_id||undefined,model_id:form.model_id||undefined,
        quantity_available:Math.max(0,Math.floor(Number(form.quantity)||0)),
        internal_cost_cents:toCents(form.internal_cost),commercial_value_cents:toCents(form.commercial_value),
        owner_type:form.owner_type as any,owner_name:form.owner_name.trim()||undefined,status:form.status as any,
      }})
      setSaved(row)
    }catch(e:any){setError(e?.message??'Não foi possível cadastrar o equipamento.')}
    finally{setBusy(false)}
  }

  return <main className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
    <a href="/wmp/equipamentos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/>Voltar ao catálogo</a>
    <header><p className="text-sm text-muted-foreground">WMP — Wagner Miller Produções</p><h1 className="text-3xl font-semibold tracking-tight">Cadastrar equipamento</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Cadastre apenas equipamentos reais. Fabricante e modelo usam referências canônicas; quando um modelo não existir, solicite curadoria na tela principal de equipamentos antes de vinculá-lo.</p></header>
    {loading?<div className="flex items-center gap-2 rounded-xl border p-6 text-sm"><Loader2 className="size-4 animate-spin"/>Carregando referências...</div>:<form onSubmit={submit} className="grid gap-4 rounded-xl border bg-card p-6 md:grid-cols-2">
      <Field label="Código interno *"><input required minLength={2} value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className="w-full rounded-md border bg-background px-3 py-2" placeholder="EX.: WMP-MIC-001"/></Field>
      <Field label="Categoria *"><select required value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value,model_id:''}))} className="w-full rounded-md border bg-background px-3 py-2">{refs.categories.map((c:any)=><option key={c.code} value={c.code}>{c.label}</option>)}</select></Field>
      <Field label="Nome operacional"><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Opcional; pode ser derivado da referência"/></Field>
      <Field label="Fabricante"><select value={form.manufacturer_id} onChange={e=>setForm(f=>({...f,manufacturer_id:e.target.value,model_id:''}))} className="w-full rounded-md border bg-background px-3 py-2"><option value="">Sem fabricante definido</option>{refs.manufacturers.map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
      <Field label="Modelo"><select value={form.model_id} onChange={e=>setForm(f=>({...f,model_id:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2"><option value="">Sem modelo definido</option>{models.map((m:any)=><option key={m.id} value={m.id}>{m.model}{m.submodel?` · ${m.submodel}`:''}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Se a lista estiver vazia, registre o item sem modelo ou solicite a inclusão canônica no catálogo.</p></Field>
      <Field label="Quantidade *"><input required type="number" min="0" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2"/></Field>
      <Field label="Custo interno (R$) *"><input required inputMode="decimal" value={form.internal_cost} onChange={e=>setForm(f=>({...f,internal_cost:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2"/></Field>
      <Field label="Valor de locação (R$) *"><input required inputMode="decimal" value={form.commercial_value} onChange={e=>setForm(f=>({...f,commercial_value:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2"/></Field>
      <Field label="Proprietário *"><select value={form.owner_type} onChange={e=>setForm(f=>({...f,owner_type:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2"><option value="WMP">WMP</option><option value="DJ">DJ</option><option value="PARTNER">Parceiro</option><option value="THIRD_PARTY">Terceiro</option></select></Field>
      <Field label="Nome do proprietário"><input value={form.owner_name} onChange={e=>setForm(f=>({...f,owner_name:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2" placeholder={form.owner_type==='WMP'?'WMP':'Nome do beneficiário/proprietário'}/></Field>
      <Field label="Status *"><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full rounded-md border bg-background px-3 py-2"><option value="AVAILABLE">Disponível</option><option value="UNAVAILABLE">Indisponível</option><option value="MAINTENANCE">Manutenção</option></select></Field>
      <div className="md:col-span-2 rounded-lg border bg-muted/30 p-4 text-sm"><b>Regra WMP:</b> equipamento e mão de obra são entidades separadas. Todo equipamento usado em evento é tratado como locação e o beneficiário decorre do proprietário informado.</div>
      {error&&<div className="md:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {saved&&<div className="md:col-span-2 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"><CheckCircle2 className="mt-0.5 size-5"/><div><b>Equipamento cadastrado.</b><div>{saved.code} — {saved.name}</div></div></div>}
      <div className="md:col-span-2 flex flex-wrap justify-end gap-3"><a href="/wmp/equipamentos" className="rounded-md border px-4 py-2 text-sm">Cancelar</a><button disabled={busy||!form.code.trim()||!form.category} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy?<Loader2 className="size-4 animate-spin"/>:<PackagePlus className="size-4"/>}{busy?'Salvando...':'Cadastrar equipamento'}</button></div>
    </form>}
  </main>
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>}
