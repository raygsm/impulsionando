/**
 * /vitrine/$slug — Página pública da empresa participante.
 * Mostra dados básicos, rating real, lista de avaliações e permite ao usuário logado
 * criar, editar e remover a própria avaliação.
 */
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import {
  getPublicCompanyBySlug,
  submitCompanyReview,
  getMyReviewForCompany,
  deleteCompanyReview,
} from "@/lib/consumer.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MapPin, Instagram, Facebook, Globe, MessageCircle, Crown, Heart, Star, Loader2, Trash2, Pencil,
} from "lucide-react";

const COMMENT_MAX = 1000;

const reviewSchema = z.object({
  stars: z.number().int().min(1, "Escolha de 1 a 5 estrelas").max(5, "Máximo 5 estrelas"),
  comment: z.string().max(COMMENT_MAX, `Comentário até ${COMMENT_MAX} caracteres`).optional(),
});

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
    <div className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} width={size} height={size} className={n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"} />
      ))}
    </div>
  );
}

function VitrineDetailPage() {
  const { company: c, reviews } = Route.useLoaderData();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchMyReview = useServerFn(getMyReviewForCompany);
  const myReviewQ = useQuery({
    queryKey: ["my-review", c.id, userId],
    queryFn: () => fetchMyReview({ data: { company_id: c.id } }),
    enabled: !!userId,
  });
  const myReview = myReviewQ.data?.review ?? null;

  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Pré-preenche o formulário quando minha avaliação carrega
  useEffect(() => {
    if (myReview && !editing) {
      setStars(myReview.stars);
      setComment(myReview.comment ?? "");
    }
  }, [myReview, editing]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    if (!userId) {
      toast.error("Faça login para avaliar");
      return;
    }
    const trimmedComment = comment.trim();
    const parsed = reviewSchema.safeParse({ stars, comment: trimmedComment || undefined });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
      setFieldError(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);
    try {
      await submitCompanyReview({ data: { company_id: c.id, stars: parsed.data.stars, comment: parsed.data.comment } });
      toast.success(myReview ? "Avaliação atualizada!" : "Avaliação enviada!");
      setEditing(false);
      await Promise.all([myReviewQ.refetch(), router.invalidate()]);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível enviar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!myReview) return;
    if (!confirm("Remover sua avaliação?")) return;
    setDeleting(true);
    try {
      await deleteCompanyReview({ data: { company_id: c.id } });
      toast.success("Avaliação removida");
      setStars(0);
      setComment("");
      setEditing(false);
      await Promise.all([myReviewQ.refetch(), router.invalidate()]);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível remover");
    } finally {
      setDeleting(false);
    }
  }

  const ratingAvg = Number(c.rating_avg ?? 0);
  const ratingCount = Number(c.rating_count ?? 0);
  const canSubmit = stars >= 1 && !submitting && !deleting;
  const showForm = !myReview || editing;

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
            <Button asChild className="bg-white text-primary hover:bg-white/90"><Link to="/clube"><Heart className="w-4 h-4 mr-1" /> Virar Premium</Link></Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Avaliações</h2>

          {/* Minha avaliação atual */}
          {userId && myReviewQ.isLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4"><Loader2 className="w-4 h-4 animate-spin" /> Carregando sua avaliação…</p>
          )}
          {userId && myReview && !editing && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-primary mb-1">Sua avaliação</div>
                  <Stars value={myReview.stars} size={16} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={deleting}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />} Remover
                  </Button>
                </div>
              </div>
              {myReview.comment && <p className="text-sm mt-2 whitespace-pre-wrap">{myReview.comment}</p>}
            </div>
          )}

          {/* Formulário (criar ou editar) */}
          {showForm && (
            <form onSubmit={handleSubmitReview} className="space-y-3 border-b pb-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Sua nota:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setStars(n); setFieldError(null); }}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                    aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                    aria-pressed={stars === n}
                    disabled={submitting || deleting}
                  >
                    <Star className={n <= stars ? "w-7 h-7 fill-amber-400 text-amber-400" : "w-7 h-7 text-muted-foreground/40"} />
                  </button>
                ))}
                {stars > 0 && <span className="text-sm font-medium">{stars}/5</span>}
              </div>
              <div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
                  placeholder="Conte como foi sua experiência (opcional)"
                  rows={3}
                  maxLength={COMMENT_MAX}
                  disabled={submitting || deleting}
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{fieldError && <span className="text-destructive">{fieldError}</span>}</span>
                  <span>{comment.length}/{COMMENT_MAX}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!canSubmit}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitting ? "Enviando…" : (myReview ? "Salvar alterações" : "Enviar avaliação")}
                </Button>
                {editing && (
                  <Button type="button" variant="ghost" onClick={() => {
                    setEditing(false);
                    setStars(myReview?.stars ?? 0);
                    setComment(myReview?.comment ?? "");
                    setFieldError(null);
                  }} disabled={submitting}>
                    Cancelar
                  </Button>
                )}
              </div>
              {!userId && <p className="text-xs text-muted-foreground">É preciso estar logado para avaliar.</p>}
            </form>
          )}

          {/* Lista pública */}
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
                  {r.comment && <p className="text-sm mt-2 whitespace-pre-wrap">{r.comment}</p>}
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
