# INTAKE VIVO — CHRISMED — AGENDA, PROFISSIONAIS, PEGAAGENDA E EVENTOS

**Projeto/cliente:** CHRISMED
**Destinatários:** K1 / Cauã / equipe de desenvolvimento
**Natureza:** Intake vivo e consolidado. Este é o documento único para esta frente; novas definições devem atualizar/substituir este mesmo documento, evitando Intakes concorrentes.
**Execução:** não alterar código automaticamente; este documento orienta análise e implementação posterior.

---

## 1. PRINCÍPIO GERAL

A CHRISMED deve possuir dois módulos centrais e extremamente importantes:

1. **Agenda/Agendamento**, incluindo profissionais de saúde, teleconsulta, consulta presencial, consulta domiciliar, remarcações, cancelamentos, financeiro, carteira e PegaAgenda.
2. **Eventos**, incluindo captação, cadastro, convites, aprovação, contratantes, gestores, QR Code, check-in, no-show, relatórios e BI.

Ambos devem usar o mesmo cadastro profissional, mesmas taxonomias, mesmo CRM, mesma camada de comunicação, financeiro, auditoria e o agente **Oliver** como instância especializada da CHRISMED.

Não criar sistemas paralelos. Agenda e Eventos devem ser módulos reutilizáveis do Core, configurados para a CHRISMED.

---

## 2. CADASTRO DE PROFISSIONAIS DE SAÚDE

A base de profissionais deve ser um ativo estratégico crescente da CHRISMED.

O profissional pode entrar por:

- cadastro orgânico pelo site;
- convite da CHRISMED;
- cadastro manual interno;
- importação por planilha;
- eventual origem por eventos ou outras campanhas.

### 2.1 Aprovação

Profissional novo que se cadastra organicamente deve passar pelo **Comitê de Gestão CHRISMED**. A entrada não é automática.

Após aprovação:

- recebe boas-vindas;
- entra no CRM/base oficial;
- passa a poder participar de eventos;
- passa a acessar sua agenda;
- pode configurar modalidades, preços, durações, endereços e disponibilidade;
- passa a receber comunicações e convites compatíveis com seus filtros.

### 2.2 Dados obrigatórios

Cadastro completo deve incluir, entre outros:

- nome completo;
- CPF obrigatório;
- data de nascimento quando aplicável;
- e-mail;
- celular/WhatsApp;
- endereço completo;
- CEP;
- profissão;
- conselho profissional aplicável;
- número do conselho;
- UF do conselho quando aplicável;
- especialidades;
- subespecialidades;
- áreas/nichos de atendimento;
- idiomas;
- modalidades de atendimento disponíveis;
- raio geográfico para convites/eventos e/ou atendimento domiciliar quando aplicável;
- demais documentos necessários à validação cadastral.

CPF deve ser validado tecnicamente e, quando houver integração oficial/licenciada apropriada, cadastralmente. Não confundir validação matemática de CPF com confirmação de identidade diretamente na Receita Federal.

### 2.3 Taxonomias estruturadas

Nada relevante deve depender de texto livre quando puder ser taxonomia.

Devem existir listas estruturadas para:

- profissões da área da saúde;
- conselhos profissionais;
- especialidades;
- subespecialidades;
- áreas de atuação;
- modalidades de atendimento.

O profissional pode selecionar múltiplas especialidades/subespecialidades/áreas quando fizer sentido.

---

## 3. MODALIDADES DE ATENDIMENTO

Todos os profissionais de saúde aprovados devem poder selecionar quais modalidades desejam oferecer:

- **Teleconsulta**;
- **Consulta presencial**;
- **Consulta domiciliar**.

Cada profissional escolhe em quais participa. A configuração deve ser independente por modalidade.

---

## 4. TELECONSULTA

Teleconsulta deve estar disponível para todos os profissionais aprovados que optarem por oferecê-la.

### 4.1 Experiência dentro da plataforma

A teleconsulta não pode obrigar paciente ou profissional a sair da experiência CHRISMED.

Pode utilizar:

- player próprio, preferencial;
- ou tecnologia de terceiro embutida, por exemplo mecanismo equivalente a Google Meet/Meeting/WebRTC, desde que integrada de forma transparente dentro da plataforma.

Objetivo UX: paciente e profissional entram na área CHRISMED e realizam a consulta sem sensação de redirecionamento para outro produto.

### 4.2 Agenda e duração

A agenda usa grade-base de **15 minutos**, mas o profissional escolhe a duração real de cada tipo de atendimento/serviço, por exemplo:

- 15 minutos;
- 30 minutos;
- 45 minutos;
- 60 minutos;
- outra duração compatível com a grade e parametrização permitida.

O profissional pode configurar durações distintas conforme serviço, exame, especialidade ou modalidade.

### 4.3 Preço

O profissional escolhe o preço do atendimento.

Oliver deve apresentar uma **faixa/média sugerida de mercado**, apenas como referência. Não deve impor o preço final do profissional, salvo regra contratual específica futura.

---

## 5. CONSULTA PRESENCIAL

O profissional que habilitar atendimento presencial deve cadastrar um ou mais locais de atendimento.

Para cada consultório/local, registrar:

- nome do local;
- endereço completo;
- número/complemento;
- bairro;
- cidade/UF;
- CEP;
- referências quando aplicável;
- coordenadas geográficas calculadas pelo sistema.

### 5.1 Mapas e rota

Oliver, com apoio das automações do ecossistema, deve gerar automaticamente atalhos de rota.

Na confirmação do atendimento, paciente deve receber links úteis para:

- Google Maps;
- Waze;
- rota com destino já preenchido;
- possibilidade de usar localização atual ou informar origem/CEP.

Esses links devem aparecer na plataforma, e-mail e comunicação transacional via WhatsApp quando habilitada.

---

## 6. CONSULTA DOMICILIAR

O profissional que optar por atendimento domiciliar define:

- dias/horários;
- preço;
- perímetro/raio de atendimento;
- áreas/bairros/CEPs quando necessário;
- duração clínica estimada.

### 6.1 Bloqueio operacional de deslocamento

A CHRISMED deve informar ao paciente que o atendimento domiciliar possui, como referência, **aproximadamente 1 hora de atendimento clínico**, mas a agenda deve reservar **2 horas de bloco operacional**, considerando deslocamento e margem logística.

Objetivo: impedir que um atendimento domiciliar gere conflitos com consultas imediatamente anteriores ou posteriores.

Esse bloqueio deve ser tratado pela agenda como indisponibilidade real, mesmo que apenas parte dele corresponda ao contato clínico.

---

## 7. UMA ÚNICA AGENDA COMPARTILHADA POR PROFISSIONAL

Teleconsulta, presencial e domiciliar não podem existir em calendários independentes que permitam conflito.

O profissional possui **uma agenda operacional compartilhada**, com tipos de atendimento diferentes.

Exemplo válido:

- sexta-feira 08:00 — teleconsulta;
- sexta-feira 08:30 — consulta presencial no consultório;
- outro horário — domiciliar, respeitando bloco logístico de 2 horas.

Qualquer reserva bloqueia aquele período para todas as demais modalidades.

O sistema precisa validar também tempo de deslocamento quando houver sequência fisicamente incompatível entre locais.

---

## 8. PREÇOS, REPASSE E CARTEIRA DO PROFISSIONAL

Regra econômica vigente para atendimentos:

- **60% do valor bruto da consulta para o profissional de saúde**;
- **40% do valor bruto para a CHRISMED**.

A interface deve explicar de forma transparente que, sobre sua parcela, a CHRISMED suporta tributação na faixa informada atualmente de aproximadamente **16%**, além da operação e gestão da plataforma. Essa informação é explicativa e não altera automaticamente o split 60/40.

Não hardcodar tributação como verdade eterna; manter percentual/informação parametrizável e versionada.

### 8.1 Cobrança

A CHRISMED é quem cobra o paciente.

O profissional não recebe diretamente do paciente dentro do fluxo oficial.

### 8.2 Repasse

Regra consolidada mais recente deste Intake:

- repasse **D37** para pagamentos via PIX;
- repasse **D37** para pagamentos via cartão;
- considerar a janela operacional informada de 7 dias dentro da política financeira correspondente.

Essa regra substitui referências anteriores divergentes até nova instrução expressa.

Profissional e financeiro CHRISMED devem possuir:

- carteira eletrônica;
- saldo futuro;
- saldo disponível;
- débitos/créditos;
- calendário de repasses;
- relógio regressivo até liberação/pagamento;
- detalhamento por consulta/transação;
- histórico auditável.

---

## 9. REMARCAÇÃO PELO PRÓPRIO USUÁRIO

Paciente e profissional devem poder **remarcar diretamente pela agenda**, inclusive com experiência de arrastar/mover o horário, desde que haja slot compatível.

Remarcar é diferente de cancelar.

### 9.1 Princípio

A CHRISMED quer incentivar remarcação em vez de cancelamento.

Paciente e profissional podem mover o compromisso inclusive no próprio dia, conforme disponibilidade e regras do serviço, sem transformar a ação automaticamente em cancelamento.

O sistema deve:

- exibir claramente direitos e deveres;
- confirmar a mudança;
- atualizar agenda de todas as partes;
- disparar e-mail/WhatsApp;
- registrar histórico da mudança;
- impedir sobreposição;
- preservar pagamento e vínculo da consulta quando a regra permitir;
- manter trilha de auditoria.

### 9.2 Proteção operacional

Monitorar remarcações excessivas ou abusivas sem bloquear arbitrariamente o usuário. O histórico deve permitir futura política de frequência, caso a CHRISMED defina.

---

## 10. CANCELAMENTO DO PACIENTE

Regra a manter distinta da remarcação:

- até 24 horas antes: pode cancelar dentro da regra vigente, sem penalidade e com devolução conforme política financeira;
- com menos de 24 horas: não há reembolso; deve-se priorizar remarcação conforme regra CHRISMED.

A interface deve explicar a consequência antes do usuário confirmar cancelamento.

---

## 11. CANCELAMENTO PELO PROFISSIONAL

O profissional também pode remarcar sem tratar a ação como cancelamento, desde que siga o fluxo de remarcação.

Se optar por **cancelar** atendimento confirmado, entra em fluxo próprio.

### 11.1 Cancelamento com antecedência superior a 24 horas

- sem multa financeira;
- PegaAgenda é acionado automaticamente para tentar substituir o profissional;
- profissionais compatíveis recebem oportunidade sem bônus adicional;
- se não houver substituto dentro do prazo operacional, paciente é informado e convidado a remarcar.

### 11.2 Cancelamento com 24 horas ou menos

Aplicar penalidade equivalente a **10% do valor bruto da consulta**, lançada como débito na carteira do profissional que cancelou.

Esse débito é compensado nos próximos valores a receber.

Distribuição econômica da penalidade:

- **5% do valor bruto da consulta** = bônus para o profissional substituto que aceitar o PegaAgenda urgente;
- **5% do valor bruto da consulta** = fundo de recuperação do paciente prejudicado.

### 11.3 Fundo de recuperação do paciente

Os 5% destinados à CHRISMED **não são receita da clínica**.

Devem ser contabilizados separadamente e utilizados para:

- cupom de desconto;
- pedido de desculpas;
- remarketing/reconquista;
- benefício futuro ao paciente impactado;
- outras ações de recuperação autorizadas pela CHRISMED.

No ledger, esse valor deve aparecer como verba/fundo de recuperação do paciente, e não como margem operacional CHRISMED.

Exemplo: consulta de R$ 100 cancelada em cima da hora pelo profissional:

- multa do profissional: R$ 10;
- R$ 5 de bônus ao substituto;
- R$ 5 destinados à recuperação do paciente.

---

## 12. PEGAAGENDA

Qualquer cancelamento de profissional confirmado deve disparar automaticamente o **PegaAgenda**.

Matching deve considerar, conforme o caso:

- profissão;
- especialidade;
- subespecialidade;
- modalidade de atendimento;
- disponibilidade;
- endereço/consultório;
- raio/perímetro;
- idioma;
- requisitos do paciente;
- demais filtros cadastrais pertinentes.

### 12.1 Mais de 24 horas

Profissionais compatíveis recebem aviso de oportunidade para ajudar o paciente, sem bônus extraordinário.

### 12.2 24 horas ou menos

Profissional que assumir recebe bônus adicional de 5% do valor bruto da consulta, financiado pela penalidade do profissional que cancelou.

### 12.3 Sem substituto

Se não houver profissional compatível disponível, paciente deve ser avisado rapidamente e conduzido para remarcação, sem ficar sem informação.

Oliver acompanha toda a jornada.

---

# MÓDULO EVENTOS CHRISMED

## 13. OBJETIVO DO MÓDULO

Eventos é vertical estratégica de receita e relacionamento da CHRISMED.

Problema que resolve: laboratórios, empresas e sociedades médicas investem em encontros, jantares, simpósios e eventos com profissionais de saúde, mas enfrentam dificuldade de captação, confirmação e no-show.

A CHRISMED agrega:

- rede e autoridade da Dra. Christiane;
- captação e convite;
- segmentação;
- confirmação;
- gestão de vagas;
- check-in;
- redução de no-show;
- BI e relatórios em tempo real.

---

## 14. PLANOS DE EVENTOS

Existem três planos previstos.

Regra hoje explicitamente consolidada para o plano inicial:

- **mínimo de 20 profissionais**;
- **R$ 49,90 por profissional**;
- contratação mínima equivalente a **R$ 998,00**.

Os valores/regras dos outros dois planos devem permanecer parametrizáveis e não devem ser inventados até definição expressa.

---

## 15. CRIAÇÃO DO EVENTO

Gestão CHRISMED cria evento pelo dashboard e informa, entre outros:

- contratante;
- nome/título;
- imagem/capa;
- descrição;
- data;
- horário;
- endereço/local;
- capacidade/vagas;
- especialidades/subespecialidades-alvo;
- profissão/área-alvo;
- raio geográfico;
- critérios de elegibilidade;
- participantes de gestão autorizados;
- regras do evento;
- status de publicação.

---

## 16. CONTRATANTE E PARTICIPANTES DE GESTÃO

### 16.1 Contratante

Pode ser, por exemplo:

- laboratório;
- indústria;
- empresa;
- sociedade médica;
- outra organização autorizada.

O contratante é a entidade que compra o serviço.

### 16.2 Participantes de gestão

São representantes autorizados do contratante, diferentes dos convidados.

Exemplos:

- propagandistas;
- vendedores;
- consultores;
- gestores do laboratório.

Dados mínimos:

- nome;
- celular/WhatsApp;
- e-mail.

O exemplo atual prevê até três participantes de gestão, mas a quantidade deve ser parametrizável por plano/evento.

Eles podem acompanhar o evento e executar check-in conforme permissões, sem acesso a dados globais da CHRISMED.

---

## 17. CAPTAÇÃO DE PROFISSIONAIS PARA EVENTOS

Dois fluxos diferentes:

### 17.1 Convite ativo pela CHRISMED

A CHRISMED seleciona profissionais já aprovados com base em filtros.

Canais:

- e-mail nativo obrigatório;
- WhatsApp quando habilitado.

Quando um profissional elegível recebe convite da CHRISMED e aceita, **a participação é confirmada imediatamente**, desde que ainda exista vaga. Não passa novamente pelo comitê.

### 17.2 Descoberta orgânica

Profissional acessa a página pública de Eventos CHRISMED, vê a agenda e solicita participação.

Nesse caso:

- qualquer profissional cadastrado pode visualizar eventos públicos;
- mesmo que esteja fora do filtro de convite, pode manifestar interesse;
- participação **não é automática**;
- solicitação vai para o Comitê de Gestão CHRISMED;
- Comitê aprova ou recusa.

Exemplo: cardiologista pode visualizar evento de gastroenterologia no site e solicitar participação; isso não significa aprovação automática.

---

## 18. FILTROS E RAIO GEOGRÁFICO

Profissional configura raio, em quilômetros, no qual aceita receber convites direcionados.

Exemplo:

- raio configurado: 5 km;
- evento: 6 km do endereço de referência;
- resultado: não recebe convite proativo.

Isso não impede visualização pública do evento no site.

Matching de convite deve considerar:

- CEP/endereço;
- raio;
- profissão;
- especialidade;
- subespecialidade;
- perfil do evento;
- situação cadastral;
- disponibilidade/limites quando aplicável.

---

## 19. IMPORTAÇÃO E CRESCIMENTO DA BASE

CHRISMED deve poder:

- cadastrar profissional manualmente;
- importar planilha;
- convidar leads ainda não cadastrados;
- capturar cadastro orgânico pelo site.

Importar não significa aprovar automaticamente. Novos registros seguem fluxo de validação/comitê quando aplicável.

Objetivo estratégico: quanto maior e melhor segmentada a base de profissionais, maior o valor do módulo Eventos.

---

## 20. COMUNICAÇÃO DE EVENTOS

E-mail é canal nativo e deve funcionar automaticamente.

Ao criar/publicar evento e disparar convites, sistema deve suportar:

- convite;
- confirmação;
- lembretes;
- alteração de data/local;
- confirmação final;
- QR Code;
- instruções de chegada;
- pós-evento;
- pesquisa/NPS;
- comunicação de no-show quando política aplicável.

WhatsApp atua como canal complementar quando habilitado.

---

## 21. QR CODE E CHECK-IN

Após participação confirmada, cada profissional recebe QR Code individual por evento.

No local:

1. representante autorizado escaneia/fotografa o QR Code e confirma check-in; ou
2. busca pelo **CPF** do profissional e confirma manualmente.

Não utilizar telefone nem número de conselho como identificador alternativo de check-in.

QR Code deve ser:

- não previsível;
- individual;
- específico do evento;
- associado ao participante correto;
- protegido contra reutilização indevida.

Registrar:

- data/hora;
- operador que realizou o check-in;
- método (QR ou CPF);
- status final.

---

## 22. NO-SHOW E RESPONSABILIDADE

A jornada deve explicar ao profissional que aceitar um convite representa compromisso, especialmente em eventos com vagas limitadas.

No-show prejudica:

- contratante;
- logística;
- investimento;
- outro profissional que poderia ocupar a vaga.

Registrar histórico de:

- convidado;
- aceitou;
- recusou;
- confirmou;
- compareceu;
- cancelou/desistiu;
- no-show.

Não criar penalidade automática adicional sem definição expressa da CHRISMED.

---

## 23. DASHBOARD E RELATÓRIOS DE EVENTOS

CHRISMED possui visão Master.

Contratante e participantes de gestão veem somente eventos e dados autorizados vinculados ao contratante.

Indicadores em tempo real devem incluir, no mínimo:

- capacidade total;
- vagas disponíveis;
- convidados;
- convites enviados;
- entregues;
- aceitos;
- recusados;
- solicitações orgânicas;
- aprovações pendentes;
- aprovados;
- confirmados;
- check-ins;
- no-shows;
- taxa de ocupação;
- taxa de comparecimento;
- origem dos participantes;
- segmentação por especialidade/subespecialidade;
- desempenho das campanhas/convites.

Relatórios devem ser exportáveis conforme padrão do ecossistema.

---

## 24. OLIVER COMO CAMADA INTELIGENTE

Oliver acompanha Agenda e Eventos.

Na Agenda:

- orienta profissional sobre preços médios sugeridos;
- explica split 60/40;
- explica modalidades;
- explica regras de remarcação/cancelamento;
- ajuda paciente com rota, horário e confirmação;
- acompanha PegaAgenda;
- identifica conflitos e riscos operacionais.

Nos Eventos:

- ajuda a segmentar convidados;
- identifica profissionais compatíveis;
- apoia comunicação;
- alerta sobre vagas, confirmações e risco de no-show;
- acompanha resultados e BI.

Oliver não deve tomar decisões clínicas ou regulatórias fora das permissões definidas.

---

## 25. CRITÉRIO DE ARQUITETURA PARA K1/CAUÃ

Antes de implementar qualquer parte desta frente, garantir:

1. uma única identidade profissional para Agenda e Eventos;
2. taxonomias estruturadas, sem depender de texto livre;
3. agenda compartilhada entre teleconsulta, presencial e domiciliar;
4. teleconsulta dentro da experiência CHRISMED;
5. reserva logística de 2h para domiciliar conforme regra atual;
6. split 60% profissional / 40% CHRISMED;
7. carteira/ledger capaz de registrar multas, bônus e fundo de recuperação;
8. remarcação distinta de cancelamento;
9. PegaAgenda automático;
10. eventos com fluxo convite imediato versus solicitação orgânica sujeita a aprovação;
11. geofiltro configurável por raio;
12. QR Code/CPF para check-in;
13. dashboards e relatórios por permissão;
14. comunicação automática por e-mail e WhatsApp;
15. todas as regras parametrizáveis quando forem suscetíveis a mudança.

---

## 26. REGRA DE DOCUMENTAÇÃO

Este arquivo é o **Intake vivo único** da frente CHRISMED Agenda + Profissionais + PegaAgenda + Eventos.

Quando Raygs fornecer nova regra:

- atualizar este mesmo documento;
- substituir regra antiga quando houver conflito;
- preservar histórico pelo Git;
- não criar vários Intakes concorrentes;
- não executar código automaticamente sem instrução expressa.

**Status:** Intake oficial CHRISMED consolidado.
