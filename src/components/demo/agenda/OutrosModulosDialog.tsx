import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { AgendaLog } from "@/lib/agendaLogs";

type ModuloOpcao = { slug: string; rota: string; categoria: string; nome: string; descricao: string };

const MODULOS: ModuloOpcao[] = [
  { slug: "crm", rota: "/demo/crm", categoria: "Comercial", nome: "CRM", descricao: "Pipeline, leads, tarefas e histórico de relacionamento." },
  { slug: "whatsapp", rota: "/demo/whatsapp", categoria: "Comunicação", nome: "WhatsApp Inteligente", descricao: "Conversas, automações, modelos e gatilhos." },
  { slug: "checkout", rota: "/demo/checkout", categoria: "Vendas", nome: "Checkout & Cobrança", descricao: "Cobrança, links de pagamento e recorrência." },
  { slug: "afiliados", rota: "/demo/afiliados", categoria: "Receita", nome: "Afiliados e Produtos", descricao: "Catálogo, comissões e indicações." },
  { slug: "eventos", rota: "/demo/eventos", categoria: "Operação", nome: "Eventos e Ingressos", descricao: "Eventos, lotes, ingressos e check-in." },
  { slug: "advogados", rota: "/demo/advogados", categoria: "Vertical", nome: "Advogados e Jurídico", descricao: "Processos, prazos, audiências e clientes." },
  { slug: "parceiros", rota: "/demo/parceiros", categoria: "Operação", nome: "WMP / Parceiros", descricao: "Prestação de serviços com parceiros e DJs." },
  { slug: "white-label", rota: "/demo/white-label", categoria: "Plataforma", nome: "White Label", descricao: "Sua marca, seus clientes, sua revenda." },
];

export function OutrosModulosDialog({
  open, onOpenChange, lead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: string;
}) {
  const [confirm, setConfirm] = useState<ModuloOpcao | null>(null);

  function escolher(m: ModuloOpcao) {
    setConfirm(m);
  }

  function navegar() {
    if (!confirm) return;
    AgendaLog.ctaClicado(`outros_modulos:${confirm.slug}`, lead);
    if (typeof window !== "undefined") window.location.href = confirm.rota;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Layers className="w-4 h-4" /> Outros módulos</DialogTitle>
            <DialogDescription>
              Escolha outro módulo para testar uma nova demonstração específica. Seus dados locais da Agenda
              são preservados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-2 max-h-[60vh] overflow-auto">
            {MODULOS.map((m) => (
              <Card key={m.slug} className="p-3 space-y-1 hover:border-primary/40 cursor-pointer" onClick={() => escolher(m)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{m.nome}</div>
                  <Badge variant="outline" className="text-[10px]">{m.categoria}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{m.descricao}</div>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trocar para {confirm?.nome}?</DialogTitle>
            <DialogDescription>
              Seus dados locais da Agenda permanecem salvos neste navegador. Você poderá voltar a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={navegar}>Ir para {confirm?.nome}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
