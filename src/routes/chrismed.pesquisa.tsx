import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { CheckCircle2, Loader2, MessageSquareHeart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const searchSchema = z.object({ token: fallback(z.string().uuid().optional(), undefined) });

type Question = {
  key?: string;
  id?: string;
  label?: string;
  question?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

type SurveyForm = {
  survey_id: string;
  audience_type: string;
  recipient_name: string | null;
  completed: boolean;
  questions: Question[];
};

export const Route = createFileRoute('/chrismed/pesquisa')({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: 'Pesquisa de experiência · CHRISMED' },
      { name: 'description', content: 'Conte para a CHRISMED como foi sua experiência. Sua opinião orienta melhorias reais no atendimento e nos eventos.' },
    ],
  }),
  component: ChrismedSurveyPage,
});

function ChrismedSurveyPage() {
  const { token } = useSearch({ from: '/chrismed/pesquisa' });
  const [form, setForm] = useState<SurveyForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [nps, setNps] = useState<number | null>(null);
  const [csat, setCsat] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setLoading(false); return; }
      const { data, error } = await (supabase as any).rpc('chrismed_get_survey_form', { p_token: token });
      if (cancelled) return;
      if (error || !data) {
        setForm(null);
      } else {
        setForm(data as SurveyForm);
        if ((data as SurveyForm).completed) setDone(true);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const dynamicQuestions = useMemo(() => Array.isArray(form?.questions) ? form!.questions : [], [form]);

  async function submit() {
    if (!token || !form) return;
    const missingRequired = dynamicQuestions.find((q, index) => {
      if (!q.required) return false;
      const key = q.key ?? q.id ?? `q_${index}`;
      return answers[key] === undefined || answers[key] === '';
    });
    if (missingRequired) {
      toast.error('Responda às perguntas obrigatórias antes de enviar.');
      return;
    }
    setSubmitting(true);
    const payload = { ...answers, comments: comments.trim() || undefined };
    const { data, error } = await (supabase as any).rpc('chrismed_submit_experience_survey', {
      p_token: token,
      p_answers: payload,
      p_nps: nps,
      p_csat: csat,
    });
    setSubmitting(false);
    if (error || !data?.saved) {
      toast.error('Não foi possível salvar sua pesquisa agora.');
      return;
    }
    setDone(true);
  }

  return (
    <ChrismedShell variant="minimal">
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 md:px-6">
        {loading ? (
          <div className="mx-auto flex items-center gap-3 text-sm text-[var(--chrismed-graphite)]"><Loader2 className="h-5 w-5 animate-spin" /> Carregando sua pesquisa…</div>
        ) : !token || !form ? (
          <Card className="w-full border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]"><CardContent className="p-8 text-center"><h1 className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Pesquisa não encontrada</h1><p className="mt-3 text-sm text-[var(--chrismed-graphite)]">O link pode estar incorreto ou não estar mais disponível.</p></CardContent></Card>
        ) : done ? (
          <Card className="w-full border-emerald-200 bg-white"><CardContent className="p-9 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" /><h1 className="chrismed-serif mt-4 text-3xl text-[var(--chrismed-ink)]">Muito obrigado.</h1><p className="mt-3 text-sm leading-6 text-[var(--chrismed-graphite)]">Sua opinião foi registrada e passa a fazer parte da melhoria contínua da experiência CHRISMED.</p></CardContent></Card>
        ) : (
          <Card className="w-full border-[var(--chrismed-sand)] bg-white shadow-sm">
            <CardHeader className="border-b border-[var(--chrismed-sand)] bg-[var(--chrismed-ivory)]">
              <div className="flex items-start gap-3"><MessageSquareHeart className="mt-1 h-6 w-6 text-[var(--chrismed-forest)]" /><div><CardTitle className="chrismed-serif text-3xl text-[var(--chrismed-ink)]">Como foi sua experiência?</CardTitle><p className="mt-2 text-sm leading-6 text-[var(--chrismed-graphite)]">{form.recipient_name ? `${form.recipient_name}, ` : ''}queremos entender o que funcionou bem e o que pode ser melhor. Suas respostas ajudam a CHRISMED a melhorar atendimento, eventos, estrutura e comunicação.</p></div></div>
            </CardHeader>
            <CardContent className="space-y-7 p-6 md:p-8">
              {dynamicQuestions.map((q, index) => {
                const key = q.key ?? q.id ?? `q_${index}`;
                const label = q.label ?? q.question ?? `Pergunta ${index + 1}`;
                const type = q.type ?? 'rating';
                if (type === 'text' || type === 'textarea') {
                  return <div key={key}><Label>{label}{q.required ? ' *' : ''}</Label><Textarea className="mt-2" value={String(answers[key] ?? '')} onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))} /></div>;
                }
                const min = q.min ?? 1;
                const max = q.max ?? 5;
                return <RatingQuestion key={key} label={label} min={min} max={max} value={typeof answers[key] === 'number' ? Number(answers[key]) : null} onChange={(value) => setAnswers((prev) => ({ ...prev, [key]: value }))} />;
              })}

              <RatingQuestion label="De 0 a 10, quanto você recomendaria a CHRISMED para alguém?" min={0} max={10} value={nps} onChange={setNps} />
              <RatingQuestion label="Em uma escala de 1 a 5, qual sua satisfação geral?" min={1} max={5} value={csat} onChange={setCsat} />

              <div><Label>Quer deixar algum comentário, elogio ou sugestão?</Label><Textarea className="mt-2" rows={4} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Conte o que faria diferença para você numa próxima experiência." /></div>

              <Button className="w-full bg-[var(--chrismed-ink)] text-white hover:bg-[var(--chrismed-forest)]" disabled={submitting} onClick={() => void submit()}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar pesquisa</Button>
              <p className="text-center text-[11px] leading-5 text-[var(--chrismed-mist)]">As respostas são usadas para melhoria da experiência e gestão de qualidade da CHRISMED.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </ChrismedShell>
  );
}

function RatingQuestion({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number | null; onChange: (value: number) => void }) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return <div><Label>{label}</Label><div className="mt-3 flex flex-wrap gap-2">{values.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-medium transition ${value === item ? 'border-[var(--chrismed-ink)] bg-[var(--chrismed-ink)] text-white' : 'border-[var(--chrismed-sand)] bg-white text-[var(--chrismed-ink)] hover:border-[var(--chrismed-champagne-deep)]'}`}>{item}</button>)}</div></div>;
}
