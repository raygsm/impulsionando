import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
export const Route=createFileRoute("/clube/vouchers")({head:()=>({meta:[{title:"Vouchers — Clube Impulsionando"},{name:"robots",content:"noindex,follow"}]}),component:Page});
function Page(){return <section className="mx-auto max-w-4xl px-6 py-10"><SectionHeader eyebrow="Vouchers" title="Seus vouchers são pessoais" description="Vouchers ativos, utilizados e expirados são exibidos somente na experiência autenticada, sem exemplos fictícios." align="left"/><Card className="p-8 mt-6 text-center"><Ticket className="w-10 h-10 text-primary mx-auto mb-3"/><h2 className="font-serif text-2xl">Consulte seus benefícios reais</h2><p className="text-sm opacity-70 mt-2">Ofertas e resgates aparecem quando existirem para sua conta.</p><Button asChild className="mt-5"><Link to="/area-clube">Abrir área do assinante</Link></Button></Card></section>}
