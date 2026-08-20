import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Mail, Send, Upload, Users, AlertTriangle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBulkEmailWorkspace, importBulkEmailContacts, createBulkEmailCampaign, queueBulkEmailCampaign } from '@/lib/communication-bulk-email.functions';

export const Route = createFileRoute('/_authenticated/admin/comunicacoes/email-massa')({ component: BulkEmailPage });

type AudienceCategory = 'professional'|'company'|'occupational'|'patient'|'event'|'laboratory'|'partner';
type Row = { name: string; email: string; phone?: string | null };

const categoryLabels: Record<AudienceCategory,string> = {
  professional:'Profissionais da saúde', company:'Empresas', occupational:'Medicina ocupacional', patient:'Pacientes', event:'Eventos', laboratory:'Laboratórios', partner:'Parceiros',
};

function parseCsv(text: string): Row[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(v => v.trim().toLowerCase());
  const ni = headers.findIndex(v => ['nome','name'].includes(v));
  const ei = headers.findIndex(v => ['email','e-mail'].includes(v));
  const pi = headers.findIndex(v => ['telefone','celular','phone','whatsapp'].includes(v));
  if (ni < 0 || ei < 0) return [];
  return lines.slice(1).map(line => {
    const c = line.split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
    return { name: c[ni] || '', email: (c[ei] || '').toLowerCase(), phone: pi >= 0 ? c[pi] || null : null };
  }).filter(r => r.name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
}

function BulkEmailPage() {
  const qc = useQueryClient();
  const getWs = useServerFn(getBulkEmailWorkspace);
  const importFn = useServerFn(importBulkEmailContacts);
  const createFn = useServerFn(createBulkEmailCampaign);
  const queueFn = useServerFn(queueBulkEmailCampaign);
  const ws = useQuery({ queryKey: ['bulk-email'], queryFn: () => getWs() });
  const [rows,setRows] = useState<Row[]>([]);
  const [fileName,setFileName] = useState('contatos.csv');
  const [basis,setBasis] = useState(false);
  const [category,setCategory] = useState<AudienceCategory>('professional');
  const [filterCategory,setFilterCategory] = useState<AudienceCategory|'all'>('all');
  const [selected,setSelected] = useState<string[]>([]);
  const [name,setName] = useState('');
  const [subject,setSubject] = useState('');
  const [body,setBody] = useState('');
  const contacts = ws.data?.contacts ?? [];
  const campaigns = ws.data?.campaigns ?? [];
  const ready = Boolean(ws.data?.emailReady);
  const visibleContacts = useMemo(() => filterCategory === 'all' ? contacts : contacts.filter((c:any)=>String(c.attributes?.category||'')===filterCategory),[contacts,filterCategory]);

  const imp = useMutation({ mutationFn: () => importFn({ data: { fileName, rows: rows.map(r=>({...r,attributes:{category}})), confirmLawfulBasis: true } }), onSuccess: r => { toast.success(`${r.imported} novos e ${r.updated} atualizados em ${categoryLabels[category]}.`); setRows([]); qc.invalidateQueries({queryKey:['bulk-email']}); }, onError:(e:Error)=>toast.error(e.message) });
  const create = useMutation({ mutationFn: () => createFn({ data: { name, subject, textBody: body, audienceMode: selected.length ? 'selected':'all', recipientIds:selected.length?selected:undefined, audienceCategory:selected.length?undefined:(filterCategory==='all'?undefined:filterCategory) } }), onSuccess:r=>{toast.success(`Campanha criada para ${r.eligibleRecipients} contatos.`); setName('');setSubject('');setBody('');setSelected([]);qc.invalidateQueries({queryKey:['bulk-email']});}, onError:(e:Error)=>toast.error(e.message) });
  const queue = useMutation({ mutationFn:(id:string)=>queueFn({data:{campaignId:id}}), onSuccess:r=>{toast.success(`${r.queued} e-mails enfileirados.`);qc.invalidateQueries({queryKey:['bulk-email']});}, onError:(e:Error)=>toast.error(e.message) });

  async function onFile(file?: File) { if(!file)return; setFileName(file.name); const parsed=parseCsv(await file.text()); setRows(parsed); parsed.length?toast.success(`${parsed.length} contatos válidos para revisão.`):toast.error('CSV inválido. Use Nome, Email e opcionalmente Telefone.'); }
  function toggle(id:string){ setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]); }
  function selectVisible(){ setSelected(Array.from(new Set([...selected,...visibleContacts.map((c:any)=>String(c.id))]))); }

  return <div className="container mx-auto max-w-[1400px] space-y-6 p-6">
    <header><div className="flex items-center gap-2"><Mail className="h-6 w-6"/><h1 className="text-2xl font-bold">Contatos em Massa e E-mail</h1></div><p className="text-sm text-muted-foreground">Importe bases segmentadas, preserve consentimentos e dispare campanhas auditáveis pelo Core Impulsionando.</p></header>
    {!ready && <Card className="border-amber-300"><CardContent className="flex gap-2 p-4"><AlertTriangle className="h-5 w-5 text-amber-600"/><div><b>Disparo bloqueado até configurar o remetente.</b><div className="text-sm text-muted-foreground">{ws.data?.readinessMessage}</div></div></CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Cliente</div><b>{ws.data?.tenant?.name ?? '—'}</b></CardContent></Card><Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Contatos</div><div className="text-2xl font-bold">{contacts.length}</div></CardContent></Card><Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">E-mail</div><Badge variant={ready?'default':'destructive'}>{ready?'Pronto':'Pendente'}</Badge></CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex gap-2"><Upload className="h-5 w-5"/>Importar planilha CSV</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Categoria da base</Label><Select value={category} onValueChange={v=>setCategory(v as AudienceCategory)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div><Input type="file" accept=".csv,text/csv" onChange={e=>void onFile(e.target.files?.[0])}/><div className="text-sm text-muted-foreground">Colunas: Nome, Email e Telefone/WhatsApp opcional. A categoria escolhida é gravada em cada contato. Deduplicação automática por e-mail.</div>{rows.length>0&&<div className="rounded-xl border bg-muted/30 p-3 text-sm"><strong>{rows.length}</strong> registros válidos aguardando importação como <strong>{categoryLabels[category]}</strong>.</div>}<div className="flex items-start gap-2"><Checkbox checked={basis} onCheckedChange={v=>setBasis(Boolean(v))}/><Label>Confirmo base legal adequada para comunicação e respeito aos opt-outs e supressões.</Label></div><Button disabled={!rows.length||!basis||imp.isPending} onClick={()=>imp.mutate()}>Importar {rows.length||''} contatos</Button></CardContent></Card>
      <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex gap-2"><Users className="h-5 w-5"/>Base de contatos</CardTitle><div className="flex gap-2"><Select value={filterCategory} onValueChange={v=>setFilterCategory(v as AudienceCategory|'all')}><SelectTrigger className="w-[210px]"><Filter className="mr-2 h-4 w-4"/><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{Object.entries(categoryLabels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={selectVisible}>Selecionar visíveis</Button></div></div></CardHeader><CardContent className="max-h-80 space-y-2 overflow-auto">{visibleContacts.map((c:any)=><label key={c.id} className="flex items-center gap-3 rounded border p-2"><Checkbox checked={selected.includes(c.id)} onCheckedChange={()=>toggle(c.id)}/><div className="min-w-0 flex-1"><div className="font-medium">{c.display_name||'Sem nome'}</div><div className="truncate text-xs text-muted-foreground">{c.email}</div></div>{c.attributes?.category&&<Badge variant="outline">{categoryLabels[c.attributes.category as AudienceCategory]||c.attributes.category}</Badge>}</label>)}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="flex gap-2"><Send className="h-5 w-5"/>Nova campanha</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><Label>Nome</Label><Input value={name} onChange={e=>setName(e.target.value)}/></div><div><Label>Assunto</Label><Input value={subject} onChange={e=>setSubject(e.target.value)}/></div><div className="md:col-span-2"><Label>Mensagem</Label><Textarea className="min-h-36" value={body} onChange={e=>setBody(e.target.value)}/></div><div className="md:col-span-2 flex flex-wrap items-center gap-3"><Button disabled={!name||!subject||!body||create.isPending} onClick={()=>create.mutate()}>Criar campanha para {selected.length?`${selected.length} selecionados`:filterCategory==='all'?'todos os elegíveis':categoryLabels[filterCategory]}</Button><span className="text-xs text-muted-foreground">Opt-outs e supressões são aplicados no backend.</span></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Campanhas</CardTitle></CardHeader><CardContent className="space-y-2">{campaigns.map((c:any)=><div key={c.id} className="flex items-center justify-between rounded border p-3"><div><b>{c.name}</b><div className="text-xs text-muted-foreground">{c.status}{c.metadata?.audience_category?` · ${categoryLabels[c.metadata.audience_category as AudienceCategory]||c.metadata.audience_category}`:''}</div></div><Button size="sm" disabled={!ready||!['draft','scheduled'].includes(c.status)||queue.isPending} onClick={()=>queue.mutate(c.id)}><Send className="mr-1 h-4 w-4"/>Disparar</Button></div>)}</CardContent></Card>
  </div>;
}
