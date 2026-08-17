import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';

function clean(value: unknown, max = 2000) {
  return String(value ?? '').trim().slice(0, max);
}

export const Route = createFileRoute('/api/anamadu/ourives-request')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null) as {
          conversationId?: string;
          externalUserId?: string;
          attribution?: Record<string, unknown>;
          brief?: {
            piece?: string;
            style?: string;
            stone?: string;
            metal?: string;
            notes?: string;
            refs?: string[];
          };
          approved?: boolean;
        } | null;

        if (!body?.approved) return Response.json({ ok: false, error: 'brief_not_approved' }, { status: 400 });

        const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
          .from('communication_tenants')
          .select('id,company_id')
          .eq('slug', TENANT_SLUG)
          .eq('active', true)
          .maybeSingle();

        if (tenantError || !tenant?.company_id) {
          return Response.json({ ok: false, error: 'tenant_unavailable' }, { status: 503 });
        }

        const refs = Array.isArray(body.brief?.refs) ? body.brief!.refs.slice(0, 10) : [];
        const brief = {
          piece: clean(body.brief?.piece, 120),
          style: clean(body.brief?.style, 240),
          stone: clean(body.brief?.stone, 240),
          metal: clean(body.brief?.metal, 240),
          notes: clean(body.brief?.notes, 2000),
          refs,
        };

        const { data, error } = await (supabaseAdmin as any)
          .from('anamadu_ourives_requests')
          .insert({
            tenant_id: tenant.id,
            company_id: tenant.company_id,
            conversation_id: body.conversationId || null,
            external_user_id: clean(body.externalUserId, 240) || null,
            status: 'brief_approved',
            piece_type: brief.piece || null,
            style: brief.style || null,
            stone_reference: brief.stone || null,
            metal_finish: brief.metal || null,
            notes: brief.notes || null,
            reference_image_count: refs.length,
            brief,
            attribution: body.attribution ?? {},
            approved_by_customer: true,
            approved_at: new Date().toISOString(),
          })
          .select('id,status,created_at')
          .single();

        if (error || !data) return Response.json({ ok: false, error: error?.message ?? 'insert_failed' }, { status: 500 });

        return Response.json({ ok: true, request: data });
      },
    },
  },
});
