import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  runRiomedEmbeddingJobs,
  searchRiomedProducts,
  getRiomedSearchOverview,
} from "@/lib/riomed-search.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Image as ImageIcon, Sparkles, Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes/riomed/busca-ia")({
  head: () => ({ meta: [{ title: "Rio Med · Busca com IA" }] }),
  component: Page,
});

type Result = {
  product_id: string;
  similarity: number;
  kind: string;
  product: { id: string; name: string; sku: string; description?: string; category?: string; image_url?: string } | null;
};

function Page() {
  const overviewFn = useServerFn(getRiomedSearchOverview);
  const runJobs = useServerFn(runRiomedEmbeddingJobs);
  const searchFn = useServerFn(searchRiomedProducts);

  const overview = useQuery({ queryKey: ["riomed-search-overview"], queryFn: () => overviewFn() });
  const [query, setQuery] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  async function handleSearch() {
    if (!query && !imageUrl) {
      toast.error("Informe um texto ou URL de imagem.");
      return;
    }
    setLoading(true);
    try {
      const r = await searchFn({ data: { query: query || undefined, imageUrl: imageUrl || undefined, limit: 12, minSimilarity: 0.35 } });
      setResults(r.results as Result[]);
      setLatency(r.latency_ms);
      overview.refetch();
    } catch (e) {
      toast.error("Falha na busca: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleIndex() {
    setIndexing(true);
    try {
      let totalP = 0, totalE = 0;
      // processa em lotes até esvaziar (até 10 rodadas para evitar loop infinito)
      for (let i = 0; i < 10; i++) {
        const r = await runJobs({ data: { limit: 25 } });
        totalP += r.processed;
        totalE += r.errors;
        if (r.processed === 0) break;
      }
      toast.success(`Indexação: ${totalP} produtos · ${totalE} erros`);
      overview.refetch();
    } catch (e) {
      toast.error("Falha ao indexar: " + (e as Error).message);
    } finally {
      setIndexing(false);
    }
  }

  const o = overview.data;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Busca com IA — Rio Med
        </h1>
        <p className="text-sm text-muted-foreground">
          Encontre produtos por descrição livre ou por foto. Embeddings via Lovable AI Gateway, indexados em pgvector.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Indexados</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{o?.indexed ?? "—"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{o?.pending ?? "—"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Erros</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">{o?.errors ?? "—"}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Latência última busca</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{latency ? `${latency} ms` : "—"}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Indexação de catálogo</CardTitle>
          <Button onClick={handleIndex} disabled={indexing} variant="secondary">
            {indexing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Processar fila
          </Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cada criação/atualização de produto enfileira automaticamente um job de re-embedding.
          Clique para esvaziar a fila manualmente (lote de 25 por rodada).
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Buscar produtos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><Search className="h-3.5 w-3.5" /> Texto livre</Label>
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder='Ex.: "esfigmomanômetro adulto com velcro"' />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> URL da imagem (multimodal)</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…/foto.jpg" />
            </div>
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Buscar
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Resultados ({results.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map(r => (
                <div key={r.product_id} className="border rounded-lg p-3 flex gap-3">
                  {r.product?.image_url ? (
                    <img src={r.product.image_url} alt="" className="h-16 w-16 rounded object-cover bg-muted" />
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.product?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">SKU {r.product?.sku ?? "—"} · {r.product?.category ?? "sem categoria"}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">{(r.similarity * 100).toFixed(1)}% match</Badge>
                      <Badge variant="outline" className="text-xs">{r.kind}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {o?.recent && o.recent.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Buscas recentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {o.recent.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between border-b py-1 last:border-0">
                  <span className="truncate flex-1">{q.query_text ?? <em className="text-muted-foreground">imagem</em>}</span>
                  <span className="text-xs text-muted-foreground ml-3">
                    {q.results_count} hits · {q.latency_ms}ms · {q.top_score ? `${(q.top_score * 100).toFixed(0)}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
