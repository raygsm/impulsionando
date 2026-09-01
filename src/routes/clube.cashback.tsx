import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
export const Route=createFileRoute("/clube/cashback")({head:()=>({meta:[{title:"Benefícios — Clube Impulsionando"},{name:"robots",content:"noindex,follow"}]}),component:Page});
function Page(){return <section className="mx-auto max-w-4xl px-6 py-10"><SectionHeader eyebrow="Benefícios" title="Seu saldo fica na área segura do assinante" description="Valores pessoais não são simulados nem expostos publicamente. Consulte saldo, pontos, economia e movimentações autenticando sua conta." align="left"/><Card className="p-8 mt-6 text-center"><Wallet className="w-10 h-10 text-primary mx-auto mb-3"/><h2 className="font-serif text-2xl">Dados reais, vinculados à sua conta</h2><p className="text-sm opacity-70 mt-2">Quando houver movimentação elegível, ela aparecerá na sua área do Clube.</p><Button asChild className="mt-5"><Link to="/area-clube">Abrir área do assinante</Link></Button></Card></section>}
