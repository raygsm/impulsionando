import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, ClipboardCheck, GraduationCap, HeartHandshake, LifeBuoy, MessageCircle, Music2, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { RevelaRole } from "@/revela/roles";

export const Route = createFileRoute("/_authenticated/revela/$area")({ component: RevelaAreaPage });

type AreaConfig = { role: RevelaRole; title: string; eyebrow: string; description: string; actions: { title: string; description: string; to: string; icon: any }[] };

const areas: Record<string, AreaConfig> = {
  master: { role:"impulsionando_master", eyebrow:"Gestão Full", title:"REVELA — visão master", description:"Saúde do produto, metodologia, comunicação, CRM, suporte, automações, segurança e auditoria em uma única operação.", actions:[
    {title:"Comunicação",description:"E-mail, WhatsApp, templates e conversas.",to:"/admin/comunicacao",icon:MessageCircle},{title:"CRM",description:"Escolas, empresas, profissionais e parcerias.",to:"/crm/board",icon:BriefcaseBusiness},{title:"Operação Full",description:"ERP, financeiro, agenda e capacidades do Core.",to:"/dashboards/operacao",icon:Building2},{title:"Segurança",description:"Permissões, auditoria e configurações.",to:"/settings",icon:ShieldCheck}]},
  admin: { role:"revela_admin", eyebrow:"Administração REVELA", title:"Operação educacional", description:"Acompanhe metodologia, públicos, jornadas e qualidade sem perder o estudante do centro.", actions:[
    {title:"Metodologia",description:"Ciclos, dimensões e instrumentos.",to:"/revela/comite",icon:ClipboardCheck},{title:"Comunicação",description:"Mensagens e jornadas por público.",to:"/admin/comunicacao",icon:MessageCircle},{title:"CRM",description:"Relacionamento institucional.",to:"/crm/board",icon:BriefcaseBusiness},{title:"Suporte",description:"Tickets, SLA e atendimento.",to:"/admin/comunicacao",icon:LifeBuoy}]},
  aluno: { role:"student", eyebrow:"Minha jornada", title:"Descubra experimentando", description:"Aqui não existe ranking. Acompanhe interesses, experiências e mudanças ao longo do tempo.", actions:[
    {title:"Minha escuta",description:"Responda seu pulso mensal com liberdade.",to:"/revela/aluno?tab=pesquisas",icon:HeartHandshake},{title:"Experiências",description:"Explore possibilidades antes de decidir.",to:"/revela/aluno?tab=experiencias",icon:Sparkles},{title:"Minha evolução",description:"Veja sua trajetória comparada com você mesmo.",to:"/revela/aluno?tab=evolucao",icon:GraduationCap},{title:"Privacidade",description:"Controle consentimentos e compartilhamentos.",to:"/revela/aluno?tab=privacidade",icon:ShieldCheck}]},
  professor: { role:"teacher", eyebrow:"Área docente", title:"Observar para ampliar possibilidades", description:"Registre evidências de forma rápida e ajude a criar novas experiências, sem rotular estudantes.", actions:[
    {title:"Meus alunos",description:"Veja apenas estudantes no seu escopo.",to:"/revela/professor?tab=alunos",icon:Users},{title:"Nova observação",description:"Registre uma evidência observável em poucos passos.",to:"/revela/professor?tab=observacao",icon:ClipboardCheck},{title:"Experiências",description:"Sugira ou acompanhe experimentações.",to:"/revela/professor?tab=experiencias",icon:Sparkles},{title:"Encaminhamentos",description:"Casos que pedem triangulação humana.",to:"/revela/comite",icon:HeartHandshake}]},
  escola: { role:"school_admin", eyebrow:"Escola", title:"Uma escola que aprende com seus alunos", description:"Acompanhe adesão, lacunas de oportunidade, experiências e necessidades de infraestrutura.", actions:[
    {title:"Indicadores",description:"Evolução agregada e cobertura.",to:"/revela/escola?tab=indicadores",icon:BookOpen},{title:"Oportunidades",description:"Onde existe interesse sem acesso suficiente.",to:"/revela/escola?tab=lacunas",icon:Sparkles},{title:"Infraestrutura",description:"Planeje laboratórios, música e experiências.",to:"/revela/escola?tab=infraestrutura",icon:Music2},{title:"Equipe",description:"Professores, comitê e permissões.",to:"/revela/escola?tab=equipe",icon:Users}]},
  rede: { role:"network_admin", eyebrow:"Rede de ensino", title:"Inteligência agregada para decidir melhor", description:"Compare unidades sem expor indivíduos e direcione oportunidades e investimentos onde fazem diferença.", actions:[
    {title:"Escolas",description:"Cobertura, adesão e evolução por unidade.",to:"/revela/rede?tab=escolas",icon:Building2},{title:"Equidade",description:"Lacunas de oportunidade por território.",to:"/revela/rede?tab=equidade",icon:HeartHandshake},{title:"Projetos",description:"Necessidades estruturadas para implantação e captação.",to:"/revela/rede?tab=projetos",icon:ClipboardCheck}]},
  empresa: { role:"company", eyebrow:"Empresa e RH", title:"Encontre capacidade demonstrada", description:"Descreva problemas reais, publique desafios e conheça pessoas autorizadas por evidências — não apenas por currículo.", actions:[
    {title:"Oportunidades",description:"Cadastre necessidades e competências.",to:"/revela/empresa?tab=oportunidades",icon:BriefcaseBusiness},{title:"Desafios práticos",description:"Avalie capacidade por demonstração.",to:"/revela/empresa?tab=desafios",icon:ClipboardCheck},{title:"Matching",description:"Entenda por que uma combinação foi sugerida.",to:"/revela/empresa?tab=matching",icon:Sparkles},{title:"CRM",description:"Acompanhe relacionamento e próximos passos.",to:"/crm/board",icon:Users}]},
  profissional: { role:"independent_professional", eyebrow:"Profissional REVELA", title:"Sua experiência pode ampliar oportunidades", description:"Participe de pesquisas, ofereça competências e candidate-se a contribuições e ao Comitê REVELA.", actions:[
    {title:"Meu perfil",description:"Formação, experiência e áreas de contribuição.",to:"/revela/profissional?tab=perfil",icon:Users},{title:"Comitê REVELA",description:"Candidate-se e acompanhe sua participação.",to:"/revela/profissional?tab=comite",icon:HeartHandshake},{title:"Disponibilidade",description:"Organize horários para atividades e mentorias.",to:"/revela/profissional?tab=agenda",icon:ClipboardCheck},{title:"Pesquisas",description:"Contribua com a evolução metodológica.",to:"/revela/profissional?tab=pesquisas",icon:BookOpen}]},
  comite: { role:"committee", eyebrow:"Comitê REVELA", title:"Decisão humana apoiada por evidências", description:"Revise tendências, divergências e recomendações. A tecnologia sugere; pessoas responsáveis decidem.", actions:[
    {title:"Casos para revisão",description:"Prioridades e divergências que pedem análise.",to:"/revela/comite?tab=casos",icon:ClipboardCheck},{title:"Evidências",description:"Triangule estudante, docentes e experiências.",to:"/revela/comite?tab=evidencias",icon:BookOpen},{title:"Atas",description:"Registre decisões e justificativas.",to:"/revela/comite?tab=atas",icon:ShieldCheck}]},
  responsavel: { role:"guardian", eyebrow:"Responsável", title:"Acompanhe sem transformar descoberta em cobrança", description:"Veja experiências e consentimentos permitidos, com linguagem clara e respeito à autonomia progressiva.", actions:[
    {title:"Acompanhamento",description:"Veja o que foi compartilhado com você.",to:"/revela/responsavel?tab=acompanhamento",icon:HeartHandshake},{title:"Consentimentos",description:"Revise autorizações aplicáveis.",to:"/revela/responsavel?tab=consentimentos",icon:ShieldCheck}]},
  pesquisa: { role:"researcher", eyebrow:"Pesquisa", title:"Conhecimento para melhorar o método", description:"Acesse somente dados agregados e anonimizados autorizados para pesquisa.", actions:[{title:"Indicadores agregados",description:"Analise tendências sem identificar estudantes.",to:"/revela/pesquisa?tab=indicadores",icon:BookOpen}]},
};

