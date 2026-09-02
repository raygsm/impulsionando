import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

async function getGrupoSmartCompanyId(supabase: any) {
  const { data, error } = await supabase.from('communication_tenants').select('company_id').eq('slug', 'grupo-smart').eq('active', true).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  if (!data?.company_id) throw new Error('Grupo Smart não encontrado no Core Impulsionando');
  return data.company_id as string;
}

export const getGrupoSmartDashboard = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { supabase } = context as any;
  const companyId = await getGrupoSmartCompanyId(supabase);
  const [leadsQ, activitiesQ, journeysQ, agentQ] = await Promise.all([
    supabase.from('gruposmart_leads').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(250),
    supabase.from('gruposmart_activities').select('*').eq('company_id', companyId).order('scheduled_at', { ascending: true }).limit(250),
    supabase.from('gruposmart_journeys').select('*').eq('company_id', companyId).order('name', { ascending: true }).limit(100),
    supabase.from('gruposmart_agent_events').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50),
  ]);
  for (const result of [leadsQ, activitiesQ, journeysQ, agentQ]) if (result.error) throw new Error(result.error.message);
  const rows = leadsQ.data ?? [];
  const metrics = {
    total: rows.length,
    wizmart: rows.filter((x:any)=>x.vertical==='wizmart'||x.vertical==='both').length,
    smartCafe: rows.filter((x:any)=>x.vertical==='smart_cafe'||x.vertical==='both').length,
    qualified: rows.filter((x:any)=>['qualified','meeting','visit','proposal','negotiation'].includes(x.stage)).length,
    won: rows.filter((x:any)=>x.stage==='won').length,
    crossSell: rows.filter((x:any)=>x.cross_sell_eligible).length,
    journeys: (journeysQ.data ?? []).filter((x:any)=>x.active).length,
    agentEvents: (agentQ.data ?? []).length,
  };
  return { metrics, leads: rows, activities: activitiesQ.data ?? [], journeys: journeysQ.data ?? [], agentEvents: agentQ.data ?? [], environment: 'demo' as const };
});

const leadInput = z.object({
  id: z.string().uuid().optional(), company_name: z.string().min(2).max(180), contact_name: z.string().max(160).optional().nullable(),
  email: z.string().email().optional().nullable(), phone: z.string().max(40).optional().nullable(), city: z.string().max(100).optional().nullable(), state: z.string().max(40).optional().nullable(),
  vertical: z.enum(['wizmart','smart_cafe','both','undetermined']).default('undetermined'), source: z.string().max(80).default('outbound'),
  stage: z.enum(['new','contacting','qualified','meeting','visit','proposal','negotiation','won','lost']).default('new'),
  employee_count: z.coerce.number().int().min(0).optional().nullable(), monthly_flow: z.coerce.number().int().min(0).optional().nullable(), notes: z.string().max(4000).optional().nullable(),
  cross_sell_eligible: z.boolean().default(false), owner_user_id: z.string().uuid().optional().nullable(),
});

export const saveGrupoSmartLead = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>leadInput.parse(i)).handler(async ({ data, context }) => {
  const { supabase, userId } = context as any; const companyId = await getGrupoSmartCompanyId(supabase);
  const payload = { ...data, company_id: companyId, updated_at: new Date().toISOString(), created_by: userId, metadata: { demo: true } } as any;
  if (data.id) { const { id, ...changes } = payload; delete changes.created_by; const { error } = await supabase.from('gruposmart_leads').update(changes).eq('id', id).eq('company_id', companyId); if (error) throw new Error(error.message); return { id }; }
  const { data: row, error } = await supabase.from('gruposmart_leads').insert(payload).select('id').single(); if (error) throw new Error(error.message); return { id: row.id };
});

export const moveGrupoSmartLead = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>z.object({ id:z.string().uuid(), stage:z.enum(['new','contacting','qualified','meeting','visit','proposal','negotiation','won','lost']) }).parse(i)).handler(async ({ data, context })=>{
  const { supabase }=context as any; const companyId=await getGrupoSmartCompanyId(supabase);
  if (['proposal','negotiation','won'].includes(data.stage)) {
    const { data: visit, error: visitError } = await supabase.from('gruposmart_activities').select('id').eq('company_id',companyId).eq('lead_id',data.id).eq('type','field_visit').eq('status','done').limit(1).maybeSingle();
    if (visitError) throw new Error(visitError.message);
    if (!visit) throw new Error('Visita presencial obrigatória deve ser concluída antes de proposta, negociação ou fechamento.');
  }
  const { error }=await supabase.from('gruposmart_leads').update({ stage:data.stage, updated_at:new Date().toISOString() }).eq('id',data.id).eq('company_id',companyId); if(error) throw new Error(error.message); return {ok:true};
});

export const scheduleGrupoSmartActivity = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator((i:unknown)=>z.object({ lead_id:z.string().uuid(), type:z.enum(['call','online_meeting','field_visit','follow_up','proposal','task']), scheduled_at:z.string(), title:z.string().min(2).max(180), notes:z.string().max(2000).optional().nullable() }).parse(i)).handler(async({data,context})=>{
  const {supabase,userId}=context as any; const companyId=await getGrupoSmartCompanyId(supabase); const {error}=await supabase.from('gruposmart_activities').insert({...data,company_id:companyId,owner_user_id:userId,status:'scheduled',metadata:{demo:true}}); if(error) throw new Error(error.message); return {ok:true};
});
