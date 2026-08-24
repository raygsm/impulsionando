# REVELA — Product Blueprint

## Missão
Criar um perfil longitudinal de desenvolvimento que amplie as oportunidades de descoberta, experimentação e demonstração de potencial sem transformar indicadores em rótulos ou sentenças vocacionais.

## Jornada canônica
`escutar -> observar -> experimentar -> desenvolver -> provar -> conectar -> acompanhar -> reavaliar`

## Princípios inegociáveis
- nenhuma nota ou score único define uma pessoa;
- inferências relevantes carregam origem, data, versão metodológica e confiança;
- divergência entre fontes é evidência a investigar, não dado a apagar;
- recomendações precisam ser explicáveis;
- decisões de alto impacto permanecem humanas;
- compartilhamento é orientado por finalidade e consentimento aplicável;
- o aluno acessa a própria evolução em linguagem compreensível;
- metodologia e instrumentos são versionados e auditáveis.

## Perfis de acesso
### Aluno
Perfil vivo, pesquisas, experiências, evidências, evolução, plano de exploração e autorizações de compartilhamento.

### Docente
Micro-observações estruturadas, evidências contextuais e acompanhamento somente dos alunos autorizados no seu escopo.

### Comitê de desenvolvimento
Triangulação de fontes, divergências, tendências, planos de exploração e revisão humana de recomendações.

### Escola/rede
Indicadores agregados, adesão, evolução, experiências e impacto sem exposição indevida de dados individuais.

### Empresa
Oportunidades por problema/competência, desafios práticos, matching explicável e feedback estruturado. Não recebe dados além do necessário e autorizado.

### Responsável
Visão compatível com regras de idade, finalidade, consentimento e política institucional.

### Pesquisador
Somente conjuntos autorizados, minimizados e preferencialmente anonimizados.

### Administração REVELA
Configuração metodológica, instrumentos, templates, auditoria e operação do produto.

### Impulsionando Master
Governança global do tenant conforme Core universal, sem atalhos de RLS.

## Cadência longitudinal
- onboarding: contexto, consentimentos e baseline;
- mensal: pulso de 5–8 minutos;
- trimestral: survey adaptativo + revisão de tendências;
- semestral: snapshot ampliado e plano de exploração;
- anual: síntese longitudinal sem ranking pessoal;
- experiências: pré, pós, 30/90/180/365 dias quando aplicável.

## Dimensões iniciais
Análise, criatividade, execução, relacionamento, liderança, adaptação, tecnologia, comunicação, operações, produto, serviço, artes, habilidades manuais/técnicas, ciência e empreendedorismo.

## Modelo de evidência
Toda evidência deve registrar, quando aplicável:
- dimensão;
- fonte;
- contexto;
- intensidade/valor observado;
- data;
- instrumento e versão;
- autor ou origem automatizada;
- confiança;
- autorização/finalidade de uso.

## Triangulação
Uma inferência não deve depender de uma fonte isolada. O motor combina auto percepção, observação, evidência prática e tendência temporal. O produto deve mostrar tanto convergências quanto divergências.

## Surveys adaptativos
O instrumento mensal é curto. O trimestral pode aprofundar dimensões que apresentem mudança, baixa confiança, divergência entre fontes ou ausência de evidência recente. Perguntas adaptativas nunca devem tentar induzir uma profissão predeterminada.

## Motor de confiança
A confiança de uma inferência considera diversidade de fontes, recência, quantidade de evidências, consistência contextual e evidência prática. Confiança baixa deve aparecer explicitamente como incerteza.

## Planos de exploração
Horizontes de 30/60/90/180 dias com experiências concretas. O objetivo é gerar novas evidências, não confirmar um rótulo anterior.

## Matching explicável
Oportunidades são descritas por problemas, contexto e competências. O matching apresenta razões, lacunas e nível de confiança. Nunca contrata, rejeita ou sentencia automaticamente.

## Provas práticas
Modelo `baseline -> aprendizagem -> transferência`: medir ponto de partida, capacidade de aprender durante a experiência e capacidade de aplicar em contexto novo.

## Dashboards MVP
### Aluno
- minha evolução;
- evidências recentes;
- curiosidades e interesses;
- experiências sugeridas/em andamento;
- plano de exploração;
- compartilhamentos ativos.

### Docente
- alunos no escopo;
- observações pendentes;
- micro-observação rápida;
- tendências que pedem nova evidência.

### Comitê
- triangulação;
- divergências;
- confiança;
- experiências;
- revisão e decisão humana.

### Escola
- adesão e cobertura;
- evolução agregada;
- oportunidades de experiência;
- indicadores de impacto longitudinal.

### Empresa
- oportunidades;
- candidatos autorizados;
- explicação do matching;
- desafios e feedback.

### Master
- tenants/organizações;
- metodologia e versões;
- instrumentos;
- jornadas;
- auditoria;
- saúde operacional.

## Eventos de domínio previstos
`student.onboarded`, `consent.updated`, `survey.assigned`, `survey.completed`, `observation.created`, `snapshot.generated`, `exploration_plan.updated`, `experience.started`, `experience.completed`, `opportunity.published`, `match.generated`, `challenge.completed`, `followup.due`, `followup.completed`.

## Automação
Cada jornada futura N8N deve ser idempotente, versionada, auditável, com retry, dead-letter/fila equivalente e alerta operacional. Nenhuma automação pode contornar autorização, RLS ou decisão humana obrigatória.

## Critérios de homologação
- isolamento por tenant e papel comprovado;
- nenhum acesso cruzado indevido;
- acessibilidade dos fluxos principais;
- explicabilidade de inferências e matching;
- consentimento granular validado;
- auditoria de ações sensíveis;
- E2E das jornadas críticas;
- publicação somente após gates do Core estarem verdes.
