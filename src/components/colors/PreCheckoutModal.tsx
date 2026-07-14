/**
 * Colors — Pré-checkout modal (Fase 1).
 * Captura dados do lead ANTES do redirect para a Maisfy.
 * Chama `startColorsCheckout`, obtém `colors_checkout_id`, e redireciona
 * anexando esse id como `external_id` + `sub_id` + `ref` (o que a Maisfy aceitar).
 */
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { startColorsCheckout } from "@/lib/colors-checkout.functions";

export interface PreCheckoutProduct {
  slug: string;
  name: string;
  kitSize?: number;
  quantity?: number;
  unitPriceCents?: number;
  totalPriceCents?: number;
  coupon?: string;
  offerUrl: string; // link Maisfy oficial
}

interface Props {
  open: boolean;
  onClose: () => void;
  product: PreCheckoutProduct;
  origin?: string;
}

function readUtms() {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const pick = (k: string) => q.get(k) ?? undefined;
  return {
    utmSource: pick("utm_source"),
    utmMedium: pick("utm_medium"),
    utmCampaign: pick("utm_campaign"),
    utmContent: pick("utm_content"),
    utmTerm: pick("utm_term"),
    affiliateCode: pick("aff") ?? pick("afiliado") ?? pick("ref"),
  };
}

function getSessionId() {
  if (typeof window === "undefined") return undefined;
  const KEY = "colors_sid";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export default function PreCheckoutModal({ open, onClose, product, origin }: Props) {
  const start = useServerFn(startColorsCheckout);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    cep: "",
    addressLine1: "",
    addressNumber: "",
    addressComplement: "",
    neighborhood: "",
    city: "",
    state: "",
    consentLgpd: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepBusy, setCepBusy] = useState(false);

  const utms = useMemo(readUtms, []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    let cancelled = false;
    setCepBusy(true);
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then((data: { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean }) => {
        if (cancelled || data.erro) return;
        setForm((f) => ({
          ...f,
          addressLine1: f.addressLine1 || data.logradouro || "",
          neighborhood: f.neighborhood || data.bairro || "",
          city: f.city || data.localidade || "",
          state: f.state || data.uf || "",
        }));
      })
      .catch(() => {})
      .finally(() => !cancelled && setCepBusy(false));
    return () => {
      cancelled = true;
    };
  }, [form.cep]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.consentLgpd) {
      setError("É preciso aceitar a política de privacidade para continuar.");
      return;
    }
    if (form.fullName.trim().length < 2) return setError("Informe seu nome completo.");
    if (form.whatsapp.replace(/\D/g, "").length < 10) return setError("Informe um WhatsApp válido.");

    setLoading(true);
    try {
      const result = await start({
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim() || undefined,
          whatsapp: form.whatsapp,
          cep: form.cep || undefined,
          addressLine1: form.addressLine1 || undefined,
          addressNumber: form.addressNumber || undefined,
          addressComplement: form.addressComplement || undefined,
          neighborhood: form.neighborhood || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          consentLgpd: form.consentLgpd,
          consentMarketing: form.consentLgpd,
          productSlug: product.slug,
          productName: product.name,
          kitSize: product.kitSize ?? 1,
          quantity: product.quantity ?? 1,
          unitPriceCents: product.unitPriceCents,
          totalPriceCents: product.totalPriceCents,
          coupon: product.coupon,
          offerUrl: product.offerUrl,
          origin: origin ?? "pdp",
          device: typeof window !== "undefined" && window.innerWidth < 640 ? "mobile" : "desktop",
          browser: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : undefined,
          sessionId: getSessionId(),
          ...utms,
        },
      });

      // Anexa colors_checkout_id ao link Maisfy — sub_id / external_id / ref.
      const url = new URL(product.offerUrl, window.location.origin);
      const ccid = result.colorsCheckoutId;
      url.searchParams.set("sub_id", ccid);
      url.searchParams.set("external_id", ccid);
      url.searchParams.set("ref", ccid);
      if (form.email) url.searchParams.set("email", form.email);
      if (form.whatsapp) url.searchParams.set("phone", form.whatsapp.replace(/\D/g, ""));
      if (form.fullName) url.searchParams.set("name", form.fullName);

      window.location.href = url.toString();
    } catch (err) {
      console.error(err);
      setError("Não conseguimos salvar seus dados. Tente novamente em instantes.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-500/30 bg-neutral-950 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Colors · Pedido seguro</p>
          <h2 className="mt-1 text-2xl font-black">Complete seus dados para continuar</h2>
          <p className="mt-1 text-sm text-white/60">
            {product.name} {product.kitSize && product.kitSize > 1 ? `· kit ${product.kitSize} potes` : ""}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Nome completo *">
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputCls}
              autoComplete="name"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
                autoComplete="email"
              />
            </Field>
            <Field label="WhatsApp *">
              <input
                required
                inputMode="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })}
                className={inputCls}
                autoComplete="tel"
                placeholder="(11) 99999-9999"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <Field label="CEP">
              <div className="relative">
                <input
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: maskCep(e.target.value) })}
                  className={inputCls}
                  placeholder="00000-000"
                  autoComplete="postal-code"
                />
                {cepBusy && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-emerald-400" />}
              </div>
            </Field>
            <Field label="Endereço">
              <input
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className={inputCls}
                autoComplete="address-line1"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Número">
              <input
                value={form.addressNumber}
                onChange={(e) => setForm({ ...form, addressNumber: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Complemento">
              <input
                value={form.addressComplement}
                onChange={(e) => setForm({ ...form, addressComplement: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Bairro">
              <input
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
            <Field label="Cidade">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
                autoComplete="address-level2"
              />
            </Field>
            <Field label="UF">
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })}
                className={inputCls}
                autoComplete="address-level1"
              />
            </Field>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs text-white/70">
            <input
              type="checkbox"
              checked={form.consentLgpd}
              onChange={(e) => setForm({ ...form, consentLgpd: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-emerald-500"
              required
            />
            <span>
              Autorizo a Colors a usar meus dados para concluir esta compra e me contatar sobre o pedido,
              conforme a Política de Privacidade (LGPD).
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3.5 text-base font-black text-black shadow-xl transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
            {loading ? "Salvando seu pedido…" : "Continuar para o pagamento"}
          </button>

          <p className="text-center text-[11px] text-white/50">
            Você será direcionado para o ambiente seguro de pagamento. Seus dados de cartão nunca são armazenados pela Colors.
          </p>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60 focus:bg-white/[0.07]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/60">{label}</span>
      {children}
    </label>
  );
}
