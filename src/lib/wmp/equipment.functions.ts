import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function tenantId(s:any){
  const{data,error}=await s.from('communication_tenants').select('id').eq('slug','wmp').eq('active',true).single()
  if(error)throw error
  return data.id as string
}

async function equipmentCategory(s:any, code:string){
  const {data,error}=await s.from('reference_option_sets').select('id').eq('key','wmp_equipment_categories').eq('active',true).single()
  if(error||!data?.id)throw new Error('Catálogo de categorias WMP indisponível.')
  const {data:option,error:optionError}=await s.from('reference_options').select('code,label').eq('set_id',data.id).eq('code',code).eq('active',true).maybeSingle()
  if(optionError)throw optionError
  if(!option)throw new Error('Categoria de equipamento inválida. Selecione uma opção do catálogo.')
  return option
}

export const listWmpEquipmentReferenceData=createServerFn({method:'POST'})
  .middleware([requireSupabaseAuth])
  .inputValidator((d:any={})=>z.object({category:z.string().max(80).optional(),manufacturer_id:z.string().uuid().optional()}).parse(d))
  .handler(async({data,context})=>{
    const t=await tenantId(context.supabase)
    const {data:set,error:setError}=await context.supabase.from('reference_option_sets').select('id').eq('key','wmp_equipment_categories').single()
    if(setError)throw setError
    const [{data:categories,error:categoriesError},{data:manufacturers,error:manufacturersError}]=await Promise.all([
      context.supabase.from('reference_options').select('code,label,sort_order').eq('set_id',set.id).eq('active',true).order('sort_order').order('label'),
      context.supabase.from('wmp_equipment_manufacturers').select('id,name,website').eq('tenant_id',t).eq('active',true).order('name'),
    ])
    if(categoriesError)throw categoriesError
    if(manufacturersError)throw manufacturersError
    let modelsQuery=context.supabase.from('wmp_equipment_models').select('id,manufacturer_id,category,product_line,model,submodel,specifications,reference_url').eq('tenant_id',t).eq('active',true).order('model').limit(1000)
    if(data.category)modelsQuery=modelsQuery.eq('category',data.category)
    if(data.manufacturer_id)modelsQuery=modelsQuery.eq('manufacturer_id',data.manufacturer_id)
    const {data:models,error:modelsError}=await modelsQuery
    if(modelsError)throw modelsError
    return{categories:categories??[],manufacturers:manufacturers??[],models:models??[]}
  })

export const requestWmpEquipmentReference=createServerFn({method:'POST'})
  .middleware([requireSupabaseAuth])
  .inputValidator((d:any)=>z.object({request_type:z.enum(['MANUFACTURER','MODEL']),requested_name:z.string().trim().min(2).max(160),manufacturer_id:z.string().uuid().optional(),category:z.string().max(80).optional(),reference_url:z.string().url().max(500).optional()}).parse(d))
  .handler(async({data,context})=>{
    const t=await tenantId(context.supabase)
    if(data.category)await equipmentCategory(context.supabase,data.category)
    const {data:row,error}=await context.supabase.from('wmp_equipment_reference_requests').insert({tenant_id:t,...data,requested_by:context.user.id,status:'PENDING'}).select('id,status,created_at').single()
    if(error)throw error
    return row
  })

export const searchWmpEquipment=createServerFn({method:'POST'})
  .middleware([requireSupabaseAuth])
  .inputValidator((d:any={})=>z.object({q:z.string().max(120).optional(),category:z.string().max(80).optional(),limit:z.number().int().min(1).max(200).optional()}).parse(d))
  .handler(async({data,context})=>{
    const t=await tenantId(context.supabase)
    let q=context.supabase.from('wmp_equipment_catalog').select('id,code,category,name,manufacturer_id,model_id,manufacturer,model,quantity_available,internal_cost_cents,commercial_value_cents,status,owner_type,owner_name,beneficiary_kind').eq('tenant_id',t).order('category').order('name').limit(data.limit??200)
    if(data.category)q=q.eq('category',data.category)
    if(data.q)q=q.or(`name.ilike.%${data.q}%,manufacturer.ilike.%${data.q}%,model.ilike.%${data.q}%`)
    const{data:rows,error}=await q
    if(error)throw error
    return rows??[]
  })

