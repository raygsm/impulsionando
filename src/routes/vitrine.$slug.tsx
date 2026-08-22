import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
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
  getClubCompanyBySlug,
  submitCompanyReview,
  getMyReviewForCompany,
  deleteCompanyReview,
} from "@/lib/consumer.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MapPin, Instagram, Globe, MessageCircle, Crown, Heart, Star, Loader2, Trash2, Pencil, LockKeyhole,
} from "lucide-react";

const COMMENT_MAX = 1000;

const reviewSchema = z.object({
  stars: z.number().int().min(1, "Escolha de 1 a 5 estrelas").max(5, "Máximo 5 estrelas"),
  comment: z.string().max(COMMENT_MAX, `Comentário até ${COMMENT_MAX} caracteres`).optional(),
});

export const Route = createFileRoute("/vitrine/$slug")({
  ssr: false,
  beforeLoad: async ({ params }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: {
          persona: "clube",
          mode: "signin",
          next: `/vitrine/${params.slug}`,
        },
      });
    }
  },
  loader: async ({ params }) => getClubCompanyBySlug({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const c = loaderData?.company;
    const title = c ? `${c.trade_name || c.name} — Clube Impulsionando` : "Clube Impulsionando";
    const desc = c ? `Detalhes de ${c.trade_name || c.name} disponíveis para membros do Clube Impulsionando.` : "Área exclusiva para membros do Clube Impulsionando.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  errorComponent: ({ error, reset }) => (
    <div className="min-h-dvh flex items-center justify-center p-6 text-center bg-background">
      <Card className="max-w-md p-8">
        <LockKeyhole className="mx-auto h-9 w-9 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Conteúdo exclusivo do Clube</h1>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error)?.message || "Não foi possível carregar os detalhes desta empresa."}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={reset} variant="outline">Tentar novamente</Button>
          <Button asChild><Link to="/vitrine">Voltar à vitrine</Link></Button>
        </div>
      </Card>
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
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchMyReview = useServerFn(getMyReviewForCompany);
  const myReviewQ = useQuery({
    queryKey: ["my-review", c.id, userId],
    queryFn: () => fetchMyReview({ data: { company_id: c.id } }),
    enabled: !!userId,
  });
  const myReview = myReviewQ.data?.review ?? null;

  useEffect(() => {
    if (myReview && !editing) {
      setStars(myReview.stars);
      setComment(myReview.comment ?? "");
    }
  }, [myReview, editing]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    const parsed = reviewSchema.safeParse({ stars, comment: comment.trim() || undefined });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
      setFieldError(msg);
      return;
    }
    setSubmitting(true);
    try {
      await submitCompanyReview({ data: { company_id: c.id, stars: parsed.data.stars, comment: parsed.data.comment } });
      toast.success(myReview ? "Avaliação atualizada." : "Avaliação enviada.");
      setEditing(false);
      await Promise.all([myReviewQ.refetch(), router.invalidate()]);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível salvar a avaliação.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!myReview) return;
    setDeleting(true);
    try {
      await deleteCompanyReview({ data: { company_id: c.id } });
      setStars(0);
      setComment("");
      setEditing(false);
      toast.success("Avaliação removida.");
      await Promise.all([myReviewQ.refetch(), router.invalidate()]);
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível remover a avaliação.");
    } finally {
      setDeleting(false);
    }
  }

  const ratingAvg = Number(c.rating_avg ?? 0);
  const ratingCount = Number(c.rating_count ?? 0);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="secondary"><LockKeyhole className="mr-1 h-3.5 w-3.5" />Área de membros do Clube</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{c.trade_name || c.name}</h1>
            {c.segment ? <p className="mt-1 text-sm text-muted-foreground">{c.segment}</p> : null}
          </div>
          <Button asChild variant="outline"><Link to="/vitrine">Voltar à Vitrine</Link></Button>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            {c.logo_url ? <img src={c.logo_url} alt={c.name} className="h-24 w-24 rounded-xl object-cover" /> : <div className="h-24 w-24 rounded-xl bg-primary/10" />}
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-muted-foreground">{c.description || c.tagline || "Empresa participante do Ecossistema Impulsionando."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(c.address_city || c.address_state) && <Badge variant="outline"><MapPin className="mr-1 h-3.5 w-3.5" />{c.address_city}{c.address_state ? `, ${c.address_state}` : ""}</Badge>}
                {ratingCount > 0 && <Badge variant="outline"><Stars value={ratingAvg} /><span className="ml-1">{ratingAvg.toFixed(1)} ({ratingCount})</span></Badge>}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {c.whatsapp ? <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${String(c.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</a></Button> : null}
                {c.instagram ? <Button asChild size="sm" variant="outline"><a href={`https://instagram.com/${String(c.instagram).replace("@", "")}`} target="_blank" rel="noopener noreferrer"><Instagram className="mr-2 h-4 w-4" />Instagram</a></Button> : null}
                {c.website ? <Button asChild size="sm" variant="outline"><a href={c.website} target="_blank" rel="noopener noreferrer"><Globe className="mr-2 h-4 w-4" />Site</a></Button> : null}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-primary text-primary-foreground">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Crown className="h-10 w-10 shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Amplie seus benefícios no Clube</h2>
              <p className="mt-1 text-sm text-white/85">O plano Free garante acesso aos detalhes da Vitrine. Planos pagos podem liberar benefícios, ofertas e experiências adicionais conforme disponibilidade.</p>
            </div>
            <Button asChild className="bg-white text-primary hover:bg-white/90"><Link to="/clube"><Heart className="mr-1 h-4 w-4" />Ver planos</Link></Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Avaliações</h2>
          <div className="mt-4 space-y-4">
            {myReviewQ.isLoading ? <p className="text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Carregando sua avaliação…</p> : null}
            {myReview && !editing ? (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><div className="text-xs uppercase tracking-wide text-primary">Sua avaliação</div><Stars value={myReview.stars} size={16} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
                    <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting}>{deleting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}Remover</Button>
                  </div>
                </div>
                {myReview.comment ? <p className="mt-2 text-sm whitespace-pre-wrap">{myReview.comment}</p> : null}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex flex-wrap items-center gap-1">
                  {[1,2,3,4,5].map((n) => <button key={n} type="button" aria-label={`${n} estrela${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} className="rounded p-1 hover:bg-muted"><Star className={n <= stars ? "h-7 w-7 fill-amber-400 text-amber-400" : "h-7 w-7 text-muted-foreground/40"} /></button>)}
                </div>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))} maxLength={COMMENT_MAX} rows={3} placeholder="Conte como foi sua experiência (opcional)" />
                {fieldError ? <p className="text-xs text-destructive">{fieldError}</p> : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || stars < 1}>{submitting ? "Salvando…" : myReview ? "Salvar alterações" : "Enviar avaliação"}</Button>
                  {editing ? <Button type="button" variant="ghost" onClick={() => { setEditing(false); setStars(myReview?.stars ?? 0); setComment(myReview?.comment ?? ""); }}>Cancelar</Button> : null}
                </div>
              </form>
            )}

            <div className="border-t pt-4 space-y-3">
              {reviews.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há avaliações publicadas.</p> : reviews.map((r: any) => <div key={r.id} className="rounded-lg border p-4"><Stars value={Number(r.stars)} />{r.comment ? <p className="mt-2 text-sm">{r.comment}</p> : null}<p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p></div>)}
            </div>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
