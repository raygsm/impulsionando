import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Heart, MapPin, Briefcase, GraduationCap, Calendar, Search, Settings } from "lucide-react";
import { compatibilityScore, type EmpresaConfig } from "@/lib/talentos-score";

export const Route = createFileRoute("/_authenticated/empresa/talentos")({
  component: EmpresaTalentos,
});

type Candidato = {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  cargo_desejado: string;
  experiencia: string | null;
  escolaridade: string | null;
  disponibilidade: string | null;
  modelo_trabalho: string | null;
  pretensao_salarial: string | null;
  faixa_etaria: string | null;
  foto_url: string | null;
  tags: string[] | null;
};

const EXPERIENCIAS = ["Qualquer", "Sem experiência", "Até 1 ano", "1 a 3 anos", "3 a 5 anos", "5 a 10 anos", "Mais de 10 anos"];
const DISPO = ["Qualquer", "Imediata", "Até 15 dias", "Até 30 dias", "Até 60 dias"];
const MODELOS = ["Qualquer", "Presencial", "Híbrido", "Remoto", "Indiferente"];

function EmpresaTalentos() {
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState("");
  const [cargo, setCargo] = useState("");
  const [exp, setExp] = useState("Qualquer");
  const [dispo, setDispo] = useState("Qualquer");
  const [modelo, setModelo] = useState("Qualquer");
  const [list, setList] = useState<Candidato[]>([]);
  const [empresaCfg, setEmpresaCfg] = useState<EmpresaConfig>({});
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any).from("talentos_candidatos").select(
      "id,nome,cidade,estado,bairro,cargo_desejado,experiencia,escolaridade,disponibilidade,modelo_trabalho,pretensao_salarial,faixa_etaria,foto_url,tags",
    )
      .eq("ativo", true)
      .eq("visivel_rede", true)
      .limit(60);

    if (cidade.trim()) q = q.ilike("cidade", `%${cidade.trim()}%`);
    if (cargo.trim()) q = q.ilike("cargo_desejado", `%${cargo.trim()}%`);
    if (exp !== "Qualquer") q = q.eq("experiencia", exp);
    if (dispo !== "Qualquer") q = q.eq("disponibilidade", dispo);
    if (modelo !== "Qualquer") q = q.eq("modelo_trabalho", modelo);

    const { data, error } = await q;
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setList((data ?? []) as Candidato[]);
  }

  useEffect(() => {
    carregar();
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data: comp } = await sb.from("companies").select("id, niche").eq("owner_id", u.user.id).maybeSingle();
      if (!comp) return;
      const { data: cfg } = await sb.from("talentos_company_settings")
        .select("cidades_interesse, bairros_interesse, nicho").eq("company_id", comp.id).maybeSingle();
      setEmpresaCfg({ ...(cfg ?? {}), nicho: cfg?.nicho ?? comp.niche });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      [c.nome, c.cargo_desejado, c.cidade, ...(c.tags ?? [])]
        .filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [list, busca]);

  async function favoritar(candidato_id: string) {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) { toast.error("Faça login"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("talentos_matches").upsert({
      company_id: userRes.user.id,
      candidato_id,
      vaga_id: null,
      stage: "favorito",
      score: 70,
      motivos: ["Salvo manualmente"],
    }, { onConflict: "company_id,candidato_id,vaga_id" });
    if (error) toast.error(error.message);
    else toast.success("Candidato salvo em favoritos");
  }

  return (
    <main className="min-h-dvh bg-background py-8">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Rede de Talentos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Encontre profissionais da sua região cadastrados no ecossistema Impulsionando.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/empresa/talentos/rede"><Settings className="mr-2 h-4 w-4" aria-hidden="true" />Configurar rede</Link>
          </Button>
        </header>

        <Card className="mb-6">
          <CardHeader className="pb-3"><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); carregar(); }}
              className="grid gap-3 md:grid-cols-6"
              aria-label="Filtros de candidatos"
            >
              <div className="md:col-span-2">
                <Label htmlFor="f-busca">Busca rápida</Label>
                <div className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="f-busca" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-8" placeholder="Nome, tag, cargo…" />
                </div>
              </div>
              <div>
                <Label htmlFor="f-cidade">Cidade</Label>
                <Input id="f-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Rio de Janeiro" />
              </div>
              <div>
                <Label htmlFor="f-cargo">Cargo</Label>
                <Input id="f-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Garçom, Recepcionista…" />
              </div>
              <FilterSelect label="Experiência" id="f-exp" value={exp} options={EXPERIENCIAS} onChange={setExp} />
              <FilterSelect label="Disponibilidade" id="f-dispo" value={dispo} options={DISPO} onChange={setDispo} />
              <FilterSelect label="Modelo" id="f-modelo" value={modelo} options={MODELOS} onChange={setModelo} />
              <div className="md:col-span-6 flex justify-end">
                <Button type="submit" disabled={loading}>{loading ? "Buscando…" : "Aplicar filtros"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section aria-live="polite" aria-busy={loading}>
          <p className="mb-3 text-sm text-muted-foreground">
            {filtrados.length} candidato{filtrados.length === 1 ? "" : "s"} encontrado{filtrados.length === 1 ? "" : "s"}
          </p>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((c) => (
              <li key={c.id}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                        {c.foto_url ? (
                          <img src={c.foto_url} alt={`Foto de ${c.nome}`} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div aria-hidden="true" className="grid h-full w-full place-items-center text-sm font-semibold text-muted-foreground">
                            {c.nome.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold">{c.nome}</h2>
                        <p className="truncate text-sm text-muted-foreground">{c.cargo_desejado}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Salvar ${c.nome} em favoritos`}
                        onClick={() => favoritar(c.id)}
                      >
                        <Heart className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs text-muted-foreground">
                      <Row icon={MapPin} label="Localização" value={[c.bairro, c.cidade, c.estado].filter(Boolean).join(" · ") || "—"} />
                      <Row icon={Briefcase} label="Experiência" value={c.experiencia ?? "—"} />
                      <Row icon={GraduationCap} label="Escolaridade" value={c.escolaridade ?? "—"} />
                      <Row icon={Calendar} label="Disponibilidade" value={c.disponibilidade ?? "—"} />
                    </dl>
                    {(() => {
                      const { score, motivos } = compatibilityScore(c as unknown as Parameters<typeof compatibilityScore>[0], empresaCfg);
                      return (
                        <div className="mt-3 flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 text-xs">
                          <span className="font-medium">Compatibilidade <span className="text-primary">{score}%</span></span>
                          <span className="truncate text-muted-foreground" title={motivos.join(" · ")}>{motivos[0] ?? ""}</span>
                        </div>
                      );
                    })()}
                    {c.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {c.tags.slice(0, 5).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          {!loading && filtrados.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum candidato encontrado com os filtros atuais.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function FilterSelect({ label, id, value, options, onChange }: {
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

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      <dt className="sr-only">{label}</dt>
      <dd className="truncate">{value}</dd>
    </div>
  );
}
