import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  listPolos,
  upsertPolo,
  deletePolo,
} from '@/lib/educ.functions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, GraduationCap, BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/educacao/polos')({
  head: () => ({ meta: [{ title: 'Polos — Educação' }] }),
  component: PolosPage,
})

type Polo = {
  id?: string
  codigo: string
  nome: string
  cidade?: string
  estado?: string
  bairro?: string
  responsavel?: string
  telefone?: string
  email?: string
  status?: 'ativo' | 'pausado' | 'encerrado'
  capacidade?: number
  meta_matriculas_mes?: number
  cursos_ofertados?: string[]
  observacoes?: string
}

function PolosPage() {
  const fetcher = useServerFn(listPolos)
  const saver = useServerFn(upsertPolo)
  const remover = useServerFn(deletePolo)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['educ-polos'],
    queryFn: () => fetcher({}),
  })
  const rows = (data?.rows ?? []) as Polo[]
  const [editing, setEditing] = useState<Polo | null>(null)
  const [open, setOpen] = useState(false)

  const onSave = async (p: Polo) => {
    await saver({ data: p as any })
    setOpen(false)
    setEditing(null)
    qc.invalidateQueries({ queryKey: ['educ-polos'] })
  }

  const onDelete = async (id: string) => {
    if (!confirm('Remover este polo? Esta ação não pode ser desfeita.')) return
    await remover({ data: { id } })
    qc.invalidateQueries({ queryKey: ['educ-polos'] })
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2 truncate">
            <GraduationCap className="h-6 w-6 shrink-0" aria-hidden="true" /> Polos educacionais
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Gestão de polos da rede — cadastro, status, metas e cursos ofertados. Hierarquia:
            <strong> Mantenedora → Polo → Coordenador → Consultor → Aluno</strong>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link to="/educacao/dashboard" aria-label="Abrir dashboard Educação">
              <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" /> Dashboard
            </Link>
          </Button>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o)
              if (!o) setEditing(null)
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ codigo: '', nome: '' })}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Novo polo
              </Button>
            </DialogTrigger>
            <PoloDialog polo={editing} onSave={onSave} />
          </Dialog>
        </div>
      </header>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Lista de polos</caption>
          <thead className="bg-muted/50 text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Código</th>
              <th scope="col" className="px-3 py-2 font-semibold">Nome</th>
              <th scope="col" className="px-3 py-2 font-semibold">Cidade/UF</th>
              <th scope="col" className="px-3 py-2 font-semibold">Responsável</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Meta/mês</th>
              <th scope="col" className="px-3 py-2 font-semibold">Status</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Carregando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum polo cadastrado. Clique em “Novo polo” para começar.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-border/50">
                  <td className="px-3 py-2 font-mono">{p.codigo}</td>
                  <td className="px-3 py-2 font-medium">{p.nome}</td>
                  <td className="px-3 py-2">{[p.cidade, p.estado].filter(Boolean).join(' / ')}</td>
                  <td className="px-3 py-2">{p.responsavel ?? '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {p.meta_matriculas_mes ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={p.status === 'ativo' ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar polo ${p.nome}`}
                        onClick={() => {
                          setEditing(p)
                          setOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover polo ${p.nome}`}
                        onClick={() => p.id && onDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function PoloDialog({
  polo,
  onSave,
}: {
  polo: Polo | null
  onSave: (p: Polo) => Promise<void>
}) {
  const [form, setForm] = useState<Polo>(
    polo ?? {
      codigo: '',
      nome: '',
      status: 'ativo',
      cursos_ofertados: [],
    },
  )
  // Sincroniza quando reabrir com outro polo
  if (polo && polo.id !== form.id) setForm(polo)

  const set = <K extends keyof Polo>(k: K, v: Polo[K]) =>
    setForm((s) => ({ ...s, [k]: v }))

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{polo?.id ? 'Editar polo' : 'Novo polo'}</DialogTitle>
      </DialogHeader>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(form)
        }}
      >
        <Field label="Código" htmlFor="codigo" required>
          <Input
            id="codigo"
            required
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value)}
          />
        </Field>
        <Field label="Nome" htmlFor="nome" required>
          <Input
            id="nome"
            required
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
          />
        </Field>
        <Field label="Cidade" htmlFor="cidade">
          <Input
            id="cidade"
            value={form.cidade ?? ''}
            onChange={(e) => set('cidade', e.target.value)}
          />
        </Field>
        <Field label="UF" htmlFor="estado">
          <Input
            id="estado"
            maxLength={2}
            value={form.estado ?? ''}
            onChange={(e) => set('estado', e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Responsável" htmlFor="responsavel">
          <Input
            id="responsavel"
            value={form.responsavel ?? ''}
            onChange={(e) => set('responsavel', e.target.value)}
          />
        </Field>
        <Field label="Telefone" htmlFor="telefone">
          <Input
            id="telefone"
            value={form.telefone ?? ''}
            onChange={(e) => set('telefone', e.target.value)}
          />
        </Field>
        <Field label="E-mail" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Capacidade (alunos)" htmlFor="capacidade">
          <Input
            id="capacidade"
            type="number"
            min={0}
            value={form.capacidade ?? ''}
            onChange={(e) => set('capacidade', Number(e.target.value) || undefined)}
          />
        </Field>
        <Field label="Meta de matrículas/mês" htmlFor="meta">
          <Input
            id="meta"
            type="number"
            min={0}
            value={form.meta_matriculas_mes ?? ''}
            onChange={(e) =>
              set('meta_matriculas_mes', Number(e.target.value) || undefined)
            }
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <select
            id="status"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={form.status ?? 'ativo'}
            onChange={(e) => set('status', e.target.value as Polo['status'])}
          >
            <option value="ativo">Ativo</option>
            <option value="pausado">Pausado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </Field>
        <Field label="Observações" htmlFor="obs" className="md:col-span-2">
          <Textarea
            id="obs"
            value={form.observacoes ?? ''}
            onChange={(e) => set('observacoes', e.target.value)}
          />
        </Field>
        <DialogFooter className="md:col-span-2">
          <Button type="submit">{polo?.id ? 'Salvar alterações' : 'Criar polo'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function Field({
  label,
  htmlFor,
  children,
  required,
  className,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
