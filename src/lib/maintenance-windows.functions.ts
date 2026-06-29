import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).nullable().optional(),
  scope: z.string().min(1).max(80).default('platform'),
  url: z.string().url().nullable().optional(),
  severity: z.enum(['info', 'minor', 'major']).default('info'),
  starts_at: z.string().min(10),
  ends_at: z.string().min(10),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  published: z.boolean().default(true),
})

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' })
  if (!data) throw new Error('Forbidden')
}

export const listMaintenanceWindows = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('core_maintenance_windows')
      .select('*')
      .order('starts_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return { items: data ?? [] }
  })

export const upsertMaintenanceWindow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const payload = { ...data, created_by: context.userId }
    if (data.id) {
      const { id, ...rest } = payload
      const { data: row, error } = await context.supabase
        .from('core_maintenance_windows')
        .update(rest)
        .eq('id', id!)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return row
    }
    const { data: row, error } = await context.supabase
      .from('core_maintenance_windows')
      .insert(payload)
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return row
  })

export const deleteMaintenanceWindow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase.from('core_maintenance_windows').delete().eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })
