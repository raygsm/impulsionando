import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';
const MERCADO_PAGO_LABEL = 'Em breve, Mercado Pago';

async function loadTenantPaymentState() {
  const { data: tenant, error } = await (supabaseAdmin as any)
    .from('communication_tenants')
    .select('id,company_id,settings')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();

  if (error || !tenant?.company_id) return null;

  const payments = tenant.settings?.payments ?? {};
  const pixEnabled = payments.pix === true && payments.pix_fallback === true;
  const pixKey = (process.env.ANAMADU_PIX_KEY ?? '').trim();
  const pixKeyType = (process.env.ANAMADU_PIX_KEY_TYPE ?? '').trim();
  const pixBeneficiary = (process.env.ANAMADU_PIX_BENEFICIARY ?? '').trim();

  return {
    tenant,
    payments,
    pixEnabled,
    pixConfigured: pixEnabled && Boolean(pixKey && pixKeyType && pixBeneficiary),
    pix: pixEnabled && pixKey && pixKeyType && pixBeneficiary
      ? { key: pixKey, keyType: pixKeyType, beneficiary: pixBeneficiary }
      : null,
  };
}

export const Route = createFileRoute('/api/anamadu/pix-order')({
  server: {
    handlers: {
      GET: async () => {
        const state = await loadTenantPaymentState();
        if (!state) {
          return Response.json({ ok: false, error: 'Ana Madú não provisionada no Core.' }, { status: 503 });
        }

        return Response.json({
          ok: true,
          pixEnabled: state.pixEnabled,
          pixConfigured: state.pixConfigured,
          pix: state.pixConfigured ? state.pix : null,
          mercadoPago: { enabled: false, label: MERCADO_PAGO_LABEL },
          commercePlatform: 'nuvemshop',
          checkoutPrimary: 'nuvemshop_checkout',
        }, {
          headers: {
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
          },
        });
      },

      POST: async () => {
        const state = await loadTenantPaymentState();
        if (!state) {
          return Response.json({ ok: false, error: 'Ana Madú não provisionada no Core.' }, { status: 503 });
        }

        if (!state.pixEnabled || !state.pixConfigured) {
          return Response.json({
            ok: false,
            error: 'PIX direto não está habilitado. Utilize o checkout oficial da Nuvemshop.',
            commercePlatform: 'nuvemshop',
            checkoutPrimary: 'nuvemshop_checkout',
            mercadoPago: { enabled: false, label: MERCADO_PAGO_LABEL },
          }, { status: 409 });
        }

        return Response.json({
          ok: false,
          error: 'Fluxo PIX manual temporariamente indisponível. Utilize o checkout oficial da Nuvemshop.',
          commercePlatform: 'nuvemshop',
          checkoutPrimary: 'nuvemshop_checkout',
          mercadoPago: { enabled: false, label: MERCADO_PAGO_LABEL },
        }, { status: 409 });
      },
    },
  },
});
