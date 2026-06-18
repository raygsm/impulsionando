import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/talentos/cadastro")({
  component: CadastroTalento,
});

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().min(8).max(20),
  cep: z.string().trim().min(8).max(9),
  cargo_desejado: z.string().trim().min(2).max(120),
  experiencia: z.string(),
  faixa_etaria: z.enum(["18-25", "26-35", "36-45", "46-55", "56-65", "66-75", "76+"]),
  escolaridade: z.string(),
  disponibilidade: z.string(),
  modelo_trabalho: z.string(),
  pretensao_salarial: z.string(),
});

const FAIXAS = ["18-25", "26-35", "36-45", "46-55", "56-65", "66-75", "76+"] as const;
const EXPERIENCIAS = ["Sem experiência", "Até 1 ano", "1 a 3 anos", "3 a 5 anos", "5 a 10 anos", "Mais de 10 anos"];
const ESCOLARIDADES = [
  "Fundamental incompleto", "Fundamental completo", "Médio incompleto", "Médio completo",
  "Técnico completo", "Superior em andamento", "Superior completo", "Pós-graduação", "Mestrado", "Doutorado",
];
const DISPO = ["Imediata", "Até 15 dias", "Até 30 dias", "Até 60 dias"];
const MODELOS = ["Presencial", "Híbrido", "Remoto", "Indiferente"];
const SALARIO = [
  "Até 1 salário mínimo", "1 a 2 salários", "2 a 3 salários", "3 a 5 salários", "5 a 10 salários", "Acima de 10 salários",
];

function CadastroTalento() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", email: "", whatsapp: "", cep: "",
    bairro: "", cidade: "", estado: "",
    cargo_desejado: "", experiencia: EXPERIENCIAS[0],
    faixa_etaria: "26-35", escolaridade: ESCOLARIDADES[5],
    disponibilidade: DISPO[0], modelo_trabalho: MODELOS[0],
    pretensao_salarial: SALARIO[1],
  });
  const [loading, setLoading] = useState(false);

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const j = await r.json();
      if (!j.erro) {
        setForm((f) => ({ ...f, bairro: j.bairro ?? "", cidade: j.localidade ?? "", estado: j.uf ?? "" }));
      }
    } catch { /* silencioso */ }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user_id = userRes.user?.id;
    if (!user_id) { toast.error("Faça login para continuar"); setLoading(false); return; }

    const { error } = await (supabase.from("talentos_candidatos" as never) as never)
      .insert({ ...form, user_id });

    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Perfil criado! Empresas da sua região poderão encontrar você.");
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-dvh bg-background py-10">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold">Cadastro de Talento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Leva 2 minutos. Você controla quando estar visível para as empresas.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-6" noValidate>
          <Card>
            <CardHeader><CardTitle className="text-lg">Identificação</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" required value={form.cep}
                  onChange={(e) => { setForm({ ...form, cep: e.target.value }); lookupCep(e.target.value); }} />
              </div>
              <div className="text-sm text-muted-foreground self-end">
                {form.cidade ? `${form.bairro ? form.bairro + " · " : ""}${form.cidade}/${form.estado}` : "Cidade detectada pelo CEP"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Perfil profissional</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="cargo">Cargo desejado</Label>
                <Input id="cargo" required placeholder="Ex.: Garçom, Recepcionista, Advogado"
                  value={form.cargo_desejado} onChange={(e) => setForm({ ...form, cargo_desejado: e.target.value })} />
              </div>
              <Field label="Experiência" id="exp" value={form.experiencia} options={EXPERIENCIAS}
                onChange={(v) => setForm({ ...form, experiencia: v })} />
              <Field label="Faixa etária" id="faixa" value={form.faixa_etaria} options={FAIXAS as unknown as string[]}
                onChange={(v) => setForm({ ...form, faixa_etaria: v })} />
              <Field label="Escolaridade" id="esc" value={form.escolaridade} options={ESCOLARIDADES}
                onChange={(v) => setForm({ ...form, escolaridade: v })} />
              <Field label="Disponibilidade" id="dispo" value={form.disponibilidade} options={DISPO}
                onChange={(v) => setForm({ ...form, disponibilidade: v })} />
              <Field label="Modelo de trabalho" id="modelo" value={form.modelo_trabalho} options={MODELOS}
                onChange={(v) => setForm({ ...form, modelo_trabalho: v })} />
              <Field label="Pretensão salarial" id="sal" value={form.pretensao_salarial} options={SALARIO}
                onChange={(v) => setForm({ ...form, pretensao_salarial: v })} />
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Salvando…" : "Salvar perfil"}
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, id, value, options, onChange }: {
  label: string; id: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
