import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';

export const Route = createFileRoute('/api/anamadu/health')({
  server: {
    handlers: {
      GET: async () => {
        const openaiConfigured = Boolean(process.env.ANAMADU_OPENAI_API_KEY?.trim());

        const { data: tenant } = await (supabaseAdmin as any)
          .from('communication_tenants')
          .select('id,company_id,active')
          .eq('slug', TENANT_SLUG)
          .eq('active', true)
          .maybeSingle();

        const companyId = tenant?.company_id as string | undefined;
        let productCount = 0;
        let migratedMediaCount = 0;
        let channels: any[] = [];

        if (companyId) {
          const { count } = await (supabaseAdmin as any)
            .from('core_products')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('brand', 'Ana Madú')
            .eq('active', true);
          productCount = count ?? 0;

          const { count: mediaCount } = await (supabaseAdmin as any)
            .from('core_products')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('brand', 'Ana Madú')
            .eq('active', true)
            .like('image_url', '%/storage/v1/object/public/anamadu-products/%');
          migratedMediaCount = mediaCount ?? 0;

          const { data: endpointRows } = await (supabaseAdmin as any)
            .from('communication_channel_endpoints')
            .select('channel,status,provider,display_address,last_healthcheck_at,last_error')
            .eq('tenant_id', tenant.id)
            .order('channel');
          channels = endpointRows ?? [];
        }

        const webChatActive = channels.some((c) => c.channel === 'web_chat' && c.status === 'ACTIVE');
        const whatsappActive = channels.some((c) => c.channel === 'whatsapp' && c.status === 'ACTIVE');
        const instagramActive = channels.some((c) => c.channel === 'instagram' && c.status === 'ACTIVE');

        const ready = Boolean(tenant?.active && openaiConfigured && productCount > 0 && webChatActive);

        return Response.json({
          ok: ready,
          tenant: Boolean(tenant?.active),
          openaiConfigured,
          openaiCredentialScope: 'client_specific',
          openaiCredentialName: 'Impulsionando — Ana Madú — Annita',
          catalog: {
            source: 'impulsionando_core',
            productCount,
            migratedMediaCount,
            independentFromLegacyStore: productCount > 0,
          },
          channels: {
            webChat: webChatActive,
            whatsapp: whatsappActive,
            instagram: instagramActive,
            details: channels,
          },
        }, {
          status: ready ? 200 : 503,
          headers: {
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
          },
        });
      },
    },
  },
});