export const saveWmpEquipment=createServerFn({method:'POST'})
  .middleware([requireSupabaseAuth])
  .inputValidator((d:any)=>z.object({
    id:z.string().uuid().optional(),code:z.string().trim().min(2).max(80),category:z.string().trim().min(2).max(80),name:z.string().trim().min(2).max(160).optional(),
    manufacturer_id:z.string().uuid().optional(),model_id:z.string().uuid().optional(),quantity_available:z.number().int().min(0),internal_cost_cents:z.number().int().min(0),commercial_value_cents:z.number().int().min(0),owner_type:z.enum(['WMP','DJ','PARTNER','THIRD_PARTY']),owner_name:z.string().trim().max(160).optional(),status:z.enum(['AVAILABLE','UNAVAILABLE','MAINTENANCE'])
  }).parse(d))
  .handler(async({data,context})=>{
    const t=await tenantId(context.supabase)
    const category=await equipmentCategory(context.supabase,data.category)

    let manufacturer:any=null
    if(data.manufacturer_id){
      const {data:row,error}=await context.supabase.from('wmp_equipment_manufacturers').select('id,name').eq('tenant_id',t).eq('id',data.manufacturer_id).eq('active',true).maybeSingle()
      if(error)throw error
      if(!row)throw new Error('Fabricante inválido. Selecione um fabricante cadastrado.')
      manufacturer=row
    }

    let model:any=null
    if(data.model_id){
      const {data:row,error}=await context.supabase.from('wmp_equipment_models').select('id,manufacturer_id,category,product_line,model,submodel').eq('tenant_id',t).eq('id',data.model_id).eq('active',true).maybeSingle()
      if(error)throw error
      if(!row)throw new Error('Modelo inválido. Selecione um modelo cadastrado.')
      if(row.category!==data.category)throw new Error('O modelo selecionado não pertence à categoria informada.')
      if(data.manufacturer_id&&row.manufacturer_id!==data.manufacturer_id)throw new Error('O modelo selecionado não pertence ao fabricante informado.')
      model=row
      if(!manufacturer&&row.manufacturer_id){
        const {data:m,error:mError}=await context.supabase.from('wmp_equipment_manufacturers').select('id,name').eq('tenant_id',t).eq('id',row.manufacturer_id).eq('active',true).single()
        if(mError)throw mError
        manufacturer=m
      }
    }

    const canonicalName=data.name || [manufacturer?.name,model?.model,model?.submodel].filter(Boolean).join(' ') || category.label
    const payload={tenant_id:t,code:data.code.toUpperCase(),category:data.category,name:canonicalName,manufacturer_id:manufacturer?.id??null,model_id:model?.id??null,manufacturer:manufacturer?.name??null,product_line:model?.product_line??null,model:model?.model??null,submodel:model?.submodel??null,quantity_available:data.quantity_available,internal_cost_cents:data.internal_cost_cents,commercial_value_cents:data.commercial_value_cents,owner_type:data.owner_type,owner_name:data.owner_name||null,status:data.status,beneficiary_kind:data.owner_type==='DJ'?'DJ':data.owner_type==='WMP'?'WMP':'OWNER',source_type:'CATALOG'}
    if(data.id){
      const{data:row,error}=await context.supabase.from('wmp_equipment_catalog').update(payload).eq('tenant_id',t).eq('id',data.id).select().single()
      if(error)throw error
      return row
    }
    const{data:row,error}=await context.supabase.from('wmp_equipment_catalog').insert(payload).select().single()
    if(error)throw error
    return row
  })

export const listWmpEquipmentRentals=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const t=await tenantId(context.supabase);const{data,error}=await context.supabase.from('wmp_equipment_rentals').select('id,equipment_id,proposal_id,dj_booking_id,quantity,unit_rental_cents,status,owner_type,owner_name,created_at,wmp_equipment_catalog(name,code,category)').eq('tenant_id',t).order('created_at',{ascending:false}).limit(200);if(error)throw error;return data??[]})
export const listWmpRentalPayouts=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{const t=await tenantId(context.supabase);const{data,error}=await context.supabase.from('wmp_equipment_rental_payouts').select('id,rental_id,beneficiary_type,beneficiary_name,amount_cents,status,paid_at,created_at').eq('tenant_id',t).order('created_at',{ascending:false}).limit(200);if(error)throw error;return data??[]})
