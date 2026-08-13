import { useMemo } from 'react'
import { validateBrazilFiscalId } from '@/lib/wmp/fiscal-id'

export function FiscalIdField({type,value,onChange}:{type:'CPF'|'CNPJ';value:string;onChange:(v:string)=>void}){
  const valid=useMemo(()=>value.length>0&&validateBrazilFiscalId(value,type),[value,type])
  return <label className="grid gap-1 text-sm"><span>{type} *</span><input value={value} onChange={e=>onChange(e.target.value)} required className="rounded-md border px-3 py-2" placeholder={type==='CPF'?'000.000.000-00':'CNPJ numérico ou alfanumérico'}/>{value&&<span className={valid?'text-emerald-600':'text-destructive'}>{valid?'Documento válido':'Documento inválido'}</span>}</label>
}
