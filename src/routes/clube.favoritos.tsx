import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
export const Route=createFileRoute("/clube/favoritos")({head:()=>({meta:[{title:"Favoritos — Clube Impulsionando"},{name:"robots",content:"noindex,follow"}]}),component:Page});
function Page(){return <section className="mx-auto max-w-4xl px-6 py-10"><SectionHeader eyebrow="Favoritos" title="O que você salvou fica na sua conta" description="Favoritos são dados pessoais do membro. A página pública não exibe itens de demonstração." align="left"/><Card className="p-8 mt-6 text-center"><Heart className="w-10 h-10 text-primary mx-auto mb-3"/><h2 className="font-serif text-2xl">Favoritos reais</h2><p className="text-sm opacity-70 mt-2">Entre no Clube para visualizar e gerenciar o que você marcou.</p><Button asChild className="mt-5"><Link to="/area-clube">Abrir área do assinante</Link></Button></Card></section>}
