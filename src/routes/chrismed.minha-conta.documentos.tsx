import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, FileText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

type Doc = {
  id: string;
  file_name: string;
  document_type: string;
  modified_time: string | null;
  release_policy: string;
  mime_type: string | null;
};

export const Route = createFileRoute('/chrismed/minha-conta/documentos')({
  component: PatientDriveDocumentsPage,
  head: () => ({ meta: [{ title: 'Meus documentos — CHRISMED' }, { name: 'robots', content: 'noindex,nofollow' }] }),
});

function PatientDriveDocumentsPage() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      navigate({ to: '/auth?persona=patient&next=%2Fminha-conta%2Fdocumentos' as never });
      return;
    }

    const { data: links, error: linkError } = await (supabase as any)
      .from('client_drive_document_links')
      .select('drive_document_id')
      .eq('entity_type', 'patient')
      .eq('entity_id', auth.user.id)
      .eq('release_to_entity', true);

    if (linkError) {
      console.error('[CHRISMED patient Drive links]', linkError);
      setLoading(false);
      toast.error('Não foi possível carregar seus documentos agora.');
      return;
    }

    const ids = (links ?? []).map((item: { drive_document_id: string }) => item.drive_document_id);
    if (!ids.length) {
      setDocs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from('client_drive_documents')
      .select('id,file_name,document_type,modified_time,release_policy,mime_type')
      .in('id', ids)
      .eq('status', 'active')
      .order('modified_time', { ascending: false });

    setLoading(false);
    if (error) {
      console.error('[CHRISMED patient Drive documents]', error);
      toast.error('Não foi possível carregar seus documentos agora.');
      return;
    }
    setDocs((data ?? []) as Doc[]);
  }

  useEffect(() => { void load(); }, []);

  async function download(doc: Doc) {
    setBusy(doc.id);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Sua sessão expirou. Entre novamente na Área do Paciente.');
      const response = await fetch('/api/chrismed/documents/deliver', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      });
      if (!response.ok) throw new Error('Este documento não está autorizado para esta conta.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.file_name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível baixar o documento.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ChrismedShell>
      <main className="min-h-[70vh] bg-[var(--chrismed-ivory)]">
        <div className="container max-w-6xl py-10">
          <Link to="/chrismed/minha-conta" className="mb-4 inline-flex items-center text-sm text-[var(--chrismed-forest-deep)]"><ArrowLeft className="mr-1 h-4 w-4" />Voltar à Área do Paciente</Link>
          <header className="rounded-3xl bg-[var(--chrismed-forest-deep)] p-7 text-white">
            <Badge className="mb-3 bg-white/10 text-white">Área protegida</Badge>
            <h1 className="chrismed-serif flex items-center gap-3 text-4xl"><FileText className="h-8 w-8" />Meus documentos CHRISMED</h1>
            <p className="mt-3 max-w-3xl text-white/75">Notas fiscais e documentos liberados especificamente para a sua conta. Um documento só aparece aqui quando existe vínculo explícito com o seu usuário autenticado.</p>
          </header>

          <div className="mt-6 rounded-2xl border border-[var(--chrismed-sand)] bg-white p-4 text-sm text-[var(--chrismed-graphite)]"><ShieldCheck className="mr-2 inline h-4 w-4" />A entrega é validada novamente no servidor antes de cada download. O link do Google Drive nunca é exposto diretamente.</div>

          {loading ? <p className="py-14 text-center">Carregando documentos…</p> : !docs.length ? (
            <Card className="mt-6"><CardContent className="py-14 text-center text-[var(--chrismed-graphite)]">Nenhum documento do Google Drive foi liberado para a sua conta até o momento.</CardContent></Card>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {docs.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader><CardTitle className="flex items-start gap-2 text-lg"><FileText className="mt-0.5 h-5 w-5" /><span>{doc.file_name}</span></CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2"><Badge variant="outline">{doc.document_type}</Badge><Badge variant="outline">{doc.release_policy}</Badge></div>
                    <p className="text-xs text-[var(--chrismed-graphite)]">Atualizado: {doc.modified_time ? new Date(doc.modified_time).toLocaleString('pt-BR') : '—'}</p>
                    <Button onClick={() => void download(doc)} disabled={busy === doc.id} className="w-full bg-[var(--chrismed-forest-deep)] text-white"><Download className="mr-2 h-4 w-4" />{busy === doc.id ? 'Preparando…' : 'Baixar documento'}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </ChrismedShell>
  );
}
