import { createFileRoute, Link } from '@tanstack/react-router';
import { ChrismedShell } from '@/components/chrismed/ChrismedShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarCheck, Receipt, UserRound, Info, Video, MapPin, Home, ArrowRight, Download } from 'lucide-react';

export const Route = createFileRoute('/chrismed/minha-conta')({
  head: () => ({
    meta: [
      { title: 'Minha área — CrisMed' },
      { name: 'description', content: 'Suas consultas, pagamentos e dados cadastrais CrisMed.' },
      { property: 'og:title', content: 'Minha área · CrisMed' },
      { property: 'og:description', content: 'Central do paciente CrisMed.' },
    ],
  }),
  component: MinhaContaPage,
});

/* Mock — dados reais virão do backend após integração com auth do paciente (Pendente Codex). */
const MOCK_APPOINTMENTS = [
  { id: 'ag-001', when: 'Sex, 18/07 · 14:00', doctor: 'Dra. Cristiane Alencar', spec: 'Clínica Médica', modality: 'presencial', unit: 'Consultório Copacabana', status: 'confirmado' as const },
  { id: 'ag-002', when: 'Qua, 30/07 · 10:00', doctor: 'Cardiologia parceira', spec: 'Cardiologia', modality: 'telemedicina', unit: 'Vídeo', status: 'aguardando' as const },
];
const MOCK_PAYMENTS = [
  { id: 'pg-001', date: '11/07/2026', desc: 'Consulta clínica presencial', amount: 'R$ 480,00', method: 'PIX', status: 'pago' as const },
  { id: 'pg-002', date: '30/07/2026', desc: 'Consulta cardiologia · vídeo', amount: 'R$ 520,00', method: 'PIX', status: 'pendente' as const },
];

const MOD_ICON = { presencial: MapPin, telemedicina: Video, domiciliar: Home } as const;

