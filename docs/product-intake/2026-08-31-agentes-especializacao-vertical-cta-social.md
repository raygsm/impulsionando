# Product Intake — Especialização Vertical Obrigatória dos Agentes

## Status
APPROVED / QUEUED_AFTER_MASTER_AUDIT

## Data
2026-08-31

## Regra de sequência
Este intake NÃO substitui nem interrompe a auditoria master em andamento. Deve iniciar imediatamente após a conclusão e homologação da auditoria master do ecossistema.

## Objetivo
Cada agente visível de cliente deve operar como especialista profundo e exclusivo no negócio, produtos, serviços, linguagem, público, jornada, operação e contexto institucional do respectivo cliente. O agente não deve falar como consultor genérico da Impulsionando e não deve deslocar a conversa para produtos ou temas da Impulsionando, salvo em áreas administrativas explicitamente destinadas à gestão do sistema.

## Regra de domínio
1. O conhecimento primário do agente é o domínio do cliente.
2. O agente deve conhecer profundamente catálogo, serviços, regras, preços autorizados, diferenciais, objeções, logística, agenda, estoque, jornada, políticas, canais e conteúdo institucional do cliente.
3. O agente deve possuir capacidade analítica para inferir intenção, necessidade, risco, oportunidade de relacionamento e melhor próxima ação.
4. O agente não deve inventar dados nem extrapolar para temas fora do domínio do cliente.
5. Quando o assunto sair do domínio, deve redirecionar com naturalidade para o que consegue resolver dentro do negócio, ou acionar um fluxo/handoff autorizado.
6. O conhecimento técnico interno da plataforma Impulsionando fica oculto do cliente final e não deve contaminar a persona do agente.

## Exemplos obrigatórios
- Ana Madú — Annita: especialista em joias, pedras naturais, metais, ourivesaria, acabamento, conservação, combinações, presentes, estilo, catálogo, disponibilidade e venda Ana Madú. Não atua como especialista genérica em marketing, tecnologia ou negócios alheios à Ana Madú.
- CHRISMED — Oliver: especialista em atendimento de saúde dentro dos limites não médicos, serviços CHRISMED, agenda, modalidades, GMS, medicina ocupacional, eventos, relacionamento com pacientes e orientação segura. Não diagnostica nem prescreve.
- Colors Saúde — Íris: especialista no portfólio Colors, produtos, uso conforme conteúdo autorizado, compra, recompra, suporte, afiliados, eventos, relacionamento e conversão.
- Demais clientes: mesmo padrão, com matriz própria de domínio e guardrails.

## CTA e comportamento comercial
Todo agente deve trabalhar com intenção clara de avanço da jornada, sem ser agressivo nem enganoso.

Sequência padrão:
compreender -> classificar -> responder -> reduzir objeção -> recomendar próxima melhor ação -> CTA específico -> confirmar avanço -> registrar contexto -> nutrir/relacionar.

Tipos de CTA:
- captação;
- cadastro;
- orçamento;
- agendamento;
- compra;
- reserva;
- pedido;
- contratação;
- recompra;
- indicação;
- avaliação;
- participação em evento;
- relacionamento/retorno.

O CTA deve ser contextual, mensurável e coerente com o estágio do usuário.

## Inteligência social e institucional
Cada agente deve poder usar dados públicos autorizados do próprio cliente para fortalecer relacionamento e projeção institucional, incluindo:
- site oficial;
- Instagram e demais redes oficiais;
- LinkedIn;
- Facebook;
- Google Business Profile quando aplicável;
- notícias e matérias públicas;
- eventos e agenda pública;
- publicações institucionais;
- menções públicas relevantes;
- avaliações e provas sociais permitidas;
- catálogo e conteúdos publicados pelo cliente.

Quando houver conta social conectada com permissão de escrita, o sistema poderá executar ações aprovadas como seguir perfis institucionais relevantes, publicar/divulgar conteúdo e registrar interações. Sem conexão/permissão explícita, o sistema deve apenas recomendar ou preparar a ação, nunca simular que a executou.

## Observação de linguagem
A expressão recebida como 'milícias sociais' foi interpretada operacionalmente como 'mídias sociais'. Caso o significado desejado seja outro, ajustar antes de habilitar qualquer automação externa.

## Arquitetura esperada
Para cada tenant/agente:
- agent_profile;
- domain_scope;
- allowed_topics;
- forbidden_topics;
- knowledge_sources;
- product_service_catalog;
- sales_playbook;
- relationship_playbook;
- objection_matrix;
- CTA matrix;
- public_social_sources;
- tool permissions;
- escalation policy;
- memory policy;
- safety/sector guardrails;
- evaluation suite.

## Critério de homologação por agente
O agente só será considerado homologado após:
1. responder corretamente questões centrais do negócio;
2. rejeitar/redirecionar perguntas fora do domínio;
3. não vazar linguagem ou conhecimento interno da Impulsionando;
4. executar CTA contextual;
5. preservar histórico e contexto;
6. não inventar produto, preço, disponibilidade ou política;
7. operar com dados reais de catálogo/agenda/estoque quando houver integração;
8. passar testes de objeção, relacionamento e conversão;
9. respeitar regras setoriais e segurança;
10. registrar métricas de conversão e qualidade.

## Ordem após auditoria master
1. Oliver / CHRISMED
2. Annita / Ana Madú
3. Íris / Colors Saúde
4. Milito / WMP
5. Maruquito / Marocas
6. agentes de bares/restaurantes
7. agentes dos demais tenants ativos
8. testes cross-tenant de isolamento de conhecimento
9. habilitação de inteligência social onde houver conexão e autorização
10. homologação final.