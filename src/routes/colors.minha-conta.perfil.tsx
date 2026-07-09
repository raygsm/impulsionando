import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, MapPin, User } from "lucide-react";
import { AccountPageHeader } from "@/components/colors/account/AccountShell";
import { Field, inputCls } from "@/routes/colors.entrar";
import { COLORS_MOCK_USER } from "@/data/colors-mock-account";

export const Route = createFileRoute("/colors/minha-conta/perfil")({
  head: () => ({ meta: [{ title: "Perfil e endereços — Colors Saúde" }, { name: "robots", content: "noindex" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const [saved, setSaved] = useState<null | "profile" | "address">(null);
  const [profile, setProfile] = useState({ ...COLORS_MOCK_USER });
  const [addr, setAddr] = useState({ ...COLORS_MOCK_USER.addresses[0] });

  const setP = (k: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [k]: e.target.value }));
  const setA = (k: keyof typeof addr) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddr((a) => ({ ...a, [k]: e.target.value }));

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved("profile");
    setTimeout(() => setSaved(null), 2500);
  }
  function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaved("address");
    setTimeout(() => setSaved(null), 2500);
  }

  return (
    <>
      <AccountPageHeader
        title="Perfil e endereços" icon={User}
        description="Mantenha seus dados atualizados para receber pedidos e novidades oficiais."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dados pessoais */}
        <form onSubmit={saveProfile} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/70">Dados pessoais</h2>
          <div className="mt-4 space-y-3">
            <Field label="Nome completo">
              <input value={profile.name} onChange={setP("name")} className={inputCls} />
            </Field>
            <Field label="E-mail">
              <input type="email" value={profile.email} onChange={setP("email")} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="WhatsApp">
                <input value={profile.phone} onChange={setP("phone")} className={inputCls} />
              </Field>
              <Field label="CPF">
                <input value={profile.document} onChange={setP("document")} className={inputCls} />
              </Field>
            </div>
          </div>
          <button type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-black hover:bg-emerald-400">
            {saved === "profile" && <CheckCircle2 className="h-4 w-4" />}
            {saved === "profile" ? "Salvo!" : "Salvar dados"}
          </button>
        </form>

        {/* Endereço */}
        <form onSubmit={saveAddress} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/70">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Endereço de entrega
          </h2>
          <div className="mt-4 space-y-3">
            <Field label="Apelido do endereço">
              <input value={addr.label} onChange={setA("label")} className={inputCls} />
            </Field>
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <Field label="Rua/Avenida"><input value={addr.street} onChange={setA("street")} className={inputCls} /></Field>
              <Field label="Número"><input value={addr.number} onChange={setA("number")} className={inputCls} /></Field>
            </div>
            <Field label="Complemento"><input value={addr.complement ?? ""} onChange={setA("complement")} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bairro"><input value={addr.district} onChange={setA("district")} className={inputCls} /></Field>
              <Field label="CEP"><input value={addr.zip} onChange={setA("zip")} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <Field label="Cidade"><input value={addr.city} onChange={setA("city")} className={inputCls} /></Field>
              <Field label="UF"><input value={addr.state} onChange={setA("state")} className={inputCls} /></Field>
            </div>
          </div>
          <button type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-black hover:bg-emerald-400">
            {saved === "address" && <CheckCircle2 className="h-4 w-4" />}
            {saved === "address" ? "Salvo!" : "Salvar endereço"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        As alterações ainda não são persistidas — integração com backend será feita na próxima onda.
      </p>
    </>
  );
}
