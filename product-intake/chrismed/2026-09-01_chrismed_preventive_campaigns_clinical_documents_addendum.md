# SUPERPROMPT ADDENDUM — PRODUCT INTAKE CHRISMED

## PREVENÇÃO CONTÍNUA + CAMPANHAS CLÍNICAS + CALENDÁRIO DE SAÚDE + OLIVER + DOCUMENTOS MÉDICOS + CHECKOUT/CHECK-IN TRANSPARENTES

**MODO:** EXCLUSIVAMENTE PRODUCT INTAKE  
**BRANCH OBRIGATÓRIA:** `reengineering/program`  
**EXECUÇÃO FUTURA:** Cauã / programador  
**TENANT:** CHRISMED  
**AGENTE ESPECIALIZADO:** OLIVER  
**NÃO EXECUTAR AGORA. NÃO ALTERAR CÓDIGO, BANCO, FRONT, BACK, N8N, CREDENCIAIS OU PRODUÇÃO A PARTIR DESTE REGISTRO.**

---

## 1. PRINCÍPIO CLÍNICO

A CHRISMED deve atuar como plataforma de cuidado integral do adulto e adolescente a partir de 15 anos, sem se limitar a gastroenterologia/hepatologia. A proposta assistencial deve refletir: **Dra. Christiane / CHRISMED cuidando da saúde da pessoa como um todo**, com prevenção, rastreio, vacinação, saúde mental, clínica médica, medicina ocupacional, gastroenterologia e hepatologia.

Campanhas são educativas e de prevenção; não substituem consulta, diagnóstico, prescrição ou avaliação individual.

---

## 2. SEGMENTAÇÃO DE PÚBLICO NO DASHBOARD

O CRM clínico deve permitir segmentar, no mínimo:

- pacientes gastroenterologia;
- pacientes hepatologia;
- pacientes clínica médica;
- pacientes ocupacionais;
- empresas contratantes;
- colaboradores vinculados a empresas/ASO;
- faixa etária;
- sexo quando clinicamente pertinente;
- fatores de risco;
- tabagismo;
- obesidade/sobrepeso;
- hipertensão conhecida;
- diabetes conhecida;
- dislipidemia;
- histórico familiar;
- exames prévios;
- vacinação conhecida;
- última consulta;
- última campanha recebida;
- consentimento por canal.

---

## 3. PROGRAMA PERMANENTE DE SAÚDE PREVENTIVA

Criar campanhas para:

- hipertensão arterial;
- diabetes;
- dislipidemia;
- obesidade;
- risco cardiovascular;
- prevenção de câncer colorretal;
- hepatites B e C;
- HIV e outras ISTs;
- vacinação do adulto;
- tétano/difteria;
- hepatite B;
- influenza;
- COVID quando vigente;
- pneumocócicas quando indicadas;
- herpes-zóster quando indicada;
- saúde mental;
- burnout;
- prevenção do suicídio com linguagem responsável;
- tabagismo;
- consumo de álcool;
- alimentação e atividade física;
- saúde do homem;
- saúde da mulher;
- segurança do paciente;
- saúde ocupacional;
- prevenção de doenças relacionadas ao trabalho.

Nunca hard-code uma recomendação clínica como universal. Regras precisam seguir protocolo vigente, idade, risco, histórico e avaliação médica.

---

## 4. REGRA DE DADO DESCONHECIDO

Diferenciar explicitamente:

- `PENDENTE CONFIRMADO`;
- `REALIZADO/ATUALIZADO`;
- `NÃO INDICADO`;
- `CONTRAINDICADO`;
- `INFORMAÇÃO NÃO DISPONÍVEL`.

Se vacinação ou exame não estiver registrado, a comunicação deve perguntar/solicitar atualização, e não afirmar que o paciente está atrasado.

---

## 5. LINHA DE CUIDADO PREVENTIVO

Cada paciente deve possuir visão consolidada com:

- última consulta;
- próxima revisão sugerida;
- pressão arterial conhecida;
- glicemia/HbA1c quando disponível;
- perfil lipídico;
- peso/IMC quando disponível;
- tabagismo;
- álcool;
- vacinas conhecidas;
- exames preventivos pertinentes;
- hepatites/ISTs quando aplicável;
- rastreamentos oncológicos conforme idade/risco;
- saúde mental;
- campanhas recebidas;
- ações pendentes;
- agendamentos;
- documentos clínicos.

