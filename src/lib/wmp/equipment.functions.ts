import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function tenantId(supabase:any){const {data,error}=await supabase.from('communication_tenants').select('id').eq('slug','wmp').single();if(error)throw error;return data.id as string}

export const searchWmpEquipment=createServerFn({method:'POST'})
  .middleware([requireSupabaseAuth])
  .inputValidator((d:{q?:string;category?:string;manufacturer?:string;limit?:number}={})=>z.object({q:z.string().max(120).optional(),category:z.string().max(80).optional(),manufacturer:z.string().max(120).optional(),limit:z.number().int().min(1).max(100).optional()}).parse(d))
  .handler(async({data,context})=>{const t=await tenantId(context.supabase);let q=context.supabase.from('wmp_equipment_catalog').select('id,code,category,name,manufacturer,product_line,model,submodel,specifications,image_url,quantity_available,commercial_value_cents,status').eq('tenant_id',t).eq('status','ACTIVE').limit(data.limit??50);if(data.category)q=q.eq('category',data.category);if(data.manufacturer)q=q.eq('manufacturer',data.manufacturer);if(data.q)q=q.or(`name.ilike.%${data.q}%,manufacturer.ilike.%${data.q}%,model.ilike.%${data.q}%,submodel.ilike.%${data.q}%`);const {data:rows,error}=await q;if(error)throw error;return rows??[]})
