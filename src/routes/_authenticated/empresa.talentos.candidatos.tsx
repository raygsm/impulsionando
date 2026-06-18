import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, Heart, CalendarCheck2, CheckCircle2, Users, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empresa/talentos/candidatos")({
  component: CandidatosDashboard,
});

type Stage = "novo" | "favorito" | "entrevista" | "contratado" | "banco";

type Match = {
  id: string;
  candidato_id: string;
  stage: Stage;
  score: number | null;
  contratado_em: string | null;
  desligado_em: string | null;
  candidato?: {
    nome: string; cargo_desejado: string; cidade: string | null; estado: string | null;
    foto_url: string | null; faixa_etaria: string | null; disponibilidade: string | null;
  } | null;
};

const TABS: { value: Stage; label: string; icon: typeof UserPlus }[] = [
  { value: "novo", label: "Novos", icon: UserPlus },
  { value: "favorito", label: "Favoritos", icon: Heart },
  { value: "entrevista", label: "Entrevistas", icon: CalendarCheck2 },
  { value: "contratado", label: "Contratados", icon: CheckCircle2 },
  { value: "banco", label: "Banco de Talentos", icon: Users },
];

function CandidatosDashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("novo");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const { data, error } = await sb.from("talentos_matches")
        .select("id, candidato_id, stage, score, contratado_em, desligado_em, candidato:talentos_candidatos(nome, cargo_desejado, cidade, estado, foto_url, faixa_etaria, disponibilidade)")
        .eq("company_id", u.user.id)
        .order("created_at", { ascending: false });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      setMatches((data ?? []) as Match[]);
    })();
  }, []);

  const buckets = useMemo(() => ({
    novo: matches.filter((m) => m.stage === "novo" || !m.stage),
    favorito: matches.filter((m) => m.stage === "favorito"),
    entrevista: matches.filter((m) => m.stage === "entrevista"),
    contratado: matches.filter((m) => m.stage === "contratado"),
    banco: matches,
  }), [matches]);

  async function moverPara(matchId: string, novoStage: Stage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const patch: Record<string, unknown> = { stage: novoStage };
    if (novoStage === "contratado") patch.contratado_em = new Date().toISOString();
    const { error } = await sb.from("talentos_matches").update(patch).eq("id", matchId);
    if (error) { toast.error(error.message); return; }
    setMatches((list) => list.map((m) => (m.id === matchId ? { ...m, ...patch } as Match : m)));
    toast.success("Estágio atualizado");
  }

  return (
    <main className="min-h-dvh bg-background py-8">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Candidatos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pipeline da sua rede de talentos. Mova candidatos entre estágios.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/empresa/talentos"><Users className="mr-2 h-4 w-4" aria-hidden="true" />Buscar</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/empresa/talentos/rede"><Settings className="mr-2 h-4 w-4" aria-hidden="true" />Rede</Link>
            </Button>
          </div>
        </header>

        <Tabs value={stage} onValueChange={(v) => setStage(v as Stage)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-4 w-4" aria-hidden="true" />
                <span>{t.label}</span>
                <Badge variant="secondary" className="ml-1">{buckets[t.value].length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-6">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : buckets[t.value].length === 0 ? (
                <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum candidato neste estágio.
                </p>
              ) : (
                <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {buckets[t.value].map((m) => (
                    <li key={m.id}>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                              {m.candidato?.foto_url ? (
                                <img src={m.candidato.foto_url} alt={`Foto de ${m.candidato.nome}`} className="h-full w-full object-cover" loading="lazy" />
                              ) : (
                                <div aria-hidden="true" className="grid h-full w-full place-items-center text-sm font-semibold text-muted-foreground">
                                  {m.candidato?.nome?.[0]?.toUpperCase() ?? "?"}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2 className="truncate font-semibold">{m.candidato?.nome ?? "Candidato"}</h2>
                              <p className="truncate text-sm text-muted-foreground">{m.candidato?.cargo_desejado}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {[m.candidato?.cidade, m.candidato?.estado].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </div>
                            {m.score != null && <Badge variant="outline">{m.score}%</Badge>}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(["favorito","entrevista","contratado","banco"] as Stage[])
                              .filter((s) => s !== m.stage)
                              .map((s) => (
                                <Button key={s} size="sm" variant="outline" onClick={() => moverPara(m.id, s)}>
                                  → {TABS.find((x) => x.value === s)?.label}
                                </Button>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