---

## 6. CALENDÁRIO INTELIGENTE DE SAÚDE

Oliver deve utilizar fontes oficiais atualizadas para montar um calendário editorial anual e detectar oportunidades de campanha. Não depender de uma lista estática eterna.

Fontes de referência prioritárias na implementação:

- Calendário da Saúde do Ministério da Saúde;
- Datas da Saúde / BVS Ministério da Saúde;
- Calendário Nacional de Vacinação vigente;
- OMS/WHO para campanhas globais pertinentes;
- normas CFM/CREMERJ para atos/documentos médicos.

O sistema deve versionar `fonte`, `data_referencia`, `ano`, `tema`, `publico`, `especialidade`, `status_aprovacao`.

---

## 7. DATAS/TEMAS PRIORITÁRIOS — SEED INICIAL

Usar como seed, sempre validando o ano/fonte oficial antes do disparo:

- Janeiro Branco — saúde mental;
- 04/02 — Dia Mundial do Câncer;
- 07/04 — Dia Mundial da Saúde;
- 08/04 — combate ao câncer;
- 24 a 30/04 — Semana Mundial da Imunização;
- 26/04 — prevenção e combate à hipertensão arterial;
- 28/04 — segurança e saúde no trabalho / memória das vítimas de acidentes e doenças do trabalho;
- 16/05 — doença celíaca;
- 17/05 — Dia Mundial da Hipertensão;
- 31/05 — Dia Mundial sem Tabaco;
- 09/06 — Dia da Imunização;
- 26/06 — Dia Nacional do Diabetes;
- Julho Amarelo — hepatites virais;
- 09/07 — alerta para insuficiência cardíaca;
- 28/07 — Dia Mundial das Hepatites Virais;
- 08/08 — prevenção e controle do colesterol;
- 29/08 — combate ao fumo;
- Setembro Amarelo — prevenção do suicídio, com governança clínica;
- 10/10 — Dia Mundial da Saúde Mental;
- 11/10 — prevenção da obesidade;
- 17/10 — Dia Nacional da Vacinação;
- Novembro Azul — saúde do homem;
- 12/11 — prevenção de arritmias e morte súbita;
- 14/11 — Dia Mundial do Diabetes;
- 27/11 — Dia Nacional de Combate ao Câncer;
- Dezembro Vermelho — HIV/Aids e ISTs;
- 01/12 — Dia Mundial de Luta contra a Aids.

Adicionar datas específicas de gastroenterologia, hepatologia, câncer colorretal, saúde ocupacional e demais temas quando confirmadas por fonte oficial/confiável. Não inventar “dia de” sem fonte.

---

## 8. MOTOR DE ASSOCIAÇÃO OLIVER

Oliver deve cruzar automaticamente:

`DATA/TEMA → ESPECIALIDADE → SEGMENTO → ELEGIBILIDADE → TEMPLATE → CTA → APROVAÇÃO HUMANA`.

Exemplos:

- Julho Amarelo → hepatologia + clínica geral → pacientes elegíveis → prevenção/testagem hepatites → CTA avaliação/agendamento;
- 26/04 → clínica geral/ocupacional → hipertensos, fatores de risco, empresas → controle de PA → CTA consulta/check-up;
- 28/04 → empresas/colaboradores → saúde ocupacional → segurança e prevenção → CTA avaliação ocupacional;
- 10/10 → clínica geral + empresas → saúde mental/burnout → CTA avaliação clínica, sem diagnóstico automático.

---

## 9. SUGESTÃO AUTOMÁTICA À GESTÃO

O sistema não deve disparar automaticamente campanha clínica sensível sem aprovação configurada.

Oliver cria sugestão:

**Tema:** Julho Amarelo  
**Público:** pacientes hepatologia + clínica geral elegíveis  
**Estimativa:** X contatos elegíveis  
**Canais:** e-mail / WhatsApp  
**Assunto sugerido:** [...]  
**Template:** [...]  
**CTA:** Agendar avaliação  
**Fonte clínica:** [...]  

Botões:

- `APROVAR E ENVIAR`;
- `EDITAR`;
- `AGENDAR`;
- `DESCARTAR`.

Um clique aprovado deve iniciar a campanha, respeitando permissões e consentimentos.

---

## 10. TEMPLATES DE CAMPANHA

Cada campanha deve possuir:

- assunto de e-mail;
- preheader;
- título;
- contexto educativo;
- sinais de atenção sem alarmismo;
- orientação preventiva;
- CTA;
- link para agendamento;
- versão WhatsApp;
- identidade visual CHRISMED;
- assinatura da CHRISMED/Dra. Christiane quando aplicável;
- fonte clínica interna;
- versão/autor/aprovador.

---

## 11. JORNADA N8N DE CAMPANHA

**calendário detecta oportunidade → Oliver cria sugestão → gestão revisa → aprovação → segmentação final → dedupe → consentimento → envio e-mail/WhatsApp → entrega → clique → landing/conteúdo → agendamento → consulta → atualização clínica → BI.**

Handlers idempotentes. Nunca duplicar comunicação por reprocessamento.

---

## 12. BI DE PREVENÇÃO

Dashboard:

- campanhas sugeridas;
- aprovadas;
- enviadas;
- entregues;
- cliques;
- agendamentos;
- consultas realizadas;
- atualização vacinal informada;
- exames solicitados;
- retornos;
- opt-outs;
- conversão por tema;
- conversão por especialidade;
- conversão por faixa etária;
- prevenção por empresa/ocupacional quando autorizado.

---

## 13. DOCUMENTOS MÉDICOS DENTRO DA CHRISMED

O dashboard clínico deve permitir fluxo integrado para:

- prescrição;
- atestado;
- relatório médico;
- solicitação de exames;
- laudo;
- parecer técnico;
- ASO e documentos ocupacionais quando aplicáveis.

A emissão é ato médico. Oliver pode preparar rascunho/estrutura, mas não emitir nem assinar em nome do médico.

---

## 14. CREMERJ / CFM — REGRA DE INTEGRAÇÃO

Não assumir API pública inexistente.

No RJ, a execução deve auditar os meios oficiais vigentes do CREMERJ/CFM. Em 2026, o CREMERJ informa uso da Prescrição Eletrônica Nacional para médicos do RJ e acesso com credenciais do CRM Virtual/certificado digital. A arquitetura CHRISMED deve integrar apenas por mecanismo oficialmente suportado, com segurança e conformidade.

Se não houver API homologada, oferecer handoff transparente/SSO/deep-link seguro quando permitido, mantendo o usuário dentro da melhor experiência possível sem simular integração técnica que não existe.

---

## 15. ASSINATURA DIGITAL E VALIDADE

Documentos digitais devem seguir requisitos legais/éticos vigentes, incluindo identificação do médico, CRM, paciente, data/hora, assinatura digital e requisitos específicos do tipo documental. Quando exigido, usar certificado digital compatível/ICP-Brasil e validação reconhecida.

Nunca armazenar certificado/chave privada de modo inseguro ou no front-end.

---

## 16. ATESTADO — REGRA CRÍTICA

Atestado só pode ser emitido após avaliação médica adequada. O sistema não pode vender, gerar ou liberar atestado automaticamente por chatbot, pagamento ou pedido do paciente.

Fluxo:

**atendimento/consulta → decisão médica → documento → assinatura → registro → disponibilização ao paciente.**

---

## 17. ASO / OCUPACIONAL

Para medicina ocupacional, registrar em prontuário clínico-ocupacional e suportar requisitos vigentes de NR-7/CFM/CREMERJ, com segregação entre informação clínica protegida e informação ocupacional que pode ser compartilhada conforme a lei.

Empregador não deve ter acesso irrestrito ao prontuário clínico do trabalhador.

---

## 18. CHECKOUT TRANSPARENTE CHRISMED

O pagamento deve ocorrer no fluxo CHRISMED, sem desviar o paciente para uma experiência desconexa, sempre que o provider homologado permitir.

Fluxo:

**serviço → profissional → modalidade → horário → dados mínimos → cupom → checkout → pagamento → confirmação → agenda → comunicação.**

Auditar e preservar o que já existe. O repositório já possui rota de checkout, fluxo de agendamento, integração Mercado Pago per-tenant e componentes de cupom; corrigir apenas o que estiver incompleto/quebrado.

---

## 19. CHECK-IN TRANSPARENTE

Criar/validar check-in dentro da área CHRISMED:

- consulta presencial;
- teleconsulta;
- domiciliar quando aplicável;
- ocupacional;
- eventos quando aplicável.

Possibilidades:

- QR;
- confirmação pelo dashboard;
- confirmação pelo profissional/recepção;
- geolocalização somente quando necessária e consentida.

Check-in deve atualizar status, jornada N8N e registro de atendimento.

---

## 20. CHECK-IN NÃO É CHECKOUT

Separar estados:

- pagamento;
- agendamento;
- presença/check-in;
- atendimento iniciado;
- atendimento concluído;
- retorno;
- cancelamento/no-show.

Não confundir pagamento com presença.

---

## 21. ÁREA DO PACIENTE

Paciente deve visualizar, conforme permissão:

- consultas;
- agendamentos;
- pagamentos;
- notas/recibos;
- prescrições;
- pedidos de exames;
- atestados;
- relatórios/laudos compartilhados;
- resultados/exames enviados;
- campanhas preventivas;
- histórico de vacinação informado;
- próximos cuidados sugeridos;
- tickets/suporte.

---

## 22. OLIVER NO PRIMEIRO ACESSO

Oliver deve orientar o paciente e o profissional dentro do contexto, sem diagnosticar/prescrever indevidamente. Deve saber explicar onde encontrar documento, agendar, atualizar vacinação, entender campanha e abrir ticket.

---

## 23. SEGURANÇA E LGPD

Obrigatório:

- RLS;
- RBAC;
- tenant isolation;
- separação paciente/profissional/empresa;
- MFA para perfis sensíveis;
- Vault;
- auditoria de acesso ao prontuário;
- logs de emissão/visualização de documentos;
- criptografia adequada;
- consentimento e finalidade;
- minimização de dados;
- opt-out de marketing sem bloquear comunicações assistenciais legítimas;
- backups e restore testado.

---

## 24. TESTES E2E OBRIGATÓRIOS

### Campanha preventiva
**data oficial → sugestão Oliver → revisão → aprovação → segmento → e-mail/WhatsApp → clique → agendamento → consulta → BI.**

### Documento médico
**consulta → profissional autenticado → criar documento → validar dados → assinatura → registro → paciente acessa → auditoria.**

### Checkout
**agendar → pagamento real sandbox/homologado → webhook → confirmação → agenda → recibo/status.**

### Check-in
**agendamento confirmado → check-in → status → atendimento → conclusão → pós-consulta.**

### Permissões
Empresa tenta prontuário clínico do colaborador → NEGADO.  
Paciente A tenta documento de B → NEGADO.  
Oliver tenta emitir receita sem médico → NEGADO.  
Usuário sem permissão tenta assinar → NEGADO.  
Médico autorizado → PERMITIDO/AUDITADO.

---

## 25. CRITÉRIO DE ACEITE

Somente marcar PASS quando:

- segmentação clínica funciona;
- calendário de saúde versionado funciona;
- Oliver sugere campanha com fonte e público corretos;
- aprovação humana funciona;
- e-mail/WhatsApp integrados;
- cliques/agendamentos entram no CRM/BI;
- documentos médicos têm fluxo legal e auditável;
- integração CREMERJ/CFM usa mecanismo oficialmente suportado;
- checkout transparente funciona;
- check-in funciona;
- RLS/RBAC funcionam;
- dados sensíveis estão protegidos;
- nenhum mock é apresentado como produção.

---

## 26. REGRA FINAL AO CAUÃ

A CHRISMED deve se comportar como uma clínica inteligente, preventiva e proativa.

Não esperar o paciente adoecer para se relacionar.

Oliver deve perceber **quem**, **quando**, **por quê** e **qual tema** é relevante, preparar a comunicação certa e pedir aprovação da gestão com o mínimo de atrito.

Ao mesmo tempo, toda automação clínica precisa respeitar limites: **educar e organizar pode ser automático; diagnosticar, prescrever, atestar e assinar continuam sendo atos profissionais.**

O objetivo é integrar prevenção, CRM, comunicação, agenda, checkout, check-in, prontuário e documentos médicos em uma única jornada CHRISMED, simples para o usuário e rigorosa por baixo.

**STATUS: PRODUCT INTAKE SALVO PARA EXECUÇÃO FUTURA PELO CAUÃ.**