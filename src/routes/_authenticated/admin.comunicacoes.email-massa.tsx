import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Send, Upload, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getBulkEmailWorkspace, importBulkEmailContacts, createBulkEmailCampaign, queueBulkEmailCampaign } from '@/lib/communication-bulk-email.functions';

export const Route = createFileRoute('/_authenticated/admin/comunicacoes/email-massa')({ component: BulkEmailPage });

type Row = { name: string; email: string; phone?: string | null };

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
  const [selected,setSelected] = useState<string[]>([]);
  const [name,setName] = useState('');
  const [subject,setSubject] = useState('');
  const [body,setBody] = useState('');
  const contacts = ws.data?.contacts ?? [];
  const campaigns = ws.data?.campaigns ?? [];
  const ready = Boolean(ws.data?.emailReady);

  const imp = useMutation({ mutationFn: () => importFn({ data: { fileName, rows, confirmLawfulBasis: true } }), onSuccess: r => { toast.success(`${r.imported} novos e ${r.updated} atualizados.`); setRows([]); qc.invalidateQueries({queryKey:['bulk-email']}); }, onError:(e:Error)=>toast.error(e.message) });
  const create = useMutation({ mutationFn: () => createFn({ data: { name, subject, textBody: body, audienceMode: selected.length ? 'selected':'all', recipientIds:selected.length?selected:undefined } }), onSuccess:r=>{toast.success(`Campanha criada para ${r.eligibleRecipients} contatos.`); setName('');setSubject('');setBody('');setSelected([]);qc.invalidateQueries({queryKey:['bulk-email']});}, onError:(e:Error)=>toast.error(e.message) });
  const queue = useMutation({ mutationFn:(id:string)=>queueFn({data:{campaignId:id}}), onSuccess:r=>{toast.success(`${r.queued} e-mails enfileirados.`);qc.invalidateQueries({queryKey:['bulk-email']});}, onError:(e:Error)=>toast.error(e.message) });

  async function onFile(file?: File) { if(!file)return; setFileName(file.name); const parsed=parseCsv(await file.text()); setRows(parsed); parsed.length?toast.success(`${parsed.length} contatos válidos.`):toast.error('CSV inválido. Use Nome, Email e opcionalmente Telefone.'); }
  function toggle(id:string){ setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]); }

  return <div className="container mx-auto max-w-[1400px] p-6 space-y-6">
    <header><div className="flex items-center gap-2"><Mail className="h-6 w-6"/><h1 className="text-2xl font-bold">Contatos em Massa e E-mail</h1></div><p className="text-sm text-muted-foreground">Recurso padrão do Core Impulsionando para todos os clientes.</p></header>
    {!ready && <Card className="border-amber-300"><CardContent className="p-4 flex gap-2"><AlertTriangle className="h-5 w-5 text-amber-600"/><div><b>Disparo bloqueado até configurar o remetente.</b><div className="text-sm text-muted-foreground">{ws.data?.readinessMessage}</div></div></CardContent></Card>}
    <div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Cliente</div><b>{ws.data?.tenant?.name ?? '—'}</b></CardContent></Card><Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Contatos</div><div className="text-2xl font-bold">{contacts.length}</div></CardContent></Card><Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">E-mail</div><Badge variant={ready?'default':'destructive'}>{ready?'Pronto':'Pendente'}</Badge></CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex gap-2"><Upload className="h-5 w-5"/>Importar CSV</CardTitle></CardHeader><CardContent className="space-y-4"><Input type="file" accept=".csv,text/csv" onChange={e=>onFile(e.target.files?.[0])}/><div className="text-sm text-muted-foreground">Colunas: Nome, Email e Telefone/WhatsApp opcional. Deduplicação automática por e-mail.</div><div className="flex gap-2 items-start"><Checkbox checked={basis} onCheckedChange={v=>setBasis(Boolean(v))}/><Label>Confirmo base legal adequada para comunicação e respeito aos opt-outs.</Label></div><Button disabled={!rows.length||!basis||imp.isPending} onClick={()=>imp.mutate()}>Importar {rows.length||''} contatos</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex gap-2"><Users className="h-5 w-5"/>Base de contatos</CardTitle></CardHeader><CardContent className="max-h-80 overflow-auto space-y-2">{contacts.map((c:any)=><label key={c.id} className="flex gap-3 border rounded p-2 items-center"><Checkbox checked={selected.includes(c.id)} onCheckedChange={()=>toggle(c.id)}/><div><div className="font-medium">{c.display_name||'Sem nome'}</div><div className="text-xs text-muted-foreground">{c.email}</div></div></label>)}</CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="flex gap-2"><Send className="h-5 w-5"/>Nova campanha</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><Label>Nome</Label><Input value={name} onChange={e=>setName(e.target.value)}/></div><div><Label>Assunto</Label><Input value={subject} onChange={e=>setSubject(e.target.value)}/></div><div className="md:col-span-2"><Label>Mensagem</Label><Textarea className="min-h-36" value={body} onChange={e=>setBody(e.target.value)}/></div><div className="md:col-span-2"><Button disabled={!name||!subject||!body||create.isPending} onClick={()=>create.mutate()}>Criar campanha para {selected.length?`${selected.length} selecionados`:'todos os elegíveis'}</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Campanhas</CardTitle></CardHeader><CardContent className="space-y-2">{campaigns.map((c:any)=><div key={c.id} className="flex items-center justify-between border rounded p-3"><div><b>{c.name}</b><div className="text-xs text-muted-foreground">{c.status}</div></div><Button size="sm" disabled={!ready||!['draft','scheduled'].includes(c.status)||queue.isPending} onClick={()=>queue.mutate(c.id)}><Send className="h-4 w-4 mr-1"/>Disparar</Button></div>)}</CardContent></Card>
  </div>;
}
