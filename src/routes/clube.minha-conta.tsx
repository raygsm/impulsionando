import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, User, Bell, Gift, Route as RouteIcon, ClipboardList, Heart, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
import { getMyConsumerArea } from "@/lib/consumer.functions";

export const Route = createFileRoute("/clube/minha-conta")({
  head: () => ({ meta: [{ title: "Minha Conta — Clube Impulsionando" }, { name: "description", content: "Sua assinatura, benefícios, faturas e preferências reais do Clube Impulsionando." }, { name: "robots", content: "noindex,follow" }], links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/minha-conta" }] }),
  component: ClubeMinhaConta,
});

function money(cents:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);}
function date(value?:string|null){if(!value)return "—";return new Intl.DateTimeFormat("pt-BR").format(new Date(value));}

function ClubeMinhaConta() {
  const navigate=useNavigate();
  const area=useQuery({queryKey:["clube","minha-conta","real"],queryFn:()=>getMyConsumerArea(),retry:false});
  if(area.isLoading)return <section className="mx-auto max-w-5xl px-6 py-16"><p className="text-sm text-muted-foreground">Carregando sua conta real do Clube…</p></section>;
  if(area.isError)return <section className="mx-auto max-w-3xl px-6 py-16"><Card className="p-8"><h1 className="font-serif text-2xl">Entre para acessar sua conta</h1><p className="mt-2 text-sm text-muted-foreground">Esta área não usa dados demonstrativos. Faça login para consultar sua assinatura e seus benefícios reais.</p><Button className="mt-5" onClick={()=>navigate({to:"/auth"})}>Entrar</Button></Card></section>;
  const data=area.data; const profile=data?.profile as any; const membership=data?.membership as any; const invoices=(data?.invoices??[]) as any[]; const favorites=(data?.favorites??[]) as any[];
  const active=membership?.status==="active"||membership?.status==="trial";
  return <section className="mx-auto max-w-5xl px-6 py-10">
    <SectionHeader eyebrow="Minha Conta" title="Sua central real no Clube" description="Tudo abaixo vem do seu cadastro e da sua assinatura no Core. Nenhum dado fictício é exibido nesta área." align="left"/>
    <div className="grid md:grid-cols-3 gap-4 mt-6">
      <Card className="p-6 md:col-span-2"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><User className="w-5 h-5"/></div><div><div className="font-medium">{profile?.full_name||"Membro do Clube"}</div><div className="text-xs opacity-70">{profile?.city ? `${profile.city}${profile.state?` / ${profile.state}`:""}` : "Complete seu perfil para melhorar recomendações próximas."}</div></div></div><div className="grid md:grid-cols-3 gap-3 mt-6 text-sm"><div><div className="opacity-60 text-xs">Telefone</div><div>{profile?.phone||profile?.whatsapp||"—"}</div></div><div><div className="opacity-60 text-xs">Favoritos</div><div>{favorites.length}</div></div><div><div className="opacity-60 text-xs">Faturas</div><div>{invoices.length}</div></div></div></Card>
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"><div className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1"><Crown className="w-4 h-4"/> Plano atual</div>{membership?<><div className="font-serif text-2xl mt-2">{membership.plan_name||membership.plan}</div><div className="text-xs opacity-70 mt-1">Status: {membership.status} · {money(Number(membership.amount_cents||0))}/mês</div><div className="text-xs opacity-70 mt-1">Período até {date(membership.current_period_end)}</div>{active&&<div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm font-medium">Benefícios ativos conforme as regras e permissionamentos do seu plano.</div>}</>:<><div className="font-serif text-xl mt-2">Sem assinatura ativa</div><p className="text-xs opacity-70 mt-1">Conheça os planos disponíveis e assine pelo fluxo oficial.</p><Button asChild size="sm" className="mt-4"><Link to="/clube/planos">Ver planos</Link></Button></>}</Card>
    </div>
    <div className="grid gap-4 md:grid-cols-3 mt-8"><Card className="p-5"><Gift className="w-5 h-5 text-primary"/><div className="font-medium mt-2">Benefícios</div><p className="text-xs opacity-70 mt-1">Liberados conforme assinatura e permissionamento reais.</p></Card><Card className="p-5"><ReceiptText className="w-5 h-5 text-primary"/><div className="font-medium mt-2">Financeiro</div><p className="text-xs opacity-70 mt-1">{invoices.length?`${invoices.length} registro(s) de cobrança no histórico.`:"Nenhuma cobrança registrada."}</p></Card><Card className="p-5"><Heart className="w-5 h-5 text-primary"/><div className="font-medium mt-2">Empresas favoritas</div><p className="text-xs opacity-70 mt-1">{favorites.length?`${favorites.length} empresa(s) salva(s).`:"Nenhuma empresa favorita ainda."}</p></Card></div>
    <h2 className="font-serif text-2xl mt-10 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary"/> Relacionamento</h2><div className="grid gap-4 md:grid-cols-3">{[{icon:ClipboardList,title:"Pesquisas",desc:"NPS e satisfação associados às interações elegíveis."},{icon:Gift,title:"Benefícios",desc:"Descontos e vantagens conforme seu plano."},{icon:RouteIcon,title:"Jornadas",desc:"Comunicações e automações autorizadas para seu perfil."}].map(c=><Card key={c.title} className="p-5"><c.icon className="w-5 h-5 text-primary mb-2"/><div className="font-medium">{c.title}</div><div className="text-xs opacity-75 mt-1">{c.desc}</div></Card>)}</div>
  </section>;
}
