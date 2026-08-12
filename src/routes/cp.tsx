import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Ban,
  Clock3,
  EyeOff,
  FileWarning,
  KeyRound,
  LockKeyhole,
  MessageSquareLock,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/cp")({
  component: CpProductPage,
  head: () => ({
    meta: [
      { title: "CP — Chat Privado | Impulsionando Tecnologia" },
      {
        name: "description",
        content:
          "CP — Chat Privado: comunicação de alta discrição, conteúdo cifrado, retenção parametrizável, exclusão controlada e nenhuma exportação nativa de conversas.",
      },
      { property: "og:title", content: "CP — Chat Privado | Impulsionando Tecnologia" },
      {
        property: "og:description",
        content:
          "Um ambiente privado para conversas que não devem circular fora do próprio CP.",
      },
    ],
  }),
});

const protections = [
  {
    icon: KeyRound,
    title: "Conteúdo cifrado",
    text: "A arquitetura do CP foi desenhada para armazenar mensagens como conteúdo cifrado, nunca como texto aberto no banco de dados.",
  },
  {
    icon: Clock3,
    title: "Retenção sob controle",
    text: "Políticas de 24h, 48h, 7 dias, 30 dias, período personalizado ou exclusão manual, respeitando os limites definidos pela empresa.",
  },
  {
    icon: Ban,
    title: "Sem exportação nativa",
    text: "O produto não oferece exportação de conversa, PDF, CSV, encaminhamento ou mecanismo de backup pessoal do histórico.",
  },
  {
    icon: EyeOff,
    title: "Privacidade visual",
    text: "Modo de proteção visual, ocultação ao perder foco, notificações sem conteúdo sensível e barreiras contra cópia, impressão e compartilhamento acidental.",
  },
  {
    icon: Trash2,
    title: "Descarte controlado",
    text: "Mensagens expiradas entram em fluxo de eliminação irreversível, com desenho preparado para descarte criptográfico das chaves e posterior remoção física.",
  },
  {
    icon: Smartphone,
    title: "Proteção por dispositivo",
    text: "Sessões e dispositivos podem ser administrados separadamente. Em aplicativos nativos, o CP pode usar proteções adicionais oferecidas pelo sistema operacional.",
  },
];

