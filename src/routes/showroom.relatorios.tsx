import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/showroom/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios pré-configurados por nicho — Impulsionando" },
      {
        name: "description",
        content:
          "Relatórios prontos por segmento, com colunas certas e exportação em CSV — clínicas, bares, microcervejarias, serviços e e-commerce.",
      },
      {
        property: "og:title",
        content: "Relatórios pré-configurados por nicho — Impulsionando",
      },
      {
        property: "og:description",
        content: "Relatórios prontos por segmento com exportação em CSV.",
      },
    ],
  }),
  component: ShowroomRelatoriosPage,
});

type NichoSlug = "clinicas" | "bares" | "microcervejarias" | "servicos" | "ecommerce";

type Report = {
  id: string;
  title: string;
  description: string;
  columns: string[];
  rows: Array<Array<string | number>>;
};

const REPORTS: Record<NichoSlug, Report[]> = {
  clinicas: [
    {
      id: "consultas-mes",
      title: "Consultas por especialidade (mês)",
      description: "Volume, no-show e receita por especialidade.",
      columns: ["Especialidade", "Consultas", "No-show %", "Receita (R$)"],
      rows: [
        ["Cardiologia", 128, "6%", 38400],
        ["Ortopedia", 96, "9%", 26880],
        ["Dermatologia", 142, "4%", 35500],
        ["Pediatria", 87, "11%", 17400],
      ],
    },
    {
      id: "convenios",
      title: "Faturamento por convênio",
      description: "Glosas, prazo médio e líquido recebido.",
      columns: ["Convênio", "Procedimentos", "Glosa %", "Líquido (R$)"],
      rows: [
        ["Unimed", 312, "3,2%", 84200],
        ["Bradesco Saúde", 198, "4,1%", 52300],
        ["Particular", 287, "0%", 96100],
      ],
    },
  ],
  bares: [
    {
      id: "vendas-categoria",
      title: "Vendas por categoria",
      description: "Itens vendidos, ticket médio e margem.",
      columns: ["Categoria", "Itens", "Ticket médio (R$)", "Margem %"],
      rows: [
        ["Chopes", 1820, 18, "62%"],
        ["Drinks", 940, 32, "58%"],
        ["Cozinha", 1240, 46, "44%"],
        ["Sobremesas", 320, 22, "51%"],
      ],
    },
    {
      id: "garcom",
      title: "Performance por garçom",
      description: "Comandas, gorjeta e tempo médio.",
      columns: ["Garçom", "Comandas", "Ticket médio (R$)", "Gorjeta (R$)"],
      rows: [
        ["Lucas", 84, 92, 720],
        ["Marina", 76, 108, 810],
        ["Diego", 69, 84, 580],
      ],
    },
  ],
  microcervejarias: [
    {
      id: "producao-lote",
      title: "Produção por lote",
      description: "Rendimento, perdas e custo por litro.",
      columns: ["Lote", "Estilo", "Litros", "Perda %", "Custo/L (R$)"],
      rows: [
        ["#L-2401", "IPA", 1200, "3%", 4.8],
        ["#L-2402", "Pilsen", 1500, "2%", 3.9],
        ["#L-2403", "Stout", 800, "5%", 6.2],
      ],
    },
    {
      id: "b2b-pdv",
      title: "Vendas B2B vs PDV",
      description: "Comparativo de canais com margem.",
      columns: ["Canal", "Pedidos", "Receita (R$)", "Margem %"],
      rows: [
        ["B2B (bares)", 142, 68400, "38%"],
        ["PDV próprio", 1820, 96300, "54%"],
        ["E-commerce", 312, 21800, "47%"],
      ],
    },
  ],
  servicos: [
    {
      id: "os-status",
      title: "Ordens de serviço por status",
      description: "Volume, SLA e técnico responsável.",
      columns: ["Status", "OS", "SLA cumprido %", "Receita (R$)"],
      rows: [
        ["Concluídas", 184, "97%", 92400],
        ["Em execução", 23, "—", 0],
        ["Aguardando peça", 12, "—", 0],
        ["Canceladas", 8, "—", 0],
      ],
    },
    {
      id: "tecnico",
      title: "Produtividade por técnico",
      description: "OS finalizadas, NPS e ticket médio.",
      columns: ["Técnico", "OS", "NPS", "Ticket médio (R$)"],
      rows: [
        ["Rafael", 48, 78, 520],
        ["Camila", 52, 84, 480],
        ["Bruno", 39, 71, 610],
      ],
    },
  ],
  ecommerce: [
    {
      id: "produtos-top",
      title: "Top produtos do mês",
      description: "Unidades, receita e margem.",
      columns: ["Produto", "Unidades", "Receita (R$)", "Margem %"],
      rows: [
        ["Tênis Pro X", 420, 168000, "41%"],
        ["Camiseta Dry", 980, 78400, "52%"],
        ["Mochila Trek", 210, 63000, "46%"],
      ],
    },
    {
      id: "canais",
      title: "Aquisição por canal",
      description: "Sessões, conversão e CAC.",
      columns: ["Canal", "Sessões", "Conversão %", "CAC (R$)"],
      rows: [
        ["Google Ads", 18200, "3,8%", 28],
        ["Meta Ads", 14800, "2,9%", 34],
        ["Orgânico", 22400, "4,2%", 0],
        ["E-mail", 6200, "5,1%", 4],
      ],
    },
  ],
};

const NICHO_LABEL: Record<NichoSlug, string> = {
  clinicas: "Clínicas e Saúde",
  bares: "Bares e Restaurantes",
  microcervejarias: "Microcervejarias",
  servicos: "Serviços",
  ecommerce: "E-commerce",
};

function toCsv(report: Report): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = report.columns.map(esc).join(";");
  const body = report.rows.map((r) => r.map(esc).join(";")).join("\n");
  return `${header}\n${body}\n`;
}

function downloadCsv(report: Report, nicho: NichoSlug) {
  const blob = new Blob([toCsv(report)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nicho}_${report.id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ShowroomRelatoriosPage() {
  const [nicho, setNicho] = useState<NichoSlug>("clinicas");
  const reports = useMemo(() => REPORTS[nicho], [nicho]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="container py-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link to="/showroom" className="hover:text-foreground">Showroom</Link>
              <span>/</span>
              <span>Relatórios</span>
            </div>
            <Badge variant="secondary" className="mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> Pré-configurados
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Relatórios prontos por nicho
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Cada segmento já vem com relatórios essenciais, com as colunas certas e exportação em CSV.
              Troque o nicho para ver os relatórios incluídos no template.
            </p>
          </div>
        </section>

        <section className="container py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <span className="text-sm font-medium">Nicho:</span>
            <Select value={nicho} onValueChange={(v) => setNicho(v as NichoSlug)}>
              <SelectTrigger className="w-full md:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(NICHO_LABEL) as NichoSlug[]).map((s) => (
                  <SelectItem key={s} value={s}>{NICHO_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {reports.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg leading-tight">{r.title}</h2>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => downloadCsv(r, nicho)} className="gap-2">
                    <Download className="h-4 w-4" /> Exportar CSV
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {r.columns.map((c) => (
                          <TableHead key={c}>{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.rows.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button asChild>
              <Link to="/showroom">Voltar ao showroom</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/showroom/dashboards">Ver dashboards</Link>
            </Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
