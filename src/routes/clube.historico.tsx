import { createFileRoute, Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
export const Route=createFileRoute("/clube/historico")({head:()=>({meta:[{title:"Histórico — Clube Impulsionando"},{name:"robots",content:"noindex,follow"}]}),component:Page});
function Page(){return <section className="mx-auto max-w-4xl px-6 py-10"><SectionHeader eyebrow="Histórico" title="Sua atividade real, em um só lugar" description="Compras, consumos e interações são vinculados à sua conta e não são simulados na página pública." align="left"/><Card className="p-8 mt-6 text-center"><History className="w-10 h-10 text-primary mx-auto mb-3"/><h2 className="font-serif text-2xl">Histórico protegido</h2><p className="text-sm opacity-70 mt-2">Entre para consultar os registros existentes no Core.</p><Button asChild className="mt-5"><Link to="/area-clube">Abrir área do assinante</Link></Button></Card></section>}