function CpProductPage() {
  return (
    <main className="min-h-screen bg-[#061311] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(0,173,166,.22),transparent_35%),linear-gradient(180deg,#071c18,#061311)] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <Badge className="mb-5 border border-[#24c8bf]/30 bg-[#0d3934] text-[#8ff1ec] hover:bg-[#0d3934]">
            Produto Impulsionando Tecnologia
          </Badge>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3 text-[#74ded8]">
                <MessageSquareLock className="h-8 w-8" />
                <span className="text-sm font-semibold uppercase tracking-[.2em]">CP — Chat Privado</span>
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
                Conversas privadas foram feitas para permanecer privadas.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
                O CP é o ambiente de comunicação de alta discrição da Impulsionando. A proposta não é criar mais um mensageiro: é reduzir drasticamente as possibilidades de uma conversa sair do ambiente em que foi criada.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-[#11aaa3] text-white hover:bg-[#0d8f89]">
                  <Link to="/orcamento">Quero o CP na minha empresa</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/auth">Já sou cliente</Link>
                </Button>
              </div>
            </div>

            <Card className="border-white/10 bg-white/[.06] text-white shadow-2xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-[#54d9d2]" /> Princípio de privacidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-white/70">
                <p>O servidor não deve precisar conhecer o conteúdo de uma conversa para entregá-la ao destinatário.</p>
                <p>O CP foi estruturado para trabalhar com mensagem cifrada, retenção mínima e ausência de exportação nativa.</p>
                <p className="rounded-xl border border-amber-400/20 bg-amber-300/10 p-4 text-amber-50">
                  Nenhum sistema web consegue impedir de forma absoluta que alguém fotografe uma tela com outro dispositivo. O CP aplica proteção, dissuasão e redução de superfície de vazamento sem fazer uma promessa tecnicamente impossível.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#58dcd5]">Privacidade por arquitetura</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Menos circulação. Menos persistência. Menos exposição.</h2>
            <p className="mt-4 text-white/65">Cada recurso do CP parte da pergunta: esta informação realmente precisa existir, por quanto tempo e quem realmente precisa vê-la?</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {protections.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-white/10 bg-white/[.04] text-white">
                <CardHeader>
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-[#0c3430] text-[#65e3dc]"><Icon className="h-5 w-5" /></div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-white/60">{text}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#58dcd5]">Parametrização</p>
            <h2 className="mt-3 text-3xl font-bold">A empresa define a política. A conversa respeita o limite.</h2>
            <p className="mt-4 leading-7 text-white/65">
              A gestão pode estabelecer o teto de retenção permitido. O usuário ou a conversa pode escolher um prazo mais curto, nunca ampliar silenciosamente o prazo corporativo. Aumentar retenção deve exigir regra e transparência; reduzir retenção deve ser simples.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["24 horas", "48 horas", "7 dias", "30 dias", "Personalizado", "Manual"].map((label) => (
                <span key={label} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/75">{label}</span>
              ))}
            </div>
          </div>
          <Card className="border-white/10 bg-[#0a1c19] text-white">
            <CardHeader><CardTitle className="flex gap-2"><LockKeyhole className="h-5 w-5 text-[#58dcd5]" /> O que o CP não deve fazer</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-white/65">
              <p>• Não disponibilizar botão de exportar conversa.</p>
              <p>• Não encaminhar conteúdo para e-mail ou WhatsApp.</p>
              <p>• Não colocar texto de mensagem em analytics, logs, push ou ferramentas de observabilidade.</p>
              <p>• Não oferecer leitura administrativa silenciosa de conteúdo quando a conversa estiver sob criptografia de ponta a ponta.</p>
              <p>• Não utilizar conteúdo privado para treinamento, publicidade ou enriquecimento de perfil.</p>
              <p>• Não mostrar conteúdo da mensagem na notificação por padrão.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#58dcd5]">Termos essenciais do produto</p>
            <h2 className="mt-3 text-3xl font-bold">Contrato de privacidade claro antes de entrar.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/10 bg-white/[.04] text-white">
              <CardHeader><CardTitle>Compromissos do CP</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-white/65">
                <p><strong className="text-white">Confidencialidade:</strong> o produto é desenhado para minimizar a exposição do conteúdo e de seus metadados.</p>
                <p><strong className="text-white">Retenção:</strong> o prazo aplicável deve ser exibido aos participantes e controlado segundo a política da empresa e da conversa.</p>
                <p><strong className="text-white">Exclusão:</strong> após o prazo aplicável, o conteúdo deixa de ficar disponível e entra no processo técnico de descarte. A arquitetura deve privilegiar destruição de chaves para tornar cópias cifradas remanescentes inutilizáveis.</p>
                <p><strong className="text-white">Exportação:</strong> não há recurso nativo de exportação, encaminhamento ou geração de cópia legível da conversa.</p>
                <p><strong className="text-white">Chaves:</strong> em E2EE, chaves privadas não devem ser armazenadas em formato utilizável pelo servidor.</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[.04] text-white">
              <CardHeader><CardTitle className="flex gap-2"><FileWarning className="h-5 w-5 text-amber-300" /> Limites e responsabilidades</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-white/65">
                <p><strong className="text-white">Captura de tela:</strong> o CP utiliza mecanismos de proteção disponíveis em cada plataforma, mas não pode impedir uma fotografia externa da tela.</p>
                <p><strong className="text-white">Dispositivo comprometido:</strong> malware, acesso físico ou um sistema operacional comprometido pode ultrapassar proteções do aplicativo.</p>
                <p><strong className="text-white">Recuperação:</strong> privacidade forte pode limitar a recuperação de conteúdo quando uma chave é perdida ou destruída.</p>
                <p><strong className="text-white">Uso legal:</strong> o produto não autoriza atividade ilícita. Qualquer mecanismo de denúncia deve ser explícito e jamais criar uma porta secreta de leitura de todas as conversas.</p>
                <p><strong className="text-white">LGPD:</strong> contratos empresariais devem definir papéis, finalidades, retenção e responsabilidades do cliente e da Impulsionando conforme cada implantação.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#27bdb5]/20 bg-gradient-to-r from-[#0b3934] to-[#082621] p-8 sm:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#83eee8]">CP — Chat Privado</p>
            <h2 className="mt-3 text-3xl font-bold">Discrição não é um botão. É uma arquitetura inteira.</h2>
            <p className="mt-4 text-white/70">O CP combina política, criptografia, retenção curta, desenho de interface e redução deliberada de recursos que poderiam retirar uma conversa do ambiente protegido.</p>
            <Button asChild size="lg" className="mt-7 bg-white text-[#082621] hover:bg-white/90"><Link to="/orcamento">Falar sobre implantação</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}
