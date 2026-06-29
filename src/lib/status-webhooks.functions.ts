import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  })
  if (!data) throw new Error('Forbidden')
}

export const listStatusWebhooks = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { data, error } = await context.supabase
      .from('core_status_webhooks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return { items: data ?? [] }
  })

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(2).max(120),
  url: z.string().url().max(500),
  kind: z.enum(['slack', 'discord', 'generic']),
  secret: z.string().max(200).optional().nullable(),
  notify_incidents: z.boolean().default(true),
  notify_maintenance: z.boolean().default(true),
  services: z.array(z.string().max(80)).default([]),
  categories: z.array(z.string().max(80)).default([]),
  active: z.boolean().default(true),
})

export const upsertStatusWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const payload = {
      label: data.label,
      url: data.url,
      kind: data.kind,
      secret: data.secret || null,
      notify_incidents: data.notify_incidents,
      notify_maintenance: data.notify_maintenance,
      services: data.services,
      categories: data.categories,
      active: data.active,
      updated_at: new Date().toISOString(),
    }
    if (data.id) {
      const { error } = await context.supabase
        .from('core_status_webhooks')
        .update(payload)
        .eq('id', data.id)
      if (error) throw new Error(error.message)
      return { ok: true, id: data.id }
    }
    const { data: row, error } = await context.supabase
      .from('core_status_webhooks')
      .insert({ ...payload, created_by: context.userId })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, id: (row as any).id }
  })

export const deleteStatusWebhook = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { error } = await context.supabase
      .from('core_status_webhooks')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const listStatusWebhookDispatches = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ webhook_id: z.string().uuid(), limit: z.number().int().min(1).max(200).default(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { data: items, error } = await context.supabase
      .from('core_status_webhook_dispatches')
      .select('*')
      .eq('webhook_id', data.webhook_id)
      .order('created_at', { ascending: false })
      .limit(data.limit)
    if (error) throw new Error(error.message)
    return { items: items ?? [] }
  })

export const triggerStatusWebhooksTick = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const res = await fetch(
      'https://project--d5a31290-577c-4ca5-895e-72d4b8643439.lovable.app/api/public/hooks/status-webhooks',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    )
    return { ok: res.ok, status: res.status }
  })
