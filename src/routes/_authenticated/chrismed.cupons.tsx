import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requireChrismedManagement } from '@/lib/chrismed-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, RefreshCw, TicketPercent } from 'lucide-react';

const CHRISMED_COMPANY_ID = '642096b5-a9ff-4521-a82a-c004f6d2e2d2';

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_discount_cents: number | null;
  minimum_amount_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  max_total_uses: number | null;
  max_uses_per_cpf: number | null;
  applies_to_all_offerings: boolean;
  offering_ids: string[];
  active: boolean;
};

type Offering = { id: string; name: string; modality: string; price_cents: number };
type Redemption = { coupon_id: string; status: string };

const emptyForm = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: 10,
  max_discount_reais: '',
  minimum_amount_reais: '',
  starts_at: '',
  ends_at: '',
  max_total_uses: '',
  max_uses_per_cpf: '1',
  applies_to_all_offerings: true,
  offering_ids: [] as string[],
  active: true,
};

export const Route = createFileRoute('/_authenticated/chrismed/cupons')({
  beforeLoad: requireChrismedManagement,
  component: ChrismedCouponsPage,
  head: () => ({ meta: [{ title: 'Cupons — Gestão CHRISMED' }] }),
});

function money(cents: number | null | undefined) {
  return ((cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function localDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function ChrismedCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [couponResult, offeringResult, redemptionResult] = await Promise.all([
      supabase.from('chrismed_coupons').select('*').eq('company_id', CHRISMED_COMPANY_ID).order('created_at', { ascending: false }),
      supabase.from('chrismed_service_offerings').select('id,name,modality,price_cents').eq('company_id', CHRISMED_COMPANY_ID).eq('active', true).order('display_order'),
      supabase.from('chrismed_coupon_redemptions').select('coupon_id,status').eq('company_id', CHRISMED_COMPANY_ID),
    ]);
    if (couponResult.error || offeringResult.error || redemptionResult.error) {
      console.error('[CHRISMED coupons]', couponResult.error, offeringResult.error, redemptionResult.error);
      toast.error('Não foi possível carregar todos os dados de cupons.');
    }
    setCoupons((couponResult.data ?? []) as Coupon[]);
    setOfferings((offeringResult.data ?? []) as Offering[]);
    setRedemptions((redemptionResult.data ?? []) as Redemption[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const usage = useMemo(() => {
    const map = new Map<string, { redeemed: number; reserved: number; released: number; cancelled: number }>();
    for (const item of redemptions) {
      const current = map.get(item.coupon_id) ?? { redeemed: 0, reserved: 0, released: 0, cancelled: 0 };
      if (item.status in current) current[item.status as keyof typeof current] += 1;
      map.set(item.coupon_id, current);
    }
    return map;
  }, [redemptions]);

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function edit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_type === 'percent' ? coupon.discount_value / 100 : coupon.discount_value / 100,
      max_discount_reais: coupon.max_discount_cents == null ? '' : String(coupon.max_discount_cents / 100),
      minimum_amount_reais: coupon.minimum_amount_cents ? String(coupon.minimum_amount_cents / 100) : '',
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
      ends_at: coupon.ends_at ? coupon.ends_at.slice(0, 16) : '',
      max_total_uses: coupon.max_total_uses == null ? '' : String(coupon.max_total_uses),
      max_uses_per_cpf: coupon.max_uses_per_cpf == null ? '' : String(coupon.max_uses_per_cpf),
      applies_to_all_offerings: coupon.applies_to_all_offerings,
      offering_ids: coupon.offering_ids ?? [],
      active: coupon.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    const code = form.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!code || !form.name.trim()) return toast.error('Informe código e nome do cupom.');
    if (form.discount_value <= 0) return toast.error('Informe um desconto válido.');
    if (form.discount_type === 'percent' && form.discount_value > 100) return toast.error('Percentual não pode ultrapassar 100%.');
    if (!form.applies_to_all_offerings && form.offering_ids.length === 0) return toast.error('Selecione ao menos um serviço para este cupom.');

    const payload = {
      company_id: CHRISMED_COMPANY_ID,
      code,
      name: form.name.trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Math.round(form.discount_value * 100),
      max_discount_cents: form.max_discount_reais ? Math.round(Number(form.max_discount_reais) * 100) : null,
      minimum_amount_cents: form.minimum_amount_reais ? Math.round(Number(form.minimum_amount_reais) * 100) : 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      max_total_uses: form.max_total_uses ? Number(form.max_total_uses) : null,
      max_uses_per_cpf: form.max_uses_per_cpf ? Number(form.max_uses_per_cpf) : null,
      applies_to_all_offerings: form.applies_to_all_offerings,
      offering_ids: form.applies_to_all_offerings ? [] : form.offering_ids,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    const result = editingId
      ? await supabase.from('chrismed_coupons').update(payload).eq('id', editingId).eq('company_id', CHRISMED_COMPANY_ID)
      : await supabase.from('chrismed_coupons').insert(payload);
    setSaving(false);
    if (result.error) {
      console.error('[CHRISMED coupon save]', result.error);
      return toast.error(result.error.message.includes('duplicate') ? 'Já existe um cupom com esse código.' : 'Não foi possível salvar o cupom.');
    }
    toast.success(editingId ? 'Cupom atualizado.' : 'Cupom criado.');
    reset();
    await load();
  }

  async function toggleActive(coupon: Coupon) {
    const { error } = await supabase.from('chrismed_coupons').update({ active: !coupon.active, updated_at: new Date().toISOString() }).eq('id', coupon.id).eq('company_id', CHRISMED_COMPANY_ID);
    if (error) return toast.error('Não foi possível alterar o status do cupom.');
    await load();
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] px-4 py-7 text-[#071C18] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-[#D9D3CB] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#596660]">CRM · Comercial · Financeiro</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold"><TicketPercent className="h-7 w-7" />Cupons CHRISMED</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#3F4A47]">Crie e controle descontos por CPF. A validação final ocorre no backend antes da cobrança.</p>
          </div>
          <div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button><Button onClick={reset} className="bg-[#071C18] text-white"><Plus className="mr-2 h-4 w-4" />Novo cupom</Button></div>
        </header>

        <Card className="border-[#D9D3CB] bg-white">
          <CardHeader><CardTitle>{editingId ? 'Editar cupom' : 'Criar cupom'}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EX.: BEMVINDO10" /></div>
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Tipo</Label><select className="h-10 w-full rounded-md border px-3" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}><option value="percent">Percentual</option><option value="fixed">Valor fixo</option></select></div>
            <div><Label>{form.discount_type === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}</Label><Input type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} /></div>
            <div><Label>Desconto máximo (R$)</Label><Input type="number" min="0" step="0.01" value={form.max_discount_reais} onChange={(e) => setForm({ ...form, max_discount_reais: e.target.value })} disabled={form.discount_type === 'fixed'} /></div>
            <div><Label>Valor mínimo (R$)</Label><Input type="number" min="0" step="0.01" value={form.minimum_amount_reais} onChange={(e) => setForm({ ...form, minimum_amount_reais: e.target.value })} /></div>
            <div><Label>Máximo de usos total</Label><Input type="number" min="1" value={form.max_total_uses} onChange={(e) => setForm({ ...form, max_total_uses: e.target.value })} placeholder="Sem limite" /></div>
            <div><Label>Máximo por CPF</Label><Input type="number" min="1" value={form.max_uses_per_cpf} onChange={(e) => setForm({ ...form, max_uses_per_cpf: e.target.value })} placeholder="Sem limite" /></div>
            <div><Label>Início</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div><Label>Fim</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            <div className="flex items-end gap-3 pb-2"><Switch checked={form.active} onCheckedChange={(active) => setForm({ ...form, active })} /><Label>Ativo</Label></div>
            <div className="flex items-end gap-3 pb-2"><Switch checked={form.applies_to_all_offerings} onCheckedChange={(value) => setForm({ ...form, applies_to_all_offerings: value })} /><Label>Todos os serviços</Label></div>
            <div className="md:col-span-2 xl:col-span-4"><Label>Descrição interna</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            {!form.applies_to_all_offerings && <div className="md:col-span-2 xl:col-span-4"><Label>Serviços elegíveis</Label><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{offerings.map((offering) => <label key={offering.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="checkbox" checked={form.offering_ids.includes(offering.id)} onChange={(e) => setForm({ ...form, offering_ids: e.target.checked ? [...form.offering_ids, offering.id] : form.offering_ids.filter((id) => id !== offering.id) })} /><span>{offering.name} · {money(offering.price_cents)}</span></label>)}</div></div>}
            <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-2"><Button variant="outline" onClick={reset}>Limpar</Button><Button onClick={() => void save()} disabled={saving} className="bg-[#071C18] text-white">{saving ? 'Salvando…' : 'Salvar cupom'}</Button></div>
          </CardContent>
        </Card>

        <Card className="border-[#D9D3CB] bg-white">
          <CardHeader><CardTitle>Cupons cadastrados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!coupons.length && <p className="py-8 text-center text-sm text-[#596660]">Nenhum cupom cadastrado.</p>}
            {coupons.map((coupon) => {
              const stats = usage.get(coupon.id) ?? { redeemed: 0, reserved: 0, released: 0, cancelled: 0 };
              return <div key={coupon.id} className="grid gap-3 rounded-xl border border-[#D9D3CB] p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{coupon.code}</strong><Badge className={coupon.active ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-100 text-slate-700'}>{coupon.active ? 'ATIVO' : 'INATIVO'}</Badge></div><p className="mt-1 text-sm text-[#596660]">{coupon.name}</p></div><div className="text-sm"><strong>{coupon.discount_type === 'percent' ? `${coupon.discount_value / 100}%` : money(coupon.discount_value)}</strong><p className="text-xs text-[#596660]">Por CPF: {coupon.max_uses_per_cpf ?? 'sem limite'} · Total: {coupon.max_total_uses ?? 'sem limite'}</p></div><div className="text-xs text-[#596660]"><div>Usados: <strong>{stats.redeemed}</strong> · Reservados: {stats.reserved}</div><div>Vigência: {localDateTime(coupon.starts_at)} → {localDateTime(coupon.ends_at)}</div></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(coupon)}>Editar</Button><Button size="sm" variant="outline" onClick={() => void toggleActive(coupon)}>{coupon.active ? 'Desativar' : 'Ativar'}</Button></div></div>;
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
