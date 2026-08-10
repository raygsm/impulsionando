import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

if (!url || !publishableKey || !serviceKey) throw new Error('Supabase CI credentials are required');
const anonymous = createClient(url, publishableKey, { auth: { persistSession: false } });
const service = createClient(url, serviceKey, { auth: { persistSession: false } });

describe('CHRISMED current-core isolation', () => {
  it('keeps the canonical CHRISMED tenant available to trusted backend code', async () => {
    const { data, error } = await service.from('companies').select('id,name').eq('id', CHRISMED_COMPANY_ID).single();
    expect(error).toBeNull();
    expect(data?.name).toBe('CHRISMED');
  });

  it('blocks anonymous professional creation', async () => {
    const { error } = await anonymous.from('agenda_professionals').insert({
      company_id: CHRISMED_COMPANY_ID, name: 'Unauthorized CI probe', email: 'probe@example.invalid',
    });
    expect(error).toBeTruthy();
  });

  it('blocks anonymous role escalation', async () => {
    const { error } = await anonymous.from('user_roles').insert({
      user_id: crypto.randomUUID(), company_id: CHRISMED_COMPANY_ID, role: 'admin',
    });
    expect(error).toBeTruthy();
  });

  it('does not expose tenant administration rows anonymously', async () => {
    const { data, error } = await anonymous.from('companies').select('id').eq('id', CHRISMED_COMPANY_ID);
    expect(error === null ? data : []).toHaveLength(0);
  });
});
