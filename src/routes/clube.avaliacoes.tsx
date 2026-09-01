import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
export const Route=createFileRoute("/clube/avaliacoes")({head:()=>({meta:[{title:"Avaliações — Clube Impulsionando"},{name:"robots",content:"noindex,follow"}]}),component:Page});
function Page(){return <section className="mx-auto max-w-4xl px-6 py-10"><SectionHeader eyebrow="Avaliações" title="Experiências reais, vinculadas ao membro" description="A publicação de avaliações exige autenticação e empresa real. Removemos avaliações e formulários demonstrativos da área pública." align="left"/><Card className="p-8 mt-6 text-center"><Star className="w-10 h-10 text-primary mx-auto mb-3"/><h2 className="font-serif text-2xl">Avalie pela sua área do Clube</h2><p className="text-sm opacity-70 mt-2">Assim a avaliação fica ligada ao seu cadastro e ao parceiro correto.</p><Button asChild className="mt-5"><Link to="/area-clube">Abrir área do assinante</Link></Button></Card></section>}
