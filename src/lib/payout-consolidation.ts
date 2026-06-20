// Lógica pura de consolidação — sem dependência de TanStack server runtime,
// para ser reaproveitada por server fns, cron route e testes.
export async function runConsolidation(
  supabase: any,
  args: { company_id?: string; period_start: string; period_end: string },
): Promise<{ batches: number; events: number; retained: number }> {
  let q = supabase
    .from('core_payout_events')
    .select('id, company_id, gross_cents, fee_cents, net_cents, model_id')
    .eq('status', 'approved')
    .is('ledger_id', null)
    .gte('occurred_at', args.period_start)
    .lt('occurred_at', args.period_end)
  if (args.company_id) q = q.eq('company_id', args.company_id)
  const { data: events, error } = await q
  if (error) throw error
  if (!events?.length) return { batches: 0, events: 0, retained: 0 }

  const groups = new Map<string, any[]>()
  for (const e of events) {
    const arr = groups.get(e.company_id) ?? []
    arr.push(e)
    groups.set(e.company_id, arr)
  }

  let batches = 0
  let retained = 0
  let totalEvents = 0

  for (const [company_id, group] of groups) {
    const { data: model } = await supabase
      .from('core_monetization_models')
      .select('id, min_payout_cents')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const gross = group.reduce((a: number, e: any) => a + (e.gross_cents ?? 0), 0)
    const fee = group.reduce((a: number, e: any) => a + (e.fee_cents ?? 0), 0)
    const net = group.reduce((a: number, e: any) => a + (e.net_cents ?? 0), 0)
    const min = model?.min_payout_cents ?? 0
    const isRetained = net > 0 && net < min

    const { data: existing } = await supabase
      .from('core_payout_ledger')
      .select('id')
      .eq('company_id', company_id)
      .eq('period_start', args.period_start)
      .eq('period_end', args.period_end)
      .maybeSingle()

    let ledger_id: string
    if (existing) {
      ledger_id = existing.id
      await supabase
        .from('core_payout_ledger')
        .update({
          gross_cents: gross,
          fee_cents: fee,
          net_cents: net,
          event_count: group.length,
          status: isRetained ? 'retained' : 'scheduled',
          retention_reason: isRetained ? `Abaixo do mínimo (${min} cents)` : null,
        })
        .eq('id', ledger_id)
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('core_payout_ledger')
        .insert({
          company_id,
          period_start: args.period_start,
          period_end: args.period_end,
          gross_cents: gross,
          fee_cents: fee,
          net_cents: net,
          event_count: group.length,
          status: isRetained ? 'retained' : 'scheduled',
          retention_reason: isRetained ? `Abaixo do mínimo (${min} cents)` : null,
        })
        .select('id')
        .single()
      if (insErr) throw insErr
      ledger_id = ins.id
    }

    await supabase
      .from('core_payout_events')
      .update({ ledger_id, status: 'consolidated' })
      .in('id', group.map((e: any) => e.id))

    batches += 1
    totalEvents += group.length
    if (isRetained) retained += 1
  }

  return { batches, events: totalEvents, retained }
}
