import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageElements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { fetchVoiceInsights } from "@/lib/ops-cockpits.functions";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ops/voz-cliente")({
  head: () => ({
    meta: [
      { title: "Voz do Cliente — Operações" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Erro: {error.message}</p>
        <button className="mt-2 text-xs underline" onClick={() => { reset(); router.invalidate(); }}>
          Tentar novamente
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6 text-sm">Não encontrado.</div>,
  component: VozClientePage,
});

function VozClientePage() {
  const [days, setDays] = useState(60);
  const [channel, setChannel] = useState<"all" | "agent_demand" | "poll">("all");
  const [audience, setAudience] = useState<"all" | "empresa" | "consumidor">("all");
  const [search, setSearch] = useState("");

  const fn = useServerFn(fetchVoiceInsights);
  const { data, isLoading } = useQuery({
    queryKey: ["ops", "voc", "insights", days, channel, audience],
    queryFn: () => fn({ data: { days, channel, audience } }),
  });

  const visible = (data?.insights ?? []).filter((i) =>
    search.trim() === "" ? true : i.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Voz do Cliente — Banco de Insights"
        description="Filtre por canal, período e audiência para agir rápido."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
            <SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder="Canal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="agent_demand">Demandas de agentes</SelectItem>
              <SelectItem value="poll">Enquetes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue placeholder="Audiência" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas audiências</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
              <SelectItem value="consumidor">Consumidor</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar no título…"
            className="h-9 max-w-xs text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="ml-auto text-xs text-muted-foreground">
            {visible.length} / {data?.total ?? 0} insights
          </span>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {(data?.facets.bySource ?? []).map((f) => (
          <Card key={`s-${f.key}`} className="p-3">
            <p className="text-xs text-muted-foreground">Canal</p>
            <p className="text-sm font-medium capitalize">{f.key.replace("_", " ")}</p>
            <p className="mt-1 text-xl font-semibold">{f.count}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Megaphone className="h-4 w-4" /> Insights
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum insight para os filtros aplicados.</p>
        ) : (
          <ul className="divide-y">
            {visible.map((i) => (
              <li key={`${i.source}-${i.id}`} className="flex items-start gap-3 py-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{i.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {i.source === "agent_demand" ? "Demanda" : "Enquete"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{i.audience}</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{i.status}</Badge>
                    {i.meta?.tipo && (
                      <Badge variant="outline" className="text-[10px]">{i.meta.tipo}</Badge>
                    )}
                    <span className="ml-2">{new Date(i.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