async function loadAccess() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user:null, roles:[] as string[], isMaster:false };
  const { data } = await supabase.from("revela_memberships").select("role,status").eq("user_id",auth.user.id).eq("status","active");
  const m = auth.user.app_metadata as Record<string,unknown> | undefined;
  return { user:auth.user, roles:(data ?? []).map((x:any)=>String(x.role)), isMaster:m?.is_super_admin===true || m?.is_impulsionando_staff===true };
}

function RevelaAreaPage(){
  const { area } = Route.useParams();
  const cfg = areas[area];
  const { data, isLoading } = useQuery({queryKey:["revela-access",area],queryFn:loadAccess});
  if(!cfg) return <Card className="p-6">Área REVELA não encontrada.</Card>;
  if(isLoading) return <Card className="p-6">Carregando sua área REVELA…</Card>;
  const allowed = data?.isMaster || data?.roles.includes(cfg.role);
  if(!allowed) return <Card className="mx-auto max-w-xl p-6"><h1 className="text-xl font-semibold">Acesso não autorizado</h1><p className="mt-2 text-sm text-muted-foreground">Esta área pertence a outro perfil do REVELA. Seus dados e permissões foram preservados.</p></Card>;
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl border bg-card p-6 md:p-8"><Badge variant="secondary">{cfg.eyebrow}</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight">{cfg.title}</h1><p className="mt-3 max-w-3xl text-muted-foreground">{cfg.description}</p></header>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cfg.actions.map(({title,description,to,icon:Icon})=><Card key={title} className="flex flex-col p-5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p><Button asChild variant="ghost" className="mt-4 justify-start px-0"><Link to={to as never}>Abrir <ArrowRight className="ml-1 h-4 w-4"/></Link></Button></Card>)}</section>
  </div>;
}
