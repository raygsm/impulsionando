import { createFileRoute } from '@tanstack/react-router';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const TENANT_SLUG = 'anamadu';
const BUCKET = 'anamadu-products';

function extensionFrom(contentType: string, url: string) {
  if (/image\/png/i.test(contentType)) return 'png';
  if (/image\/webp/i.test(contentType)) return 'webp';
  if (/image\/jpe?g/i.test(contentType)) return 'jpg';
  const match = url.match(/\.(png|webp|jpe?g)(?:\?|$)/i)?.[1]?.toLowerCase();
  return match === 'jpeg' ? 'jpg' : match || 'jpg';
}

async function companyId() {
  const { data } = await (supabaseAdmin as any)
    .from('communication_tenants')
    .select('company_id')
    .eq('slug', TENANT_SLUG)
    .eq('active', true)
    .maybeSingle();
  return data?.company_id as string | undefined;
}

async function migrateUrl(url: string, keyPrefix: string) {
  if (!/^https:\/\//i.test(url)) return url;
  if (url.includes(`/storage/v1/object/public/${BUCKET}/`)) return url;

  const response = await fetch(url, {
    headers: { 'user-agent': 'Impulsionando-AnaMadu-MediaMigration/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`media_fetch_failed:${response.status}`);

  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  if (!/^image\/(?:jpeg|jpg|png|webp)/i.test(contentType)) throw new Error('invalid_media_type');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('invalid_media_size');

  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 24);
  const ext = extensionFrom(contentType, url);
  const path = `${keyPrefix}/${digest}.${ext}`;

  const { error } = await (supabaseAdmin as any).storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true, cacheControl: '31536000' });
  if (error) throw error;

  const { data } = (supabaseAdmin as any).storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl as string;
}

export const Route = createFileRoute('/api/anamadu/media-migrate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.ANAMADU_MIGRATION_TOKEN ?? '';
        const supplied = request.headers.get('x-anamadu-migration-token') ?? '';
        if (!expected || supplied !== expected) return Response.json({ error: 'unauthorized' }, { status: 401 });

        const cid = await companyId();
        if (!cid) return Response.json({ error: 'tenant_not_provisioned' }, { status: 503 });

        const { data: products, error } = await (supabaseAdmin as any)
          .from('core_products')
          .select('id,image_url,metadata')
          .eq('company_id', cid)
          .eq('brand', 'Ana Madú')
          .eq('active', true);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let migrated = 0;
        let skipped = 0;
        let failed = 0;

        for (const product of products ?? []) {
          const current = String(product.image_url ?? '');
          if (!current || current.includes(`/storage/v1/object/public/${BUCKET}/`)) {
            skipped += 1;
            continue;
          }
          try {
            const next = await migrateUrl(current, `products/${product.id}`);
            await (supabaseAdmin as any)
              .from('core_products')
              .update({
                image_url: next,
                metadata: { ...(product.metadata ?? {}), media_migrated: true, media_migrated_at: new Date().toISOString() },
              })
              .eq('id', product.id)
              .eq('company_id', cid);
            migrated += 1;
          } catch {
            failed += 1;
          }
        }

        return Response.json({ ok: failed === 0, migrated, skipped, failed, total: products?.length ?? 0 });
      },
    },
  },
});
