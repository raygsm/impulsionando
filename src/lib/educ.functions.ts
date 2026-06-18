import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const PoloInput = z.object({
  id: z.string().uuid().optional(),
  codigo: z.string().min(1).max(40),
  nome: z.string().min(2).max(200),
  cidade: z.string().max(120).optional(),
  estado: z.string().max(2).optional(),
  bairro: z.string().max(120).optional(),
  responsavel: z.string().max(160).optional(),
  telefone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['ativo', 'pausado', 'encerrado']).default('ativo'),
  cursos_ofertados: z.array(z.string()).default([]),
  capacidade: z.number().int().nonnegative().optional(),
  meta_matriculas_mes: z.number().int().nonnegative().optional(),
  observacoes: z.string().max(2000).optional(),
})

export const listPolos = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('educ_polos' as any)
      .select('*')
      .order('nome', { ascending: true })
    if (error) throw new Error(error.message)
    return { rows: (data ?? []) as any[] }
  })

export const upsertPolo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PoloInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, email: data.email || null }
    if (data.id) {
      const { error } = await context.supabase
        .from('educ_polos' as any)
        .update(payload)
        .eq('id', data.id)
      if (error) throw new Error(error.message)
      return { ok: true, id: data.id }
    }
    const { data: ins, error } = await context.supabase
      .from('educ_polos' as any)
      .insert(payload)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, id: (ins as any).id }
  })

export const deletePolo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('educ_polos' as any)
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

const AssignmentInput = z.object({
  user_id: z.string().uuid(),
  polo_id: z.string().uuid().nullable().optional(),
  role: z.enum(['mantenedora', 'polo', 'coordenador', 'consultor', 'aluno']),
})

export const assignEducRole = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AssignmentInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('educ_role_assignments' as any)
      .insert(data)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

// -------- Dashboard Educação --------

export const educDashboard = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context
    const [polosRes, leadsRes, matsRes] = await Promise.all([
      supabase.from('educ_polos' as any).select('id, nome, codigo, meta_matriculas_mes, status'),
      supabase
        .from('educ_leads' as any)
        .select('id, polo_id, stage, campanha, created_at, valor_estimado'),
      supabase
        .from('educ_matriculas' as any)
        .select(
          'id, polo_id, status, status_financeiro, valor_mensalidade, matriculado_em, evasao_em, curso',
        ),
    ])
    if (polosRes.error) throw new Error(polosRes.error.message)
    if (leadsRes.error) throw new Error(leadsRes.error.message)
    if (matsRes.error) throw new Error(matsRes.error.message)
    const polos = (polosRes.data ?? []) as any[]
    const leads = (leadsRes.data ?? []) as any[]
    const mats = (matsRes.data ?? []) as any[]

    const totalLeads = leads.length
    const totalMatriculas = mats.length
    const ativos = mats.filter((m) => m.status === 'ativo').length
    const evasao = mats.filter((m) => m.evasao_em).length
    const inadimplentes = mats.filter((m) => m.status_financeiro === 'inadimplente').length
    const receitaMes = mats
      .filter((m) => m.status === 'ativo' && m.status_financeiro !== 'inadimplente')
      .reduce((s, m) => s + Number(m.valor_mensalidade ?? 0), 0)
    const inadimplenciaValor = mats
      .filter((m) => m.status_financeiro === 'inadimplente')
      .reduce((s, m) => s + Number(m.valor_mensalidade ?? 0), 0)
    const conversao = totalLeads ? totalMatriculas / totalLeads : 0

    const byCampanha = new Map<string, { leads: number; matriculas: number; receita: number }>()
    for (const l of leads) {
      const k = l.campanha ?? '(sem campanha)'
      const e = byCampanha.get(k) ?? { leads: 0, matriculas: 0, receita: 0 }
      e.leads += 1
      byCampanha.set(k, e)
    }

    const byPolo = polos.map((p) => {
      const polLeads = leads.filter((l) => l.polo_id === p.id).length
      const polMats = mats.filter((m) => m.polo_id === p.id)
      const polReceita = polMats
        .filter((m) => m.status === 'ativo' && m.status_financeiro !== 'inadimplente')
        .reduce((s, m) => s + Number(m.valor_mensalidade ?? 0), 0)
      const polEvasao = polMats.filter((m) => m.evasao_em).length
      const conv = polLeads ? polMats.length / polLeads : 0
      const meta = p.meta_matriculas_mes ?? 0
      const acimaMeta = meta > 0 && polMats.length >= meta
      return {
        polo_id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        meta,
        leads: polLeads,
        matriculas: polMats.length,
        receita: polReceita,
        evasao: polEvasao,
        conversao: conv,
        acima_meta: acimaMeta,
      }
    })

    const ranking = [...byPolo].sort((a, b) => b.matriculas - a.matriculas)

    const cursosCount = new Map<string, number>()
    for (const m of mats) cursosCount.set(m.curso, (cursosCount.get(m.curso) ?? 0) + 1)
    const cursosTop = [...cursosCount.entries()]
      .map(([curso, count]) => ({ curso, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      kpis: {
        totalLeads,
        totalMatriculas,
        ativos,
        evasao,
        inadimplentes,
        receitaMes,
        inadimplenciaValor,
        conversao,
      },
      polos: byPolo,
      ranking,
      campanhas: [...byCampanha.entries()].map(([campanha, v]) => ({ campanha, ...v })),
      cursosTop,
    }
  })
