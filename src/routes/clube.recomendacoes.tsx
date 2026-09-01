import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
export const Route=createFileRoute("/clube/recomendacoes")({head:()=>({meta:[{title:"Impulsionito — Clube Impulsionando"},{name:"description",content:"Recomendações personalizadas do Clube Impulsionando."}]}),component:Page});
function Page(){return <section className="mx-auto max-w-4xl px-6 py-10"><SectionHeader eyebrow="Impulsionito" title="Recomendações baseadas no seu contexto real" description="A prévia determinística com exemplos fictícios foi removida. Na área autenticada, o Clube já consulta perfil, interesses, localização e empresas publicadas para ordenar recomendações reais." align="left"/><Card className="p-8 mt-6 text-center"><Sparkles className="w-10 h-10 text-primary mx-auto mb-3"/><h2 className="font-serif text-2xl">Sua experiência começa com o seu cadastro</h2><p className="text-sm opacity-70 mt-2">Entre para receber recomendações vinculadas aos seus interesses e aos parceiros realmente publicados.</p><Button asChild className="mt-5"><Link to="/area-clube">Abrir área do assinante</Link></Button></Card></section>}