function MinhaContaPage() {
  return (
    <ChrismedShell>
      <section className="border-b border-emerald-900/10 bg-gradient-to-b from-[#fbf9f4] to-[#f3ede0]/40">
        <div className="container py-14 max-w-5xl">
          <Badge className="bg-emerald-900/5 text-emerald-900 border border-emerald-900/10 mb-4 uppercase tracking-[0.18em] text-[10px]">Minha área</Badge>
          <h1 className="font-serif text-4xl md:text-5xl text-emerald-950 leading-[1.05]">Bem-vindo(a) de volta</h1>
          <p className="mt-4 text-emerald-900/75 max-w-2xl">Acompanhe suas consultas, pagamentos e mantenha seus dados atualizados.</p>
          <div className="mt-5 rounded-lg border border-emerald-900/10 bg-white/60 px-4 py-2.5 text-[11px] text-emerald-900/70 flex items-start gap-1.5 max-w-2xl">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Dados exibidos são demonstrativos. Integração com autenticação do paciente e histórico real está pendente Codex.
          </div>
        </div>
      </section>

      <section className="container py-10 max-w-5xl">
        <Tabs defaultValue="agendamentos">
          <TabsList className="bg-emerald-900/5 border border-emerald-900/10">
            <TabsTrigger value="agendamentos" className="gap-1.5"><CalendarCheck className="h-4 w-4" />Agendamentos</TabsTrigger>
            <TabsTrigger value="pagamentos" className="gap-1.5"><Receipt className="h-4 w-4" />Pagamentos</TabsTrigger>
            <TabsTrigger value="dados" className="gap-1.5"><UserRound className="h-4 w-4" />Meus dados</TabsTrigger>
          </TabsList>

          {/* Agendamentos */}
          <TabsContent value="agendamentos" className="mt-6 space-y-3">
            {MOCK_APPOINTMENTS.length === 0 ? (
              <EmptyState title="Nenhum agendamento por aqui" cta />
            ) : MOCK_APPOINTMENTS.map((a) => {
              const Icon = MOD_ICON[a.modality as keyof typeof MOD_ICON] ?? MapPin;
              return (
                <article key={a.id} className="rounded-2xl border border-emerald-900/10 bg-white p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-emerald-900/70 text-xs">
                      <Icon className="h-3.5 w-3.5" /> {a.modality} · {a.unit}
                    </div>
                    <h3 className="mt-1 font-serif text-lg text-emerald-950">{a.when}</h3>
                    <p className="text-sm text-emerald-900/80">{a.doctor} · {a.spec}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={a.status} />
                    <Button variant="outline" size="sm">Detalhes</Button>
                  </div>
                </article>
              );
            })}
            <div className="pt-2">
              <Link to="/chrismed/agendar"><Button className="bg-emerald-900 hover:bg-emerald-950 text-amber-50 gap-1.5">Agendar nova consulta <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos" className="mt-6 space-y-3">
            {MOCK_PAYMENTS.length === 0 ? (
              <EmptyState title="Nenhum pagamento registrado" />
            ) : (
              <div className="rounded-2xl border border-emerald-900/10 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-900/5 text-emerald-900/70 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Data</th>
                      <th className="text-left px-4 py-3">Descrição</th>
                      <th className="text-left px-4 py-3">Método</th>
                      <th className="text-right px-4 py-3">Valor</th>
                      <th className="text-right px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PAYMENTS.map((p) => (
                      <tr key={p.id} className="border-t border-emerald-900/10">
                        <td className="px-4 py-3 text-emerald-900/80">{p.date}</td>
                        <td className="px-4 py-3 text-emerald-950">{p.desc}</td>
                        <td className="px-4 py-3 text-emerald-900/80">{p.method}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-950">{p.amount}</td>
                        <td className="px-4 py-3 text-right"><StatusPill status={p.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />Recibo</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-emerald-900/55 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Recibos e notas fiscais geradas automaticamente após conciliação (pendente Codex).
            </p>
          </TabsContent>

          {/* Dados */}
          <TabsContent value="dados" className="mt-6">
            <form className="rounded-2xl border border-emerald-900/10 bg-white p-6 grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => e.preventDefault()}>
              <div className="sm:col-span-2"><Label>Nome completo</Label><Input defaultValue="—" /></div>
              <div><Label>E-mail</Label><Input type="email" defaultValue="—" /></div>
              <div><Label>Telefone</Label><Input defaultValue="—" /></div>
              <div><Label>CPF</Label><Input defaultValue="—" /></div>
              <div><Label>Data de nascimento</Label><Input type="date" /></div>
              <div className="sm:col-span-2"><Label>Endereço</Label><Input defaultValue="—" /></div>
              <div className="sm:col-span-2 flex items-center justify-between pt-2">
                <p className="text-[11px] text-emerald-900/55">Persistência dos dados vinculada ao login do paciente — pendente Codex.</p>
                <Button type="submit" className="bg-emerald-900 hover:bg-emerald-950 text-amber-50">Salvar alterações</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </section>
    </ChrismedShell>
  );
}

function StatusPill({ status }: { status: 'confirmado' | 'aguardando' | 'pago' | 'pendente' | 'cancelado' }) {
  const map: Record<string, string> = {
    confirmado: 'bg-emerald-900 text-amber-50 border-emerald-900',
    pago: 'bg-emerald-900 text-amber-50 border-emerald-900',
    aguardando: 'bg-amber-100 text-amber-900 border-amber-200',
    pendente: 'bg-amber-100 text-amber-900 border-amber-200',
    cancelado: 'bg-red-50 text-red-700 border-red-200',
  };
  return <span className={'text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5 ' + map[status]}>{status}</span>;
}

function EmptyState({ title, cta }: { title: string; cta?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-900/15 bg-white p-10 text-center">
      <p className="text-emerald-900/70">{title}</p>
      {cta && (
        <Link to="/chrismed/agendar" className="inline-block mt-4">
          <Button className="bg-emerald-900 hover:bg-emerald-950 text-amber-50 gap-1.5">Agendar consulta <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      )}
    </div>
  );
}
