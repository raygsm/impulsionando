/**
 * /vitrine/$slug — Página pública da empresa participante.
 * Mostra dados básicos, redes sociais, rating real e permite avaliar (usuário logado).
 */
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { getPublicCompanyBySlug, submitCompanyReview } from "@/lib/consumer.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Instagram, Facebook, Globe, MessageCircle, Crown, Heart, Star } from "lucide-react";

export const Route = createFileRoute("/vitrine/$slug")({
  loader: async ({ params }) => {
    try {
      return await getPublicCompanyBySlug({ data: { slug: params.slug } });
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const c = loaderData?.company;
    const title = c ? `${c.trade_name || c.name} — Vitrine Impulsionando` : "Vitrine Impulsionando";
    const desc = c ? `Conheça ${c.trade_name || c.name}${c.address_city ? ` em ${c.address_city}` : ""}. Reserve, peça e ganhe benefícios pelo Clube Premium.` : "Vitrine de parceiros Impulsionando.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(c?.logo_url ? [{ property: "og:image", content: c.logo_url }] : []),
      ],
    };
  },
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Não foi possível carregar a empresa</h1>
        <p className="text-sm text-muted-foreground mt-2">{(error as Error)?.message}</p>
        <div className="mt-4 flex gap-2 justify-center">
          <Button onClick={reset} variant="outline">Tentar novamente</Button>
          <Button asChild><Link to="/vitrine">Voltar à vitrine</Link></Button>
        </div>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Empresa não encontrada</h1>
        <Button asChild className="mt-4"><Link to="/vitrine">Voltar à vitrine</Link></Button>
      </div>
    </div>
  ),
  component: VitrineDetailPage,
});

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} width={size} height={size} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"} />
      ))}
    </div>
  );
}

function VitrineDetailPage() {
  const { company: c, reviews } = Route.useLoaderData();
  const router = useRouter();
  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (stars < 1) {
      toast.error("Escolha de 1 a 5 estrelas");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para avaliar");
      return;
    }
    setSubmitting(true);
    try {
      await submitCompanyReview({ data: { company_id: c.id, stars, comment: comment.trim() || undefined } });
      toast.success("Avaliação enviada!");
      setStars(0);
      setComment("");
      router.invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const ratingAvg = Number(c.rating_avg ?? 0);
  const ratingCount = Number(c.rating_count ?? 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {c.logo_url ? (
              <img src={c.logo_url} alt={c.name} className="w-24 h-24 rounded-xl object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-primary/10" />
            )}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{c.trade_name || c.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {c.segment && <Badge variant="outline">{c.segment}</Badge>}
                {(c.address_city || c.address_state) && (
                  <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" /> {c.address_city}{c.address_state ? `, ${c.address_state}` : ""}</Badge>
                )}
                {ratingCount > 0 && (
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Stars value={ratingAvg} />
                    <span className="font-medium">{ratingAvg.toFixed(1)}</span>
                    <span className="text-muted-foreground">({ratingCount})</span>
                  </span>
                )}
              </div>
              {c.address_line && <p className="text-sm text-muted-foreground mt-3">{c.address_line}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {c.whatsapp && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</a></Button>}
                {c.instagram && <Button asChild variant="outline" size="sm"><a href={`https://instagram.com/${c.instagram.replace("@", "")}`} target="_blank" rel="noopener"><Instagram className="w-4 h-4 mr-1" /> Instagram</a></Button>}
                {c.facebook && <Button asChild variant="outline" size="sm"><a href={c.facebook} target="_blank" rel="noopener"><Facebook className="w-4 h-4 mr-1" /> Facebook</a></Button>}
                {c.website && <Button asChild variant="outline" size="sm"><a href={c.website} target="_blank" rel="noopener"><Globe className="w-4 h-4 mr-1" /> Site</a></Button>}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-primary text-primary-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Crown className="w-10 h-10 shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Desbloqueie benefícios em {c.trade_name || c.name}</h2>
              <p className="text-sm text-white/85 mt-1">Com o Clube Premium R$ 9,99/mês você ganha descontos, prioridade em reservas e ofertas exclusivas dos parceiros.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="bg-white text-primary hover:bg-white/90"><Link to="/clube"><Heart className="w-4 h-4 mr-1" /> Virar Premium</Link></Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Avaliações</h2>
          <form onSubmit={handleSubmitReview} className="space-y-3 border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sua nota:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setStars(n)} className="p-1" aria-label={`${n} estrelas`}>
                  <Star className={n <= stars ? "w-6 h-6 fill-amber-400 text-amber-400" : "w-6 h-6 text-muted-foreground/40"} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Conte como foi sua experiência (opcional)" rows={3} maxLength={1000} />
            <Button type="submit" disabled={submitting || stars < 1}>{submitting ? "Enviando…" : "Enviar avaliação"}</Button>
            <p className="text-xs text-muted-foreground">É preciso estar logado. Sua avaliação aparece publicamente.</p>
          </form>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar.</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r: { id: string; stars: number; comment: string | null; created_at: string }) => (
                <li key={r.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <Stars value={r.stars} />
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
